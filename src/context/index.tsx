"use client";

import { createAppKit } from "@reown/appkit";
import { AppKitNetwork } from "@reown/appkit/networks";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode } from "react";
import { cookieToInitialState, WagmiProvider, type Config } from "wagmi";

import { wagmiAdapter, projectId, networks } from "@/config/appkit";

import { SelectedValidatorProvider } from "./SelectedValidatorContext";

const queryClient = new QueryClient();

if (!projectId) {
  throw new Error("Project Id is not defined.");
}

createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: networks as [AppKitNetwork, ...AppKitNetwork[]],
  defaultNetwork: networks[0] as AppKitNetwork,
  features: {
    analytics: false,
    email: false,
    onramp: false,
    socials: [],
    swaps: false,
    send: false,
  },
  themeMode: "dark",
});

function ContextProvider({
  children,
  cookies,
}: {
  children: ReactNode;
  cookies: string | null;
}) {
  const initialState = cookieToInitialState(
    wagmiAdapter.wagmiConfig as Config,
    cookies,
  );

  return (
    <WagmiProvider
      config={wagmiAdapter.wagmiConfig as Config}
      initialState={initialState}
    >
      <QueryClientProvider client={queryClient}>
        <SelectedValidatorProvider>{children}</SelectedValidatorProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default ContextProvider;
