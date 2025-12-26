import { ReactNode, useEffect } from 'react';
import { Box } from '@mantine/core';

export interface StaticPageLayoutProps {
  title: string;
  children: ReactNode;
}

export default function StaticPageLayout({ title, children }: StaticPageLayoutProps) {
  useEffect(() => {
    document.title = `${title} | PolicyEngine`;
  }, [title]);

  return <Box>{children}</Box>;
}
