import ClaimClient from "@/components/claim/ClaimClient";

// Server render does no blockchain reads and no Zama SDK / FHE work — those
// require crossOriginIsolated + browser WASM and cannot run server-side. The
// route only forwards the raw link id; ClaimClient does everything in the browser.
export default async function ClaimPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main id="main" className="mx-auto flex min-h-[100dvh] w-full max-w-[28rem] flex-col px-24 pt-24">
      <ClaimClient id={id} />
    </main>
  );
}
