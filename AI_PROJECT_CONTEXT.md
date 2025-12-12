# AI Project Context - Fundl

**Document Purpose**: This document provides comprehensive context for AI assistants to understand the Fundl crowdfunding platform architecture, mechanics, and implementation details.

---

## Project Overview

**Fundl** is a crowdfunding platform that enables time-based payment streaming with refund voting mechanisms. Projects receive continuous fund disbursement linearly over their duration, while funders maintain protection through weighted refund voting.

**Key Innovation**: Linear time-based streaming with dynamic halt/resume based on refund votes reaching threshold.

---

## Architecture

### Tech Stack

- **Frontend**: Next.js 15, React, Privy Auth, Wagmi, Viem, TailwindCSS, Shadcn UI
- **Smart Contracts**: Solidity ^0.8.13, OpenZeppelin, Foundry
- **Blockchain**: Base Sepolia (production), Anvil (development)
- **Auth**: Privy (embedded wallets + external wallet support)

### Directory Structure

```
fundl/
├── contracts/              # Solidity smart contracts
│   ├── src/
│   │   ├── Fundl.sol      # Main crowdfunding contract
│   │   └── Counter.sol    # Example contract
│   ├── test/              # Contract tests
│   ├── script/            # Deployment scripts
│   └── lib/               # Dependencies (forge-std, OpenZeppelin)
│
├── frontend/              # Next.js application
│   ├── src/
│   │   ├── app/          # App router pages
│   │   │   ├── page.tsx                    # Landing page
│   │   │   ├── create-project/page.tsx     # Project creation
│   │   │   ├── projects/[id]/page.tsx      # Project detail view
│   │   │   └── boost-project/page.tsx      # Boost feature
│   │   ├── components/   # React components
│   │   │   ├── ui/       # Shadcn components
│   │   │   ├── navbar.tsx
│   │   │   ├── providers.tsx  # Privy + Wagmi providers
│   │   │   └── theme-switcher.tsx
│   │   ├── sections/     # Landing page sections
│   │   └── lib/
│   │       ├── calls.ts  # Contract ABIs and addresses
│   │       └── utils.ts
│   └── public/
```

---

## Smart Contract Mechanics (Fundl.sol)

### Core Concepts

1. **Time-Based Streaming**: Funds unlock linearly over the project duration (startTime → endTime)
2. **Weighted Refund Voting**: Refund threshold based on contributed amounts, not vote count
3. **Dynamic Halting**: Projects halt when refund votes reach ≥50% of raised funds, but can resume if votes drop
4. **Partial Refunds**: Users receive what's available if project balance is insufficient

### Project Structure

```solidity
struct Project {
    address tokenAddress;      // ERC20 token for funding
    address owner;             // Project creator
    uint256 goalAmount;        // Funding cap
    uint256 raisedAmount;      // Current total raised
    uint256 ownerWithdrawn;    // Tracking field (unused in logic)
    uint256 startTime;         // Project start (creation timestamp)
    uint256 endTime;           // Project end (set at creation)
}
```

**Note**: `ownerWithdrawn` exists in struct but `ownerWithdrawnAmount` mapping is used for actual tracking.

### State Mappings

```solidity
// Core project data
mapping(uint256 => Project) public projects;

// User contribution tracking
mapping(uint256 => mapping(address => uint256)) public fundingByUsersByProject;

// Refund voting state
mapping(uint256 => mapping(address => bool)) public refundRequestByUsersByProject;
mapping(uint256 => uint256) public totalRefundRequestedAmount;

// Owner withdrawal tracking
mapping(uint256 => uint256) public ownerWithdrawnAmount;

// Project ID counter
uint256 public projectIdCounter;
```

### Key Functions

#### 1. `createProject(address _tokenAddress, uint256 _goalAmount, uint256 _endTime)`

- Creates new project with specified ERC20 token, funding goal, and end date
- Validates: token != address(0), endTime > block.timestamp
- Sets startTime to block.timestamp
- Emits: `ProjectCreated(projectId, owner)`

#### 2. `fundl(uint256 _projectId, uint256 _amount)`

**Validation**:
- Project exists (owner != address(0))
- Amount > 0
- Amount + raisedAmount ≤ goalAmount (funding capped)
- Refund vote not active

**Process** (CEI pattern):
1. Update `fundingByUsersByProject[projectId][msg.sender] += amount`
2. Update `raisedAmount += amount`
3. Transfer tokens from funder to contract
4. Emit `Funded(projectId, funder, amount)`

#### 3. `createRefundRequest(uint256 _projectId)`

**Validation**:
- Project exists
- User has funded > 0
- User hasn't already requested refund

**Process**:
1. Check if refund vote was active before this request
2. Set `refundRequestByUsersByProject[projectId][msg.sender] = true`
3. Increment `totalRefundRequestedAmount[projectId] += funded`
4. If threshold crossed (wasn't active, now active): emit `ProjectHalted(projectId)`
5. Emit `RefundRequested(projectId, funder, fundedAmount)`

**Threshold Logic**:
```solidity
_refundVoteActive = (totalRefundRequestedAmount * 2 >= raisedAmount)
// Requires ≥50% of raised funds to have requested refunds
```

#### 4. `refund(uint256 _projectId)`

**Validation**:
- Project exists
- User has funded > 0
- User requested refund
- Refund vote threshold met

**Process**:
1. Calculate `projectBalance = raisedAmount - ownerWithdrawnAmount`
2. Calculate `amountToSend = min(userFunded, projectBalance)`
3. Revert if amountToSend == 0
4. Update `fundingByUsersByProject[projectId][msg.sender] -= amountToSend`
5. Clear refund request flag if user fully refunded
6. Update `totalRefundRequestedAmount -= amountToSend`
7. Update `raisedAmount -= amountToSend`
8. Transfer tokens to user
9. Emit `Refunded(projectId, user, amountToSend)`

**Important**: Partial refunds reduce user's contribution but may not clear refund flag if user still has remaining funds.

#### 5. `collectFunding(uint256 _projectId)`

**Validation**:
- Project exists
- msg.sender is project owner
- Refund vote not active
- Available amount > 0

**Process**:
1. Call `availableToOwner(_projectId)` to get unlocked amount
2. Update `ownerWithdrawnAmount[projectId] += toCollect`
3. Transfer tokens to owner
4. Emit `Collected(projectId, owner, amount)`

#### 6. `availableToOwner(uint256 _projectId)` (view)

**Returns**: Amount owner can currently withdraw

**Calculation**:
```solidity
if (project.owner == address(0)) return 0;  // Project doesn't exist
if (_refundVoteActive(projectId)) return 0; // Halted

elapsed = min(block.timestamp - startTime, endTime - startTime)
duration = endTime - startTime
if (duration == 0) return 0;

unlocked = (raisedAmount * elapsed) / duration  // Linear vesting
alreadyWithdrawn = ownerWithdrawnAmount[projectId]

return max(0, unlocked - alreadyWithdrawn)
```

**Key Behavior**: After `endTime`, all remaining funds are unlocked (elapsed capped at duration).

### Events

```solidity
event ProjectCreated(uint256 indexed projectId, address indexed owner);
event Funded(uint256 indexed projectId, address indexed funder, uint256 amount);
event RefundRequested(uint256 indexed projectId, address indexed funder, uint256 amount);
event Refunded(uint256 indexed projectId, address indexed funder, uint256 amount);
event Collected(uint256 indexed projectId, address indexed owner, uint256 amount);
event ProjectHalted(uint256 indexed projectId);
```

### Custom Errors

```solidity
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
```

### Security Features

- **ReentrancyGuard**: All state-changing functions protected
- **CEI Pattern**: State updates before external calls
- **SafeERC20**: Prevents token transfer issues
- **Project Existence Checks**: All functions validate `owner != address(0)`

---

## Frontend Architecture

### Authentication (Privy + Wagmi)

**Provider Setup** (`src/components/providers.tsx`):
```tsx
- WagmiProvider: Manages blockchain connections
  - Chains: baseSepolia (prod), anvil (dev)
  - Transports: HTTP for Base, localhost:8545 for Anvil
  
- PrivyProvider: Handles authentication
  - Embedded wallets: Created for users without wallets
  - Default chain: anvil (dev) | baseSepolia (prod)
```

**Authentication Flow**:
1. User clicks login → Privy modal appears
2. Options: Email, Social, External Wallet
3. Embedded wallet created automatically if needed
4. `usePrivy()` hook provides `login`, `logout`, `sendTransaction`

### Pages

#### Landing Page (`/`)
- Sections: Header, Features, FAQ, Pricing, Footer
- Static marketing content

#### Create Project (`/create-project`)
**State**:
- Form inputs: tokenAddress, goalTarget, endTime
- `isCreating`: Transaction loading state

**Flow**:
1. User fills form
2. Clicks "Create Project" → Privy `sendTransaction`
3. Encodes `createProject(tokenAddress, goalAmount, endTime)` call
4. Transaction submitted to blockchain

#### Project Detail (`/projects/[id]`)
**State**:
- `project`: Project struct data
- `availableToCollect`: Calculated for owner view
- `fundAmount`: User input for funding
- `hasRequestedRefund`: Tracks refund request status
- `isOwner`: Checks if connected user is project owner

**Data Fetching**:
```tsx
publicClient.readContract({
    address: FundlAddress,
    abi: FundlABI,
    functionName: "projects",
    args: [projectId]
})
```

**Actions**:
- **Fund Project**: Approve token → Call `fundl(projectId, amount)`
- **Request Refund**: Call `createRefundRequest(projectId)`
- **Claim Refund**: Call `refund(projectId)`
- **Collect Funds**: (Owner only) Call `collectFunding(projectId)`

### Contract Integration (`src/lib/calls.ts`)

**Addresses**:
```typescript
FundlAddress = "0xaB391CC562971f20cDE6BdF8ccDa55a3Beb675F5"
MockTokenAddress = "0x..." // Test ERC20 token
```

**ABI**: Contains function signatures for:
- `createProject`, `fundl`, `collectFunding`
- `createRefundRequest`, `refund`
- `availableToOwner` (view function)

---

## Important Notes

### Storage Field Note

**Contract has both**:
- `Project.ownerWithdrawn` (uint256 in struct) - unused
- `ownerWithdrawnAmount` (mapping) - actually used

**Recommendation**: Remove `ownerWithdrawn` from struct to avoid confusion.

---

## Flow Diagrams

### Happy Path: Full Project Lifecycle

```
1. Owner creates project
   └─> Project ID assigned, startTime = now, endTime = future

2. Funders contribute tokens
   ├─> Each funder: approve → fundl(amount)
   ├─> raisedAmount increases (capped at goalAmount)
   └─> Funds stream linearly over time

3. Owner collects funds periodically
   ├─> availableToOwner() calculates unlocked amount
   ├─> collectFunding() transfers available funds
   └─> ownerWithdrawnAmount tracks total withdrawn

4. Project completes at endTime
   └─> Owner collects all remaining funds
```

### Refund Path: Project Halted

```
1. Funders lose confidence, request refunds
   └─> createRefundRequest() → votes accumulate

2. Threshold reached (≥50% of raised funds voting)
   ├─> ProjectHalted event emitted
   ├─> New funding blocked
   └─> Owner collection blocked

3. Funders claim refunds
   ├─> refund() sends available balance
   ├─> Partial refunds if owner withdrew some
   └─> User contribution reduced by refunded amount

4. If votes drop below threshold:
   ├─> Funding can resume
   └─> Owner can collect again (dynamic halt/resume)
```

### Edge Cases

**Case 1: Partial Refunds**
- User funded 100 tokens
- Owner withdrew 60 tokens
- Project balance = 40 tokens
- User refund → receives 40 tokens (not 100)
- User still has refund flag set with 60 tokens remaining

**Case 2: Threshold Volatility**
- 100 tokens raised, 50 tokens voted for refund → HALTED
- Some users claim refunds, now 40 raised, 20 voting → RESUMED
- New funding allowed, owner collection allowed

**Case 3: Post-EndTime**
- After endTime, all unlocked funds available
- Owner can collect entire remaining balance
- Linear vesting calculation still uses elapsed capped at duration

---

## Development Guidelines

### Testing Locally

**Contracts**:
```bash
cd contracts
forge test                 # Run tests
forge script script/FundlWithProjects.s.sol --broadcast --rpc-url anvil
```

**Frontend**:
```bash
cd frontend
pnpm install
pnpm dev                   # Runs on localhost:3000
```

**Environment Variables**:
```env
NEXT_PUBLIC_PRIVY_APP_ID=<privy-app-id>
NEXT_PUBLIC_PRIVY_CLIENT_ID=<privy-client-id>
```

### Contract Deployment

**Networks**:
- Development: Anvil (local)
- Production: Base Sepolia

**Deploy Script**: `contracts/script/FundlWithProjects.s.sol`

### Common Tasks

**Update Contract Address**:
1. Deploy new contract
2. Update `FundlAddress` in `frontend/src/lib/calls.ts`

**Update ABI**:
1. Compile contracts: `forge build`
2. Extract ABI from `contracts/out/Fundl.sol/Fundl.json`
3. Update `FundlABI` in `frontend/src/lib/calls.ts`

**Add New Chain**:
1. Add chain to `wagmi/chains` imports
2. Update `createConfig` chains array
3. Add transport for new chain
4. Update Privy `supportedChains`

---

## Known Limitations

### Current Implementation

1. **Unused Struct Field**: `Project.ownerWithdrawn` exists but `ownerWithdrawnAmount` mapping is used for tracking
2. **No Project Listing**: No way to fetch all projects (only by ID)
3. **No Minimum Funding**: Allows dust contributions
4. **No Project Updates**: Owner can't update project details after creation
5. **No Emergency Pause**: No admin control for critical issues

---

## Future Considerations

### Potential Features

- Project categories/tags
- Featured projects
- Batch refund processing
- Multi-token support per project
- Delegate collection (allow non-owner to collect)
- Project metadata storage (off-chain)

### Optimizations

- Batch read operations for project lists
- Subgraph for historical data
- IPFS for metadata storage
- Proxy pattern for upgradability

---

## Quick Reference

### Contract Constants

```solidity
REFUND_DENOMINATOR = 2  // 50% threshold (requests * 2 >= raised)
```

### Key Equations

```solidity
// Linear vesting
unlocked = (raisedAmount * elapsed) / duration

// Refund threshold
threshold_met = totalRefundRequestedAmount * 2 >= raisedAmount

// Project balance
available_for_refunds = raisedAmount - ownerWithdrawnAmount
```

### Contract Addresses (Testnet)

- Fundl: `0xaB391CC562971f20cDE6BdF8ccDa55a3Beb675F5`
- MockToken: (See `frontend/src/lib/calls.ts`)

---

## Troubleshooting

**"Transaction reverted" on createProject**:
- Verify endTime > block.timestamp
- Ensure tokenAddress is valid ERC20
- Check goalAmount is reasonable

**"RefundVoteActive" error**:
- Project is halted due to refund threshold
- Wait for votes to drop or project to resume
- Check `_refundVoteActive()` state

**"NothingToCollect" error**:
- No funds unlocked yet (too early)
- Already collected all available
- Refund vote active (owner blocked)

---

*Document Version: 1.0*  
*Last Updated: December 2025*  
*For AI Assistant Use*
