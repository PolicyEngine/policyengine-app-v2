import { ReactNode } from 'react';
import { Box } from '@mantine/core';

export interface StaticPageLayoutProps {
  title: string;
  children: ReactNode;
}

export default function StaticPageLayout({ title, children }: StaticPageLayoutProps) {
  return (
    <>
      <title>{title} | PolicyEngine</title>
      <Box>{children}</Box>
    </>
  );
}
