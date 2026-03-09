import { lazy, Suspense } from 'react';

const ReactQueryDevtools = lazy(() =>
  import('@tanstack/react-query-devtools').then((m) => ({ default: m.ReactQueryDevtools }))
);

export default function DevTools() {
  if (!import.meta.env.DEV) {
    return null;
  }
  return (
    <Suspense>
      <ReactQueryDevtools initialIsOpen={false} />
    </Suspense>
  );
}
