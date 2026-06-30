export const colors = {
  ink: {
    1000: "#0E0E0C",
    800: "#2A2A26",
    600: "#5A5A53",
    400: "#989590",
    200: "#D8D5CE",
    100: "#EFECE3",
    50: "#FAF8F2",
  },
  accent: "#C89060",
  state: {
    claimable: "#6B8E5A",
    error: "#A85A3F",
  },
} as const;

export const ease = {
  sealed: [0.4, 0, 0.1, 1] as [number, number, number, number],
};

export const duration = {
  fast: 0.18,
  standard: 0.24,
  reveal: { total: 2.0, beat1: 0.6, beat2: 0.6, beat3: 0.4 },
};

/** Truncate an 0x hex string to  0x1234…abcd  form */
export function truncate(hex: string, chars = 5): string {
  if (!hex || hex.length < chars * 2 + 4) return hex;
  return `${hex.slice(0, chars + 2)}…${hex.slice(-chars)}`;
}
