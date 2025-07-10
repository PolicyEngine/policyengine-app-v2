import { useState } from 'react';
import { Button } from '@mantine/core';
import PolicyCreationModal from '../modals/PolicyCreationModal';

export function HomePage() {
  // Note: This pagination function is for testing purposes only.
  const pages = [
    { name: 'home', component: null },
    { name: 'policy-input-1', component: <PolicyCreationModal /> },
  ];

  const [currentPage, setCurrentPage] = useState(pages[0]);

  function updatePage(pageName: string) {
    setCurrentPage(pages.find((page) => page.name === pageName) || pages[0]);
  }

  return (
    <>
      <h1>TODO: Home Page</h1>
      <Button variant="default" onClick={() => updatePage('home')}>
        Default view
      </Button>
      <Button variant="default" onClick={() => updatePage('policy-input-1')}>
        Policy creation flow, view 1
      </Button>
      {currentPage.component}
    </>
  );
}
