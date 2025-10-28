import { ReactNode } from 'react';
import { Box } from '@mantine/core';
import { Helmet } from 'react-helmet';

export interface StaticPageLayoutProps {
  title: string;
  children: ReactNode;
}

export default function StaticPageLayout({ title, children }: StaticPageLayoutProps) {
  return (
    <>
      <Helmet>
        <title>{title} | PolicyEngine</title>
      </Helmet>
      <Box>{children}</Box>
    </>
  );
}
