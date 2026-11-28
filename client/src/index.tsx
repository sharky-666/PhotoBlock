import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';

import RoutesComponent from './app.tsx';
import { subscribePortfolioUpdates } from '@client/src/lib/portfolio-sync';
import '@fontsource-variable/cormorant-garamond';
import '@fontsource-variable/cormorant-garamond/wght-italic.css';
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import './index.css';
import { createPortal } from 'react-dom';
import { Toaster } from '@client/src/components/ui/sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="max-w-lg text-center">
        <p className="font-display text-3xl">页面暂时无法显示</p>
        <p className="mt-4 text-sm text-muted-foreground">
          {error.message || '发生未知错误，请稍后重试。'}
        </p>
        <button
          type="button"
          onClick={resetErrorBoundary}
          className="mt-8 border border-border px-6 py-3 text-sm tracking-widest transition-colors hover:border-primary hover:text-primary"
        >
          重新尝试
        </button>
      </div>
    </main>
  );
}

const MainApp = () => {
  React.useEffect(
    () =>
      subscribePortfolioUpdates(() => {
        const queryKeys = [
          ['artworks'],
          ['categories'],
          ['series'],
          ['portfolio'],
          ['category-list'],
          ['series-list'],
          ['hero-slides'],
          ['homepage-copy'],
          ['site-settings'],
          ['stats'],
        ];
        queryKeys.forEach((queryKey) => {
          void queryClient.invalidateQueries({
            queryKey,
            refetchType: 'active',
          });
        });
      }),
    [],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <ErrorBoundary
          fallbackRender={({ error, resetErrorBoundary }) => (
            <ErrorFallback
              error={error as Error}
              resetErrorBoundary={resetErrorBoundary}
            />
          )}
        >
          <RoutesComponent />
          {createPortal(<Toaster />, document.body)}
        </ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

createRoot(document.getElementById('root')!).render(<MainApp />);
