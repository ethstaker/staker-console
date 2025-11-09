# Staker Dashboard

A web-based dashboard for managing Ethereum validators, allowing users to deposit, top-up, upgrade, consolidate, withdraw, and exit validators through an intuitive interface.

## Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Material-UI (MUI) v5
- **Styling**: TailwindCSS
- **Wallet Integration**: Reown AppKit (formerly WalletConnect)
- **Code Quality**: ESLint, Prettier, Husky (pre-commit hooks)

## Prerequisites

- Node.js v20.19 or higher
- npm or yarn
- AppKit Project ID

## Installation

```bash
git clone <repository-url>
cd staker-dashboard
npm install
```

## Configuration

### 1. AppKit Project ID

This project uses [Reown AppKit](https://docs.reown.com/appkit/overview) to make wallet integration seamless.
In order to utilize all it has to offer it is recommended to generate a Project ID.

**Getting an AppKit Project ID:**

1. Go to [Reown Cloud](https://cloud.reown.com/)
2. Create a new project or select an existing one
3. Copy your Project ID
4. Paste it into your `.env` file

### 2. Deposit-Backend

This project uses [deposit-backend](https://github.com/ethstaker/deposit-backend) to retrieve up-to-date validator
details from the Beacon Chain.

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
# Reown AppKit Project ID
VITE_APPKIT_PUBLIC_PROJECT_ID=your_project_id_here
# URL to hoodi api service
VITE_HOODI_API_URL=https://url:port
# URL to mainnet api service
VITE_MAINNET_API_URL=https://url:port
```

## Running the Application

### Development Mode

```bash
npm run dev
```

The app will be available at `http://localhost:3001`

### Production Build

```bash
npm run build
npm run start
```

### Docker

```bash
docker build --build-arg VITE_APPKIT_PUBLIC_PROJECT_ID=<insert-appkit-project-id> -t staker-dashboard .
docker run -p 3001:80 staker-dashboard
```

## Adding New Networks

To add a new testnet (or any network) beyond Hoodi, you need to update two configuration files:

### 1. Update `src/config/networks.ts`

Add your network to the `Network` enum and `networks` object:

```typescript
enum Network {
  Mainnet = 1,
  Hoodi = 560048,
  YourTestnet = 123456, // Your network's chain ID
}

const networks: Record<Network, NetworkConfig> = {
  // ... existing networks
  [Network.YourTestnet]: {
    name: "Your Testnet Name",
    chainId: "123456",
    apiBaseURL: "/api/your-testnet", // Your backend API endpoint
    forkVersion: "00000abc", // Network fork version (4 bytes hex)
    depositContractAddress: "0x...", // Deposit contract address
    withdrawContractAddress: "0x...", // Withdrawal contract address
    multicallContractAddress: "0x...", // Multicall3 contract address
    consolidateContractAddress: "0x...", // Consolidation contract address
    addressExplorer: "https://...", // Block explorer for addresses
    transactionExplorer: "https://...", // Block explorer for transactions
    beaconExplorer: "https://...", // Beacon chain explorer
  },
};
```

### 2. Update `src/config/appkit.tsx`

Import and add your network to the AppKit configuration:

```typescript
import { AppKitNetwork, hoodi, mainnet, /* import your network */ } from "@reown/appkit/networks";
// OR define a custom network:
// import { defineChain } from "@reown/appkit/networks";

// If using a custom network not in @reown/appkit/networks:
const yourTestnet = defineChain({
  id: 123456,
  chainNamespace: "eip155",
  caipNetworkId: "eip155:123456",
  name: "Your Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.your-testnet.com"] },
  },
  blockExplorers: {
    default: { name: "Explorer", url: "https://explorer.your-testnet.com" },
  },
});

export const networks: AppKitNetwork[] = [hoodi, mainnet, yourTestnet];
```

### 3. Update Backend API Routes (if applicable)

Ensure your backend API has an endpoint for the new network at the path specified in `apiBaseURL` (e.g., `/api/your-testnet`). You may need to update `vite.config.ts` as well to include this URL proxy.

## Contributing

We welcome contributions from the community! Here's how to contribute:

1. **Fork the repository** - Click the "Fork" button at the top right of this page
2. **Clone your fork** - `git clone https://github.com/your-username/staker-dashboard.git`
3. **Create a branch from main** - `git checkout -b feature/your-feature-name`
4. **Make your changes** - Implement your feature or bug fix
5. **Commit your changes** - Use clear, descriptive commit messages (the linter will run upon commit)
6. **Push to your fork** - `git push origin feature/your-feature-name`
7. **Create a Pull Request** - Open a PR from your branch to our `main` branch

### Code Quality

All commits are automatically checked by Husky pre-commit hooks for:
- TypeScript type checking
- ESLint linting
- TailwindCSS
- Prettier formatting

Make sure your code passes these checks before submitting a PR.

## License

This project is licensed under the **GNU General Public License v3.0** (GPL-3.0).

See the [GPL-3.0 license](https://www.gnu.org/licenses/gpl-3.0.en.html) for details.
