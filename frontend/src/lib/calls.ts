export const FundlAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
export const FundlABI = [
    {
        type: "function",
        name: "availableToOwner",
        inputs: [
            {
                name: "_projectId",
                type: "uint256",
                internalType: "uint256",
            },
        ],
        outputs: [
            {
                name: "",
                type: "uint256",
                internalType: "uint256",
            },
        ],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "collectFunding",
        inputs: [
            {
                name: "_projectId",
                type: "uint256",
                internalType: "uint256",
            },
        ],
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "createProject",
        inputs: [
            {
                name: "_tokenAddress",
                type: "address",
                internalType: "address",
            },
            {
                name: "_goalAmount",
                type: "uint256",
                internalType: "uint256",
            },
            {
                name: "_endTime",
                type: "uint256",
                internalType: "uint256",
            },
        ],
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "createRefundRequest",
        inputs: [
            {
                name: "_projectId",
                type: "uint256",
                internalType: "uint256",
            },
        ],
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "fundingByUsersByProject",
        inputs: [
            {
                name: "",
                type: "uint256",
                internalType: "uint256",
            },
            {
                name: "",
                type: "address",
                internalType: "address",
            },
        ],
        outputs: [
            {
                name: "",
                type: "uint256",
                internalType: "uint256",
            },
        ],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "fundl",
        inputs: [
            {
                name: "_projectId",
                type: "uint256",
                internalType: "uint256",
            },
            {
                name: "_amount",
                type: "uint256",
                internalType: "uint256",
            },
        ],
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "ownerWithdrawnAmount",
        inputs: [
            {
                name: "",
                type: "uint256",
                internalType: "uint256",
            },
        ],
        outputs: [
            {
                name: "",
                type: "uint256",
                internalType: "uint256",
            },
        ],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "projectIdCounter",
        inputs: [],
        outputs: [
            {
                name: "",
                type: "uint256",
                internalType: "uint256",
            },
        ],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "projects",
        inputs: [
            {
                name: "",
                type: "uint256",
                internalType: "uint256",
            },
        ],
        outputs: [
            {
                name: "tokenAddress",
                type: "address",
                internalType: "address",
            },
            {
                name: "owner",
                type: "address",
                internalType: "address",
            },
            {
                name: "goalAmount",
                type: "uint256",
                internalType: "uint256",
            },
            {
                name: "raisedAmount",
                type: "uint256",
                internalType: "uint256",
            },
            {
                name: "ownerWithdrawn",
                type: "uint256",
                internalType: "uint256",
            },
            {
                name: "startTime",
                type: "uint256",
                internalType: "uint256",
            },
            {
                name: "endTime",
                type: "uint256",
                internalType: "uint256",
            },
        ],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "refund",
        inputs: [
            {
                name: "_projectId",
                type: "uint256",
                internalType: "uint256",
            },
        ],
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "refundRequestByUsersByProject",
        inputs: [
            {
                name: "",
                type: "uint256",
                internalType: "uint256",
            },
            {
                name: "",
                type: "address",
                internalType: "address",
            },
        ],
        outputs: [
            {
                name: "",
                type: "bool",
                internalType: "bool",
            },
        ],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "totalRefundRequestedAmount",
        inputs: [
            {
                name: "",
                type: "uint256",
                internalType: "uint256",
            },
        ],
        outputs: [
            {
                name: "",
                type: "uint256",
                internalType: "uint256",
            },
        ],
        stateMutability: "view",
    },
    {
        type: "event",
        name: "Collected",
        inputs: [
            {
                name: "projectId",
                type: "uint256",
                indexed: true,
                internalType: "uint256",
            },
            {
                name: "owner",
                type: "address",
                indexed: true,
                internalType: "address",
            },
            {
                name: "amount",
                type: "uint256",
                indexed: false,
                internalType: "uint256",
            },
        ],
        anonymous: false,
    },
    {
        type: "event",
        name: "Funded",
        inputs: [
            {
                name: "projectId",
                type: "uint256",
                indexed: true,
                internalType: "uint256",
            },
            {
                name: "funder",
                type: "address",
                indexed: true,
                internalType: "address",
            },
            {
                name: "amount",
                type: "uint256",
                indexed: false,
                internalType: "uint256",
            },
        ],
        anonymous: false,
    },
    {
        type: "event",
        name: "ProjectCreated",
        inputs: [
            {
                name: "projectId",
                type: "uint256",
                indexed: true,
                internalType: "uint256",
            },
            {
                name: "owner",
                type: "address",
                indexed: true,
                internalType: "address",
            },
        ],
        anonymous: false,
    },
    {
        type: "event",
        name: "ProjectHalted",
        inputs: [
            {
                name: "projectId",
                type: "uint256",
                indexed: true,
                internalType: "uint256",
            },
        ],
        anonymous: false,
    },
    {
        type: "event",
        name: "RefundRequested",
        inputs: [
            {
                name: "projectId",
                type: "uint256",
                indexed: true,
                internalType: "uint256",
            },
            {
                name: "funder",
                type: "address",
                indexed: true,
                internalType: "address",
            },
            {
                name: "amount",
                type: "uint256",
                indexed: false,
                internalType: "uint256",
            },
        ],
        anonymous: false,
    },
    {
        type: "event",
        name: "Refunded",
        inputs: [
            {
                name: "projectId",
                type: "uint256",
                indexed: true,
                internalType: "uint256",
            },
            {
                name: "funder",
                type: "address",
                indexed: true,
                internalType: "address",
            },
            {
                name: "amount",
                type: "uint256",
                indexed: false,
                internalType: "uint256",
            },
        ],
        anonymous: false,
    },
    {
        type: "error",
        name: "AlreadyRequestedRefund",
        inputs: [],
    },
    {
        type: "error",
        name: "FundingGoalExceeded",
        inputs: [],
    },
    {
        type: "error",
        name: "InsufficientRefundVotes",
        inputs: [],
    },
    {
        type: "error",
        name: "InvalidAmount",
        inputs: [],
    },
    {
        type: "error",
        name: "InvalidEndTime",
        inputs: [],
    },
    {
        type: "error",
        name: "InvalidToken",
        inputs: [],
    },
    {
        type: "error",
        name: "NotFunder",
        inputs: [],
    },
    {
        type: "error",
        name: "NotOwner",
        inputs: [],
    },
    {
        type: "error",
        name: "NothingToCollect",
        inputs: [],
    },
    {
        type: "error",
        name: "ProjectNotFound",
        inputs: [],
    },
    {
        type: "error",
        name: "ReentrancyGuardReentrantCall",
        inputs: [],
    },
    {
        type: "error",
        name: "RefundNotRequested",
        inputs: [],
    },
    {
        type: "error",
        name: "RefundVoteActive",
        inputs: [],
    },
    {
        type: "error",
        name: "SafeERC20FailedOperation",
        inputs: [
            {
                name: "token",
                type: "address",
                internalType: "address",
            },
        ],
    },
];

export const MockTokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const MockTokenABI = [
    {
        type: "function",
        name: "approve",
        inputs: [
            {
                name: "_spender",
                type: "address",
                internalType: "address",
            },
            {
                name: "_value",
                type: "uint256",
                internalType: "uint256",
            },
        ],
        outputs: [],
        stateMutability: "nonpayable",
    },
];
