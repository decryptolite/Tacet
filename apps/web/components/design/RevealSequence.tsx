"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ease, duration, truncate } from "@/lib/design-tokens";
import { TOKEN_SYMBOL } from "@/lib/tokenops";

interface RevealSequenceProps {
  handle: string;
  decryptedValue: string | null;
  /** Trigger the reveal — call when FHE decryption completes */
  onReveal?: () => void;
}

const HEX = "0123456789abcdef";

function randomChar() {
  return HEX[Math.floor(Math.random() * 16)];
}

function jitterHandle(handle: string) {
  if (!handle) return handle;
  const chars = handle.split("");
  const editableStart = 2;
  const i = editableStart + Math.floor(Math.random() * (chars.length - editableStart));
  chars[i] = randomChar();
  return chars.join("");
}

/**
 * The reveal sequence — the single most polished moment in the product.
 * Three beats per Sealed §Motion §Category 2:
 *   Beat 1 (0–0.6s): cipher jitter
 *   Beat 2 (0.6–1.2s): dissolve + morph
 *   Beat 3 (1.2–1.6s): settled with companion caption
 */
export default function RevealSequence({ handle, decryptedValue }: RevealSequenceProps) {
  const [jittered, setJittered] = useState(handle);
  const isDecrypted = decryptedValue !== null;

  const runJitter = useCallback(() => {
    if (isDecrypted) return;
    const id = setInterval(() => {
      setJittered((h) => jitterHandle(h));
    }, 80);
    return () => clearInterval(id);
  }, [isDecrypted]);

  useEffect(() => {
    return runJitter();
  }, [runJitter]);

  return (
    <div className="text-center" aria-live="polite" aria-atomic="true">
      <AnimatePresence mode="wait">
        {!isDecrypted ? (
          <motion.div
            key="handle"
            exit={{ opacity: 0 }}
            transition={{ duration: duration.standard, ease: ease.sealed }}
            className="space-y-2"
          >
            <div className="font-mono text-h1 text-ink-400 tracking-tight">
              {truncate(jittered)}
            </div>
            <div className="font-mono text-code text-ink-400 opacity-60">
              decrypting…
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="value"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: duration.reveal.beat3,
              ease: ease.sealed,
              delay: 0.2,
            }}
            className="space-y-2"
          >
            <div
              className="font-serif text-display text-ink-1000 leading-none tracking-tight"
              aria-label={`${decryptedValue} ${TOKEN_SYMBOL}`}
            >
              {decryptedValue}
            </div>
            <div className="font-mono text-code text-ink-600">{TOKEN_SYMBOL}</div>
            <div className="font-mono text-code text-ink-400 mt-1">
              {truncate(handle)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
