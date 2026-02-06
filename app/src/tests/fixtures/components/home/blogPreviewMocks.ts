import type { BlogPost } from '@/types/blog';

export const MOCK_US_POST_NEWEST: BlogPost = {
  title: 'Stronger Start for Working Families Act',
  description: 'The bipartisan legislation would cost $14.6 billion over ten years.',
  date: '2026-01-13 12:00:00',
  tags: ['us', 'policy'],
  authors: ['david-trimmer'],
  filename: 'stronger-start-working-families-act.md',
  image: 'stronger-start-working-families-act.jpg',
  slug: 'stronger-start-working-families-act',
};

export const MOCK_US_POST_SECOND: BlogPost = {
  title: 'Utah SB60: Proposed income tax rate reduction',
  description: 'Utah Senate Bill 60 would reduce the state income tax rate from 4.5% to 4.45%.',
  date: '2026-01-12 12:00:00',
  tags: ['us', 'us-ut', 'policy'],
  authors: ['david-trimmer'],
  filename: 'utah-sb60-income-tax-reduction.md',
  image: 'ut-SB60.jpg',
  slug: 'utah-sb60-income-tax-reduction',
};

export const MOCK_GLOBAL_POST: BlogPost = {
  title: 'PolicyEngine powers rapid policy analysis at No 10 Downing Street',
  description: 'Our CTO spent six months as an Innovation Fellow adapting PolicyEngine.',
  date: '2026-01-20 12:00:00',
  tags: ['global', 'org'],
  authors: ['max-ghenis'],
  filename: 'policyengine-10-downing-street.md',
  image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/example.jpg',
  slug: 'policyengine-10-downing-street',
};

export const MOCK_UK_POST: BlogPost = {
  title: 'Analysing autumn budget reforms with PolicyEngine',
  description: 'A detailed look at UK autumn budget universal credit reforms.',
  date: '2026-01-10 12:00:00',
  tags: ['uk', 'policy'],
  authors: ['nikhil-woodruff'],
  filename: 'analysing-autumn-budget.md',
  image: 'analysing-autumn-budget.webp',
  slug: 'analysing-autumn-budget',
};

export const MOCK_POST_NO_IMAGE: BlogPost = {
  title: 'Post with no image',
  description: 'This post has no cover image.',
  date: '2026-01-05 12:00:00',
  tags: ['us', 'technical'],
  authors: ['max-ghenis'],
  filename: 'post-no-image.md',
  image: '',
  slug: 'post-no-image',
};

/** Six US/global posts sorted newest-first for testing the 5-post grid */
export const MOCK_US_POSTS_SORTED: BlogPost[] = [
  MOCK_GLOBAL_POST, // Jan 20 (newest, also matches US via 'global')
  MOCK_US_POST_NEWEST, // Jan 13
  MOCK_US_POST_SECOND, // Jan 12
  MOCK_POST_NO_IMAGE, // Jan 5
  {
    ...MOCK_US_POST_NEWEST,
    title: 'Fifth US post for grid',
    slug: 'fifth-us-post',
    date: '2026-01-04 12:00:00',
  },
  {
    ...MOCK_US_POST_NEWEST,
    title: 'Sixth US post should not appear',
    slug: 'sixth-us-post',
    date: '2026-01-03 12:00:00',
  },
];
