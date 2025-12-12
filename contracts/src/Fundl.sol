// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {
    IERC20
} from "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {
    SafeERC20
} from "../lib/openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {
    ReentrancyGuard
} from "../lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";

contract Fundl is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Project {
        // Storage packed: two addresses in early slots
        address tokenAddress;
        address owner;
        // Funding Related
        uint256 goalAmount;
        uint256 raisedAmount; // total currently accounted in contract (includes refunded not-yet-processed? we update on refunds)
        uint256 ownerWithdrawn;
        // Time Related
        uint256 startTime;
        uint256 endTime;
    }

    // Storage
    mapping(uint256 => Project) public projects;
    // user => amount funded for a project
    mapping(uint256 => mapping(address => uint256))
        public fundingByUsersByProject;
    // did user request refund (voting + request)
    mapping(uint256 => mapping(address => bool))
        public refundRequestByUsersByProject;
    // total amount currently requested for refund (sum of contributions for those who asked)
    mapping(uint256 => uint256) public totalRefundRequestedAmount;
    // amount owner has withdrawn so far (so we don't double-withdraw)
    mapping(uint256 => uint256) public ownerWithdrawnAmount;

    uint256 public projectIdCounter;

    event ProjectCreated(uint256 indexed projectId, address indexed owner);
    event Funded(
        uint256 indexed projectId,
        address indexed funder,
        uint256 amount
    );
    event RefundRequested(
        uint256 indexed projectId,
        address indexed funder,
        uint256 amount
    );
    event Refunded(
        uint256 indexed projectId,
        address indexed funder,
        uint256 amount
    );
    event Collected(
        uint256 indexed projectId,
        address indexed owner,
        uint256 amount
    );
    event ProjectHalted(uint256 indexed projectId);

    // Constants
    uint256 private constant REFUND_DENOMINATOR = 2;

    // Custom errors for gas efficiency
    error InvalidToken();
    error InvalidEndTime();
    error ProjectNotFound();
    error NotOwner();
    error InvalidAmount();
    error FundingGoalExceeded();
    error NotFunder();
    error RefundNotRequested();
    error AlreadyRequestedRefund();
    error InsufficientRefundVotes();
    error NothingToCollect();
    error RefundVoteActive();

    function _refundVoteActive(uint256 _projectId) private view returns (bool) {
        Project storage p = projects[_projectId];
        uint256 raised = p.raisedAmount;
        if (raised == 0) return false;
        return
            totalRefundRequestedAmount[_projectId] * REFUND_DENOMINATOR >=
            raised;
    }

    // --- Create project ---
    function createProject(
        address _tokenAddress,
        uint256 _goalAmount,
        uint256 _endTime
    ) public {
        if (_tokenAddress == address(0)) revert InvalidToken();
        if (_endTime <= block.timestamp) revert InvalidEndTime();
        projects[projectIdCounter] = Project({
            owner: msg.sender,
            tokenAddress: _tokenAddress,
            goalAmount: _goalAmount,
            raisedAmount: 0,
            ownerWithdrawn: 0,
            startTime: block.timestamp,
            endTime: _endTime
        });
        emit ProjectCreated(projectIdCounter, msg.sender);
        unchecked {
            projectIdCounter++;
        }
    }

    // --- Fund project ---
    function fundl(uint256 _projectId, uint256 _amount) external nonReentrant {
        Project storage p = projects[_projectId];
        if (p.owner == address(0)) revert ProjectNotFound();
        if (_amount == 0) revert InvalidAmount();
        if (p.raisedAmount + _amount > p.goalAmount)
            revert FundingGoalExceeded();
        // If refund voting threshold is reached, disallow new funding
        if (_refundVoteActive(_projectId)) revert RefundVoteActive();

        // Update funder bookkeeping
        fundingByUsersByProject[_projectId][msg.sender] += _amount;
        p.raisedAmount += _amount;

        // Transfer tokens into contract
        IERC20(p.tokenAddress).safeTransferFrom(
            msg.sender,
            address(this),
            _amount
        );

        emit Funded(_projectId, msg.sender, _amount);
    }

    // --- Request refund (vote + mark) ---
    // When a funder requests a refund, we add their funded amount to totalRefundRequestedAmount.
    function createRefundRequest(uint256 _projectId) external nonReentrant {
        Project storage p = projects[_projectId];
        if (p.owner == address(0)) revert ProjectNotFound();
        uint256 funded = fundingByUsersByProject[_projectId][msg.sender];
        if (funded == 0) revert NotFunder();
        if (refundRequestByUsersByProject[_projectId][msg.sender])
            revert AlreadyRequestedRefund();

        bool wasRefundVoteActive = _refundVoteActive(_projectId);

        // Mark that the user has requested a refund
        refundRequestByUsersByProject[_projectId][msg.sender] = true;
        totalRefundRequestedAmount[_projectId] += funded;
        emit RefundRequested(_projectId, msg.sender, funded);

        // If this request causes the threshold to be crossed, emit halt and immediately refund the requester
        if (!wasRefundVoteActive && _refundVoteActive(_projectId)) {
            _processRefund(_projectId, msg.sender);
        }
    }

    // --- Refund (when threshold reached) ---
    // Any funder who requested a refund can call this once threshold is met
    function refund(uint256 _projectId) external nonReentrant {
        Project storage p = projects[_projectId];
        if (p.owner == address(0)) revert ProjectNotFound();
        uint256 funded = fundingByUsersByProject[_projectId][msg.sender];
        if (funded == 0) revert NotFunder();
        if (!refundRequestByUsersByProject[_projectId][msg.sender])
            revert RefundNotRequested();
        if (!_refundVoteActive(_projectId)) revert InsufficientRefundVotes();

        _processRefund(_projectId, msg.sender);
    }

    // --- Owner collects streaming funds linearly over time (capped by raised amount and previous withdrawals) ---
    function collectFunding(uint256 _projectId) external nonReentrant {
        Project storage p = projects[_projectId];
        if (p.owner == address(0)) revert ProjectNotFound();
        if (msg.sender != p.owner) revert NotOwner();
        // If refund voting threshold is reached, disallow owner collection to protect refunds
        if (_refundVoteActive(_projectId)) revert RefundVoteActive();

        uint256 toCollect = availableToOwner(_projectId);
        if (toCollect == 0) revert NothingToCollect();

        // update bookkeeping then transfer
        ownerWithdrawnAmount[_projectId] += toCollect;

        IERC20(p.tokenAddress).safeTransfer(p.owner, toCollect);

        emit Collected(_projectId, p.owner, toCollect);
    }

    // Helper view: how much owner can withdraw now (earned vs reserved)
    function availableToOwner(
        uint256 _projectId
    ) public view returns (uint256) {
        Project storage p = projects[_projectId];
        if (p.owner == address(0)) return 0;
        // If refund vote active, owner withdrawals should be blocked
        if (_refundVoteActive(_projectId)) return 0;
        uint256 elapsed = block.timestamp > p.endTime
            ? p.endTime - p.startTime
            : block.timestamp - p.startTime;
        uint256 duration = p.endTime - p.startTime;
        if (duration == 0) return 0;

        uint256 unlocked = (p.raisedAmount * elapsed) / duration;
        uint256 alreadyWithdrawn = ownerWithdrawnAmount[_projectId];
        if (unlocked <= alreadyWithdrawn) return 0;
        return unlocked - alreadyWithdrawn;
    }

    function _processRefund(uint256 _projectId, address requester) private {
        Project storage p = projects[_projectId];
        uint256 funded = fundingByUsersByProject[_projectId][requester];
        uint256 projectBalance = p.raisedAmount -
            ownerWithdrawnAmount[_projectId];
        if (projectBalance == 0) revert NothingToCollect();

        // Calculate proportional refund
        uint256 amountToSend = (funded * projectBalance) / p.raisedAmount;
        if (amountToSend == 0) revert NothingToCollect();

        // Safe subtraction: cap at zero
        fundingByUsersByProject[_projectId][requester] -= amountToSend;

        if (fundingByUsersByProject[_projectId][requester] == 0) {
            refundRequestByUsersByProject[_projectId][requester] = false;
        }
        totalRefundRequestedAmount[_projectId] -= amountToSend;

        p.raisedAmount -= amountToSend;

        IERC20(p.tokenAddress).safeTransfer(requester, amountToSend);
        emit Refunded(_projectId, requester, amountToSend);
    }
}
