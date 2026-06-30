import ClaimHeader from "@/components/claim/ClaimHeader";
import ClaimExperience from "@/components/claim/ClaimExperience";
import ZamaGate from "@/components/shared/ZamaGate";
import { getClaimData } from "@/lib/campaign";

export default async function ClaimPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getClaimData(id);

  return (
    <main id="main" className="mx-auto flex min-h-[100dvh] w-full max-w-[28rem] flex-col px-24 pt-24">
      <ClaimHeader airdropAddress={data.campaign.airdropAddress} createdAt={data.campaign.createdAt} />
      <ZamaGate>
        <ClaimExperience data={data} />
      </ZamaGate>
    </main>
  );
}
