// pages/_app.tsx
import '@rainbow-me/rainbowkit/styles.css';
import '../styles/globals.css';

import {
  RainbowKitProvider,
  getDefaultConfig,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
} from 'wagmi/chains';
import {
  QueryClientProvider,
  QueryClient,
} from '@tanstack/react-query';

const config = getDefaultConfig({
  appName: 'Mon App Replit',
  projectId: 'f1a60317fced441abedbb07d7818e2ac',
  chains: [mainnet, polygon, optimism, arbitrum, base],
  ssr: false, // Corrige les bugs de double init
});

const queryClient = new QueryClient();

export default function MyApp({ Component, pageProps }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider chains={config.chains}>
          <Component {...pageProps} />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
