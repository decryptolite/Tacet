"use client";

import Button from "@/components/design/Button";

export default function ClaimError({ error }: { error: Error & { digest?: string } }) {
  return (
    <main id="main" className="mx-auto flex min-h-[100dvh] w-full max-w-[28rem] flex-col items-center justify-center px-24 text-center">
      <p className="text-body text-ink-1000">{error.message || "This claim link couldn't be loaded."}</p>
      {error.digest && (
        <p className="mt-2 font-mono text-code text-ink-400">Ref {error.digest}</p>
      )}
      <Button variant="secondary" className="mt-8" onClick={() => window.location.reload()}>
        Try again
      </Button>
    </main>
  );
}
