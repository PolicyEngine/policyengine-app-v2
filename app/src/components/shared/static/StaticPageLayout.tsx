import { ReactNode, useEffect } from 'react';

export interface StaticPageLayoutProps {
  title: string;
  children: ReactNode;
}

export default function StaticPageLayout({ title, children }: StaticPageLayoutProps) {
  useEffect(() => {
    document.title = `${title} | PolicyEngine`;
  }, [title]);

  return <div>{children}</div>;
}
