# Escrow USDC DApp - Arc Testnet

A decentralized escrow application built on Arc Testnet that allows secure USDC transactions between buyers and sellers with dispute resolution.

## 🎯 Features

- **Create Escrow**: Buyers can create escrow contracts with sellers, amount, and timeout
- **Confirm Completion**: Buyers can confirm job completion to release funds to sellers
- **Timeout Refund**: Automatic refund capability if escrow times out
- **Dispute Resolution**: Buyers or sellers can raise disputes, resolved by admin
- **Modern UI**: Beautiful, responsive interface with clear wallet connection

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Foundry (for smart contract development)
- MetaMask or compatible Web3 wallet
- Arc Testnet USDC (from faucet)

## 🚀 Quick Start

### 1. Smart Contract Setup

```bash
# Install Foundry (if not already installed)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Install dependencies
forge install

# Copy environment file
cp .env.example .env

# Edit .env and add:
# - PRIVATE_KEY: Your wallet private key
# - USDC_ADDRESS: USDC token contract address on Arc Testnet
# - ARC_TESTNET_RPC_URL: https://rpc.testnet.arc.network
```

### 2. Deploy Contract

```bash
# Compile contract
forge build

# Run tests
forge test

# Deploy to Arc Testnet
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $ARC_TESTNET_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast
```

After deployment, copy the contract address and update `frontend/.env`.

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env and add:
# - VITE_ESCROW_CONTRACT_ADDRESS: Your deployed contract address
# - VITE_ARC_RPC_URL: https://rpc.testnet.arc.network
```

### 4. Run Frontend

```bash
npm run dev
```

The app will open at `http://localhost:3000`

## 🔧 Configuration

### Arc Testnet Setup

1. Add Arc Testnet to MetaMask:
   - Network Name: Arc Testnet
   - RPC URL: https://rpc.testnet.arc.network
   - Chain ID: 5042002
   - Currency Symbol: USDC
   - Block Explorer: https://testnet.arcscan.app

2. Get Testnet USDC:
   - Visit [Circle Faucet](https://faucet.circle.com)
   - Select Arc Testnet
   - Request testnet USDC

### USDC Contract Address

You need to find the USDC token contract address on Arc Testnet. Check:
- Arc documentation
- Arc block explorer
- Arc Discord/community

Update the `USDC_ADDRESS` in `.env` before deploying.

## 📁 Project Structure

```
.
├── src/              # Smart contracts
│   └── Escrow.sol   # Main escrow contract
├── test/             # Contract tests
├── script/           # Deployment scripts
├── frontend/         # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── config/      # Wagmi and contract config
│   │   └── App.jsx      # Main app component
│   └── package.json
└── foundry.toml      # Foundry configuration
```

## 🎨 Features Overview

### For Buyers
- Create escrow with seller address, amount, and timeout
- Confirm completion to release funds
- Request refund if timeout expires
- Raise dispute if needed

### For Sellers
- View escrows where you're the seller
- Raise dispute if needed
- Receive funds when buyer confirms

### For Admin
- View all disputed escrows
- Resolve disputes by:
  - Paying seller (if seller is right)
  - Refunding buyer (if buyer is right)

## 🔒 Security Notes

- Never commit `.env` files to git
- Keep private keys secure
- Test thoroughly on testnet before mainnet
- Review contract code before deployment

## 📝 Contract Functions

### Public Functions
- `createEscrow(address seller, uint256 amount, uint256 timeout)` - Create new escrow
- `confirmCompletion(uint256 escrowId)` - Release funds to seller
- `refund(uint256 escrowId)` - Refund to buyer (after timeout)
- `raiseDispute(uint256 escrowId)` - Raise a dispute
- `resolveDispute(uint256 escrowId, bool toSeller)` - Admin resolves dispute

### View Functions
- `getEscrow(uint256 escrowId)` - Get escrow details
- `getBuyerEscrows(address buyer)` - Get buyer's escrows
- `getSellerEscrows(address seller)` - Get seller's escrows
- `isTimedOut(uint256 escrowId)` - Check if escrow timed out

## 🧪 Testing

```bash
# Run all tests
forge test

# Run with verbose output
forge test -vvv

# Run specific test
forge test --match-test testCreateEscrow
```

## 📚 Resources

- [Arc Network Docs](https://docs.arc.network)
- [Foundry Documentation](https://book.getfoundry.sh)
- [Wagmi Documentation](https://wagmi.sh)
- [Viem Documentation](https://viem.sh)

## ⚠️ Important Notes

- Arc is currently in testnet phase
- Network may experience instability
- Testnet tokens have no real value
- Always verify contract addresses before use

## 📄 License

MIT

