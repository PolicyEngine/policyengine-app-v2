import '../src/app.css';

import React from 'react';

export const parameters = {
  layout: 'fullscreen',
  options: {
    showPanel: false,
    storySort: (a, b) => {
      return a.title.localeCompare(b.title, undefined, { numeric: true });
    },
  },
};

export const decorators = [(renderStory: any) => <>{renderStory()}</>];
