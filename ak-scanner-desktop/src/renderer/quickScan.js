export const QUICK_SCAN_DELAY_MS = 3000;
const ORDER = ['animal', 'strong', 'miracle'];

export async function sendTrioSequentially(picks, sendCard, wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)), onProgress = () => {}) {
  for (const [index, category] of ORDER.entries()) {
    if (index > 0) {
      onProgress({ stage: 'waiting', category });
      await wait(QUICK_SCAN_DELAY_MS);
    }
    onProgress({ stage: 'sending', category });
    try {
      const result = await sendCard(picks[category].id);
      if (!result.ok) return { ok: false, category, message: result.message };
    } catch {
      return { ok: false, category, message: 'Could not send the saved card.' };
    }
  }
  return { ok: true };
}
