"use client";

import { useEffect, useState } from "react";
import { truncate } from "@/lib/design-tokens";

interface CipherCompanionProps {
  handle: string;
  /** When true, cycle one random hex character every 4–6 seconds (ambient state) */
  ambient?: boolean;
}

const HEX = "0123456789abcdef";

function randomHex(len: number) {
  return Array.from({ length: len }, () => HEX[Math.floor(Math.random() * 16)]).join("");
}

/**
 * Ciphertext companion caption — shows the encrypted handle beneath a decrypted value.
 * Ambient mode slowly mutates one character every 4–6s per Sealed §Category 3 motion.
 */
export default function CipherCompanion({ handle, ambient = false }: CipherCompanionProps) {
  const [displayed, setDisplayed] = useState(handle);

  useEffect(() => {
    if (!ambient || !handle) return;

    const schedule = () => {
      const delay = 4000 + Math.random() * 2000;
      return setTimeout(() => {
        setDisplayed((prev) => {
          const chars = prev.replace(/^0x/, "").split("");
          const i = 2 + Math.floor(Math.random() * (chars.length - 2));
          chars[i] = randomHex(1);
          return "0x" + chars.join("");
        });
        schedule();
      }, delay);
    };

    const id = schedule();
    return () => clearTimeout(id);
  }, [ambient, handle]);

  return (
    <span className="block font-mono text-code text-ink-400 mt-1 select-all">
      {truncate(displayed)}
    </span>
  );
}
