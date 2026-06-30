"use client";

import { ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import { Toaster } from "sonner";
import { wagmiConfig } from "@/lib/wagmi";

import "@rainbow-me/rainbowkit/styles.css";

const rainbowTheme = lightTheme({
  accentColor: "#C89060",
  accentColorForeground: "#FAF8F2",
  borderRadius: "large",
  fontStack: "system",
});

/**
 * Client-side provider tree for the App Router shell.
 * next-auth SessionProvider lives in a separate <AuthProvider> co-located
 * with auth routes to avoid hydration mismatches.
 * @zama-fhe/react-sdk provider will wrap FHE-enabled routes only.
 */
export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, retry: 1 },
        },
      })
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={rainbowTheme}>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              classNames: {
                toast:
                  "font-sans text-[0.875rem] border border-[#D8D5CE] bg-[#FAF8F2] text-[#0E0E0C] rounded-[12px] shadow-none",
              },
            }}
          />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
