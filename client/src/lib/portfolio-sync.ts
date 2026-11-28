const PORTFOLIO_SYNC_KEY = 'photoblock:portfolio-updated';

export function notifyPortfolioUpdated(): void {
  try {
    localStorage.setItem(PORTFOLIO_SYNC_KEY, String(Date.now()));
  } catch {
    // Storage can be disabled; local invalidation still refreshes this tab.
  }
}

export function subscribePortfolioUpdates(
  listener: () => void,
): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === PORTFOLIO_SYNC_KEY) listener();
  };
  window.addEventListener('storage', handleStorage);
  return () => window.removeEventListener('storage', handleStorage);
}
