const EXPORT_SCALE = 2;

/**
 * Capture the rendered receipt card as a PNG and download it.
 * Renders at 2x scale for retina sharpness; this is the shareable artifact,
 * so it must match the on-screen card exactly rather than re-implementing it.
 */
export async function downloadReceiptImage(node: HTMLElement, campaignId: string): Promise<void> {
  const { default: html2canvas } = await import("html2canvas");
  const canvas = await html2canvas(node, {
    scale: EXPORT_SCALE,
    backgroundColor: "#FAF8F2",
    useCORS: true,
    ignoreElements: (el) => el.hasAttribute("data-html2canvas-ignore"),
  });

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tacet-receipt-${campaignId}.png`;
  a.click();
  URL.revokeObjectURL(url);
}
