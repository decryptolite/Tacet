import ClaimHeader from "@/components/claim/ClaimHeader";
import ClaimExperience from "@/components/claim/ClaimExperience";
import ZamaGate from "@/components/shared/ZamaGate";
import { getClaimData, type ClaimData } from "@/lib/campaign";

export default async function ClaimPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ debug?: string }>;
}) {
  const { id } = await params;
  const { debug } = await searchParams;

  let data: ClaimData;
  try {
    data = await getClaimData(id);
  } catch (err) {
    // TEMP diagnostic — the prod digest masks the real message. The full error
    // always goes to the Vercel function logs; append ?debug=1 to see it on-page.
    console.error("[tacet] claim render failed for id:", id, err);
    if (debug === "1") {
      const e = err as {
        name?: string;
        message?: string;
        shortMessage?: string;
        metaMessages?: string[];
        details?: string;
        stack?: string;
        cause?: unknown;
      };
      return (
        <main id="main" className="mx-auto w-full max-w-[48rem] px-24 pt-24 font-mono text-[12px] text-ink-1000">
          <p className="mb-4 text-accent">CLAIM RENDER ERROR — debug</p>
          <pre className="whitespace-pre-wrap break-words">
            {[
              `name:         ${e?.name ?? ""}`,
              `message:      ${e?.message ?? ""}`,
              `shortMessage: ${e?.shortMessage ?? ""}`,
              `details:      ${e?.details ?? ""}`,
              `metaMessages: ${(e?.metaMessages ?? []).join(" | ")}`,
              `cause:        ${String(e?.cause ?? "")}`,
              ``,
              `stack:`,
              e?.stack ?? "",
            ].join("\n")}
          </pre>
        </main>
      );
    }
    throw err; // preserve the normal error boundary in prod
  }

  return (
    <main id="main" className="mx-auto flex min-h-[100dvh] w-full max-w-[28rem] flex-col px-24 pt-24">
      <ClaimHeader airdropAddress={data.campaign.airdropAddress} createdAt={data.campaign.createdAt} />
      <ZamaGate>
        <ClaimExperience data={data} />
      </ZamaGate>
    </main>
  );
}
