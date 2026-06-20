const PIXEL_ID = import.meta.env.VITE_TOSS_PIXEL_ID as string | undefined;

function getPixel(): TossPixel | null {
  if (!PIXEL_ID || typeof TossPixel === "undefined") return null;
  return new TossPixel(PIXEL_ID);
}

export function trackAdImpression() {
  try {
    getPixel()?.adImpression();
  } catch (e) {
    console.error("[TossPixel] adImpression failed", e);
  }
}
