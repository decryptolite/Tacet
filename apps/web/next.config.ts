import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
  // Cross-origin isolation unlocks SharedArrayBuffer, which tfhe-rs needs for
  // real (threaded) FHE proof generation. Without it the WASM silently falls
  // back to cleartext proofs (0x0101 prefix) and createAndFundConfidentialAirdrop
  // reverts with 0x79f2cb38. COEP is `credentialless` rather than `require-corp`
  // so RainbowKit/WalletConnect's cross-origin wallet icons still load — same
  // SharedArrayBuffer unlock, no CORP requirement on third-party subresources.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
        ],
      },
    ];
  },
};

export default nextConfig;
