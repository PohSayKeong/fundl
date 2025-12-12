// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "../lib/forge-std/src/Test.sol";
import {Fundl} from "../src/Fundl.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract FundlTest is Test {
    Fundl public fundl;
    MockERC20 public token;

    address public owner;
    address public user1;
    address public user2;
    address public user3;

    uint256 public projectId;
    uint256 public constant INITIAL_BALANCE = 1000 ether;
    uint256 public constant GOAL_AMOUNT = 100 ether;
    uint256 public constant PROJECT_DURATION = 60 days;

    function setUp() public {
        fundl = new Fundl();
        token = new MockERC20("Test Token", "TEST");

        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        user3 = address(0x3);

        // Mint tokens to users
        token.mint(owner, INITIAL_BALANCE);
        token.mint(user1, INITIAL_BALANCE);
        token.mint(user2, INITIAL_BALANCE);
        token.mint(user3, INITIAL_BALANCE);

        // Create a project
        createTestProject();
    }

    function createTestProject() internal {
        uint256 endTime = block.timestamp + PROJECT_DURATION;
        fundl.createProject(address(token), GOAL_AMOUNT, endTime);
        projectId = 0; // First project ID
    }

    // Helper function to get project details
    function getProject(
        uint256 _projectId
    )
        internal
        view
        returns (
            address tokenAddress,
            address projectOwner,
            uint256 goalAmount,
            uint256 raisedAmount,
            uint256 ownerWithdrawn,
            uint256 startTime,
            uint256 endTime
        )
    {
        (
            tokenAddress,
            projectOwner,
            goalAmount,
            raisedAmount,
            ownerWithdrawn,
            startTime,
            endTime
        ) = fundl.projects(_projectId);
    }

    // Test project creation
    function testCreateProject() public {
        uint256 initialProjectCount = fundl.projectIdCounter();
        uint256 endTime = block.timestamp + 30 days;

        fundl.createProject(address(token), 50 ether, endTime);

        // Check if project counter incremented
        assertEq(fundl.projectIdCounter(), initialProjectCount + 1);

        // Get the project and verify its details
        (
            address tokenAddress,
            address projectOwner,
            uint256 goalAmount,
            uint256 raisedAmount,
            uint256 ownerWithdrawn,
            uint256 startTime,
            uint256 projectEndTime
        ) = getProject(initialProjectCount);

        assertEq(tokenAddress, address(token));
        assertEq(projectOwner, owner);
        assertEq(goalAmount, 50 ether);
        assertEq(raisedAmount, 0);
        assertEq(ownerWithdrawn, 0);
        assertEq(startTime, block.timestamp);
        assertEq(projectEndTime, endTime);
    }

    // Test creating project with invalid token
    function testCreateProjectInvalidToken() public {
        uint256 endTime = block.timestamp + 30 days;
        vm.expectRevert(Fundl.InvalidToken.selector);
        fundl.createProject(address(0), 50 ether, endTime);
    }

    // Test creating project with invalid end time
    function testCreateProjectInvalidEndTime() public {
        vm.expectRevert(Fundl.InvalidEndTime.selector);
        fundl.createProject(address(token), 50 ether, block.timestamp);
    }

    // Test funding a project
    function testFundl() public {
        uint256 fundAmount = 25 ether;
        uint256 ownerBalanceBefore = token.balanceOf(owner);
        uint256 fundlBalanceBefore = token.balanceOf(address(fundl));

        // Approve token transfer
        token.approve(address(fundl), fundAmount);

        // Fund the project
        fundl.fundl(projectId, fundAmount);

        // Get project details
        (, , , uint256 raisedAmount, , , ) = getProject(projectId);
        assertEq(raisedAmount, fundAmount);

        // Check balances
        assertEq(token.balanceOf(owner), ownerBalanceBefore - fundAmount);
        assertEq(
            token.balanceOf(address(fundl)),
            fundlBalanceBefore + fundAmount
        );
    }

    // Test funding from multiple users
    function testFundlMultipleUsers() public {
        uint256 user1Amount = 20 ether;
        uint256 user2Amount = 30 ether;
        uint256 user3Amount = 10 ether;

        // User 1 funds
        vm.startPrank(user1);
        token.approve(address(fundl), user1Amount);
        fundl.fundl(projectId, user1Amount);
        vm.stopPrank();

        // User 2 funds
        vm.startPrank(user2);
        token.approve(address(fundl), user2Amount);
        fundl.fundl(projectId, user2Amount);
        vm.stopPrank();

        // User 3 funds
        vm.startPrank(user3);
        token.approve(address(fundl), user3Amount);
        fundl.fundl(projectId, user3Amount);
        vm.stopPrank();

        // Get project details
        (, , , uint256 raisedAmount, , , ) = getProject(projectId);
        assertEq(raisedAmount, user1Amount + user2Amount + user3Amount);

        // Verify individual contributions
        assertEq(fundl.fundingByUsersByProject(projectId, user1), user1Amount);
        assertEq(fundl.fundingByUsersByProject(projectId, user2), user2Amount);
        assertEq(fundl.fundingByUsersByProject(projectId, user3), user3Amount);
    }

    // Test funding with zero amount (should fail)
    function testFundlZeroAmount() public {
        token.approve(address(fundl), 0);
        vm.expectRevert(Fundl.InvalidAmount.selector);
        fundl.fundl(projectId, 0);
    }

    // Test funding exceeding the goal amount (should fail)
    function testFundlExceedingGoal() public {
        uint256 exceedingAmount = GOAL_AMOUNT + 1;
        token.approve(address(fundl), exceedingAmount);
        vm.expectRevert(Fundl.FundingGoalExceeded.selector);
        fundl.fundl(projectId, exceedingAmount);
    }

    // Test funding non-existent project
    function testFundlNonExistentProject() public {
        uint256 fundAmount = 10 ether;
        token.approve(address(fundl), fundAmount);
        vm.expectRevert(Fundl.ProjectNotFound.selector);
        fundl.fundl(999, fundAmount);
    }

    // Test availableToOwner view function
    function testAvailableToOwner() public {
        // Fund the project
        vm.prank(user1);
        token.approve(address(fundl), GOAL_AMOUNT);
        vm.prank(user1);
        fundl.fundl(projectId, GOAL_AMOUNT);

        // At start, nothing available yet
        assertEq(fundl.availableToOwner(projectId), 0);

        // Warp to 25% through project (15 days out of 60)
        vm.warp(block.timestamp + 15 days);
        uint256 expectedAt25Percent = (GOAL_AMOUNT * 15 days) /
            PROJECT_DURATION;
        assertEq(fundl.availableToOwner(projectId), expectedAt25Percent);

        // Warp to 50% through project
        vm.warp(block.timestamp + 15 days); // Total 30 days
        uint256 expectedAt50Percent = (GOAL_AMOUNT * 30 days) /
            PROJECT_DURATION;
        assertEq(fundl.availableToOwner(projectId), expectedAt50Percent);

        // Warp past end time
        vm.warp(block.timestamp + 100 days);
        assertEq(fundl.availableToOwner(projectId), GOAL_AMOUNT);
    }

    // Test collecting funding
    function testCollectFunding() public {
        // Fund from user1
        vm.prank(user1);
        token.approve(address(fundl), GOAL_AMOUNT);
        vm.prank(user1);
        fundl.fundl(projectId, GOAL_AMOUNT);

        uint256 ownerBalanceBefore = token.balanceOf(owner);

        // Warp time forward 30 days (50% of 60 day duration)
        vm.warp(block.timestamp + 30 days);

        // Calculate expected amount (50% of goal)
        uint256 expectedAmount = (GOAL_AMOUNT * 30 days) / PROJECT_DURATION;

        // Collect funding
        fundl.collectFunding(projectId);

        // Verify balance change
        uint256 ownerBalanceAfter = token.balanceOf(owner);
        assertEq(
            ownerBalanceAfter - ownerBalanceBefore,
            expectedAmount,
            "Owner should receive 50% of funds after 50% of time"
        );

        // Verify tracking
        assertEq(fundl.ownerWithdrawnAmount(projectId), expectedAmount);
    }

    // Test collecting multiple times
    function testCollectFundingMultipleTimes() public {
        vm.prank(user1);
        token.approve(address(fundl), GOAL_AMOUNT);
        vm.prank(user1);
        fundl.fundl(projectId, GOAL_AMOUNT);

        // Collect at 25%
        vm.warp(block.timestamp + 15 days);
        fundl.collectFunding(projectId);
        uint256 firstCollection = fundl.ownerWithdrawnAmount(projectId);

        // Collect at 50%
        vm.warp(block.timestamp + 15 days);
        fundl.collectFunding(projectId);
        uint256 secondCollection = fundl.ownerWithdrawnAmount(projectId);

        // Second collection should be more than first
        assertGt(secondCollection, firstCollection);
    }

    // Test non-owner trying to collect funding (should fail)
    function testNonOwnerCollectFunding() public {
        vm.prank(user1);
        token.approve(address(fundl), 25 ether);
        vm.prank(user1);
        fundl.fundl(projectId, 25 ether);

        vm.warp(block.timestamp + 15 days);

        vm.prank(user1);
        vm.expectRevert(Fundl.NotOwner.selector);
        fundl.collectFunding(projectId);
    }

    // Test collecting with nothing available
    function testCollectFundingNothingAvailable() public {
        vm.prank(user1);
        token.approve(address(fundl), 25 ether);
        vm.prank(user1);
        fundl.fundl(projectId, 25 ether);

        // Try to collect immediately (nothing unlocked yet)
        vm.expectRevert(Fundl.NothingToCollect.selector);
        fundl.collectFunding(projectId);
    }

    // Test refund request
    function testCreateRefundRequest() public {
        uint256 fundAmount = 50 ether;

        vm.prank(user1);
        token.approve(address(fundl), fundAmount);
        vm.prank(user1);
        fundl.fundl(projectId, fundAmount);

        uint256 refundAmount = 10 ether;

        vm.prank(user2);
        token.approve(address(fundl), refundAmount);
        vm.prank(user2);
        fundl.fundl(projectId, refundAmount);

        // refund request, project not halted yet
        vm.prank(user2);
        fundl.createRefundRequest(projectId);

        // If threshold is not crossed, request is recorded
        assertTrue(fundl.refundRequestByUsersByProject(projectId, user2));
        assertEq(fundl.totalRefundRequestedAmount(projectId), refundAmount);
    }

    // Test refund with weighted voting (50% threshold)
    function testRefundWeightedVoting() public {
        uint256 user1Amount = 30 ether; // 30% of 100
        uint256 user2Amount = 40 ether; // 40% of 100
        uint256 user3Amount = 30 ether; // 30% of 100

        // All users fund
        vm.prank(user1);
        token.approve(address(fundl), user1Amount);
        vm.prank(user1);
        fundl.fundl(projectId, user1Amount);

        vm.prank(user2);
        token.approve(address(fundl), user2Amount);
        vm.prank(user2);
        fundl.fundl(projectId, user2Amount);

        vm.prank(user3);
        token.approve(address(fundl), user3Amount);
        vm.prank(user3);
        fundl.fundl(projectId, user3Amount);

        // User1 and User2 request refunds (70% of funds)
        vm.prank(user1);
        fundl.createRefundRequest(projectId);

        uint256 user2BalanceBefore = token.balanceOf(user2);
        vm.prank(user2);
        fundl.createRefundRequest(projectId);

        // Threshold should be reached (70% >= 50%)
        // User2 refunded
        assertEq(
            fundl.fundingByUsersByProject(projectId, user2),
            0,
            "User2 should be refunded"
        );
        assertEq(
            token.balanceOf(user2),
            user2BalanceBefore + user2Amount,
            "User2 should receive full refund"
        );

        // User1 can now claim refund
        uint256 user1BalanceBefore = token.balanceOf(user1);
        vm.prank(user1);
        fundl.refund(projectId);

        assertEq(
            token.balanceOf(user1),
            user1BalanceBefore + user1Amount,
            "User1 should receive full refund"
        );
    }

    // Test partial refund when insufficient balance
    function testPartialRefund() public {
        uint256 user1Amount = 50 ether;
        uint256 user2Amount = 50 ether;

        // Both users fund
        vm.prank(user1);
        token.approve(address(fundl), user1Amount);
        vm.prank(user1);
        fundl.fundl(projectId, user1Amount);

        vm.prank(user2);
        token.approve(address(fundl), user2Amount);
        vm.prank(user2);
        fundl.fundl(projectId, user2Amount);

        // Owner collects some funds (warp time)
        vm.warp(block.timestamp + PROJECT_DURATION / 2);
        fundl.collectFunding(projectId);
        uint256 ownerCollected = fundl.ownerWithdrawnAmount(projectId);
        assertEq(
            ownerCollected,
            (user1Amount + user2Amount) / 2,
            "Owner should have collected half the funds"
        );

        // User1 gets refund (partial due to owner withdrawal)
        uint256 user1BalanceBefore = token.balanceOf(user1);
        (, , , uint256 raisedAmount, , , ) = getProject(projectId);
        uint256 availableBalance = raisedAmount - ownerCollected;
        uint256 expectedRefund = (user1Amount * availableBalance) /
            raisedAmount;

        vm.prank(user1);
        fundl.createRefundRequest(projectId);
        assertEq(
            token.balanceOf(user1),
            user1BalanceBefore + expectedRefund,
            "User1 should receive partial refund"
        );

        uint256 user2BalanceBefore = token.balanceOf(user2);
        vm.prank(user2);
        fundl.createRefundRequest(projectId);
        assertGt(
            token.balanceOf(user2),
            user2BalanceBefore,
            "User2 should receive some refund"
        );
    }

    // Test creating refund request without funding (should fail)
    function testCreateRefundRequestWithoutFunding() public {
        vm.prank(user1);
        vm.expectRevert(Fundl.NotFunder.selector);
        fundl.createRefundRequest(projectId);
    }

    // Test creating duplicate refund request (should fail)
    function testDuplicateRefundRequest() public {
        uint256 user1Amount = 10 ether;
        uint256 user2Amount = 50 ether;

        // Both users fund
        vm.prank(user1);
        token.approve(address(fundl), user1Amount);
        vm.prank(user1);
        fundl.fundl(projectId, user1Amount);

        vm.prank(user2);
        token.approve(address(fundl), user2Amount);
        vm.prank(user2);
        fundl.fundl(projectId, user2Amount);

        // First refund request should succeed
        vm.prank(user1);
        fundl.createRefundRequest(projectId);

        // Second refund request should fail
        vm.prank(user1);
        vm.expectRevert(Fundl.AlreadyRequestedRefund.selector);
        fundl.createRefundRequest(projectId);
    }

    // Test refunding without sufficient votes (should fail)
    function testRefundWithoutSufficientVotes() public {
        uint256 user1Amount = 20 ether;
        uint256 user2Amount = 80 ether;

        // Two users fund (20% and 80%)
        vm.prank(user1);
        token.approve(address(fundl), user1Amount);
        vm.prank(user1);
        fundl.fundl(projectId, user1Amount);

        vm.prank(user2);
        token.approve(address(fundl), user2Amount);
        vm.prank(user2);
        fundl.fundl(projectId, user2Amount);

        // Only user1 requests refund (20% < 50%)
        vm.prank(user1);
        fundl.createRefundRequest(projectId);

        // Attempt to refund should fail
        vm.prank(user1);
        vm.expectRevert(Fundl.InsufficientRefundVotes.selector);
        fundl.refund(projectId);
    }

    // Test refund halts project
    function testRefundHaltsProject() public {
        uint256 user1Amount = 5 ether;
        uint256 user2Amount = 2 ether;
        uint256 user3Amount = 5 ether;

        // All users fund
        vm.prank(user1);
        token.approve(address(fundl), user1Amount);
        vm.prank(user1);
        fundl.fundl(projectId, user1Amount);

        vm.prank(user2);
        token.approve(address(fundl), user2Amount);
        vm.prank(user2);
        fundl.fundl(projectId, user2Amount);

        vm.prank(user3);
        token.approve(address(fundl), user3Amount);
        vm.prank(user3);
        fundl.fundl(projectId, user3Amount);

        // User1 requests refund (5/12 < 50%, not halted yet)
        vm.prank(user1);
        fundl.createRefundRequest(projectId);

        // Project should NOT be halted yet, funding and collection should work
        // User2 requests refund (now 7/12 > 50% == threshold)
        vm.prank(user2);
        fundl.createRefundRequest(projectId);

        // Project should now be halted - new funding should fail
        vm.prank(user1);
        token.approve(address(fundl), 1 ether);
        vm.prank(user1);
        vm.expectRevert(Fundl.RefundVoteActive.selector);
        fundl.fundl(projectId, 1 ether);

        // Owner collection should also fail
        vm.warp(block.timestamp + 30 days);
        assertEq(fundl.availableToOwner(projectId), 0);
        vm.expectRevert(Fundl.RefundVoteActive.selector);
        fundl.collectFunding(projectId);
    }

    // Test: collect all remaining after endTime
    function testCollectFundingAfterEndTimeDrainsAll() public {
        // Fund project fully
        vm.prank(user1);
        token.approve(address(fundl), GOAL_AMOUNT);
        vm.prank(user1);
        fundl.fundl(projectId, GOAL_AMOUNT);

        // Warp past end time
        vm.warp(block.timestamp + PROJECT_DURATION + 1 days);

        // Owner collects all remaining unlocked funds
        uint256 ownerBefore = token.balanceOf(owner);
        fundl.collectFunding(projectId);
        uint256 ownerAfter = token.balanceOf(owner);

        // Entire goal should be available (no prior withdrawals)
        assertEq(ownerAfter - ownerBefore, GOAL_AMOUNT);
        assertEq(fundl.ownerWithdrawnAmount(projectId), GOAL_AMOUNT);
    }

    // Test: dynamic resume after refunds drop below threshold
    function testResumeAfterRefundsDropBelowThreshold() public {
        vm.prank(user1);
        token.approve(address(fundl), 6 ether);
        vm.prank(user1);
        fundl.fundl(projectId, 6 ether);

        vm.prank(user2);
        token.approve(address(fundl), 4 ether);
        vm.prank(user2);
        fundl.fundl(projectId, 4 ether);

        // user1 requests refund -> threshold met, project halted
        uint256 u1Before = token.balanceOf(user1);
        vm.prank(user1);
        fundl.createRefundRequest(projectId);
        assertGt(token.balanceOf(user1), u1Before);

        // Now threshold should drop below 50%; funding and collection resume
        vm.prank(user3);
        token.approve(address(fundl), 5 ether);
        vm.prank(user3);
        fundl.fundl(projectId, 5 ether);

        // Owner can collect again
        vm.warp(block.timestamp + 15 days);
        uint256 ownerBefore = token.balanceOf(owner);
        fundl.collectFunding(projectId);
        assertGt(token.balanceOf(owner), ownerBefore);
    }

    // Test: refund when project balance is zero reverts
    function testRefundWhenNoProjectBalance() public {
        // Fund and then owner withdraws all unlocked funds after end
        vm.prank(user1);
        token.approve(address(fundl), 40 ether);
        vm.prank(user1);
        fundl.fundl(projectId, 40 ether);

        vm.warp(block.timestamp + PROJECT_DURATION + 1 days);
        fundl.collectFunding(projectId); // withdraw all available

        // Request refund
        vm.prank(user1);
        vm.expectRevert(Fundl.NothingToCollect.selector);
        fundl.createRefundRequest(projectId);
    }

    // Test: availableToOwner on non-existent project returns 0
    function testAvailableToOwnerNonExistentProject() public view {
        assertEq(fundl.availableToOwner(999), 0);
    }

    // Test: immediate refund on request when threshold is crossed
    function testImmediateRefundOnThresholdCross() public {
        uint256 user1Amount = 40 ether;
        uint256 user2Amount = 10 ether;
        uint256 totalAmount = user1Amount + user2Amount;

        // user1 funds 40, user2 funds 10 (total 50)
        vm.prank(user1);
        token.approve(address(fundl), 40 ether);
        vm.prank(user1);
        fundl.fundl(projectId, 40 ether);

        vm.prank(user2);
        token.approve(address(fundl), 10 ether);
        vm.prank(user2);
        fundl.fundl(projectId, 10 ether);

        // user1 requests refund (40/50 = 80% > 50%), triggers threshold
        uint256 user1BalanceBefore = token.balanceOf(user1);
        vm.prank(user1);
        fundl.createRefundRequest(projectId);

        // user1 should be immediately refunded their full contribution
        uint256 user1BalanceAfter = token.balanceOf(user1);
        assertEq(
            user1BalanceAfter - user1BalanceBefore,
            40 ether,
            "user1 should be auto-refunded on threshold crossing"
        );

        // user1's contribution and refund flag should be cleared
        assertEq(fundl.fundingByUsersByProject(projectId, user1), 0);
        assertFalse(fundl.refundRequestByUsersByProject(projectId, user1));

        // Project should not be halted since only one funder
        vm.prank(user3);
        token.approve(address(fundl), 1 ether);
        vm.prank(user3);
        fundl.fundl(projectId, 1 ether);
        assertEq(
            fundl.fundingByUsersByProject(projectId, user3),
            1 ether,
            "Project should not be halted; user3 funding should succeed"
        );
    }
}
