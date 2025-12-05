/**
 * Router for the Website (policyengine.org)
 * Contains homepage, blog, team, and embedded apps
 */
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import StaticLayout from './components/StaticLayout';
import AppPage from './pages/AppPage';
import BlogPage from './pages/Blog.page';
import DonatePage from './pages/Donate.page';
import OrgLogosEmbedPage from './pages/embed/OrgLogosEmbed.page';
import HomePage from './pages/Home.page';
import PrivacyPage from './pages/Privacy.page';
import ResearchPage from './pages/Research.page';
import SupportersPage from './pages/Supporters.page';
import TeamPage from './pages/Team.page';
import TermsPage from './pages/Terms.page';
import { CountryAppGuard } from './routing/guards/CountryAppGuard';
import { CountryGuardSimple } from './routing/guards/CountryGuardSimple';
import { RedirectToCountry } from './routing/RedirectToCountry';

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <RedirectToCountry />,
    },
    {
      path: '/:countryId',
      element: <CountryGuardSimple />,
      children: [
        // Static pages - use StaticLayout
        {
          element: <StaticLayout />,
          children: [
            {
              index: true,
              element: <HomePage />,
            },
            {
              path: 'donate',
              element: <DonatePage />,
            },
            {
              path: 'supporters',
              element: <SupportersPage />,
            },
            {
              path: 'team',
              element: <TeamPage />,
            },
            {
              path: 'privacy',
              element: <PrivacyPage />,
            },
            {
              path: 'terms',
              element: <TermsPage />,
            },
            {
              path: 'methodology',
              element: <div>Methodology page</div>,
            },
            {
              path: 'support',
              element: <div>Support page</div>,
            },
            {
              path: 'research',
              element: <ResearchPage />,
            },
            {
              path: 'research/:slug',
              element: <BlogPage />,
            },
          ],
        },
        // Embed routes - minimal layout for iframe embedding
        {
          children: [
            {
              path: 'embed/org-logos',
              element: <OrgLogosEmbedPage />,
            },
          ],
        },
        // Interactive app routes - use StaticLayout with CountryAppGuard
        {
          element: <CountryAppGuard />,
          children: [
            {
              element: <StaticLayout />,
              children: [
                {
                  path: ':slug',
                  element: <AppPage />,
                },
              ],
            },
          ],
        },
        // Legacy routes - redirect old blog URLs to new research URLs
        {
          children: [
            {
              path: 'blog/:postName',
              element: <Navigate to="../research/:postName" replace />,
            },
          ],
        },
      ],
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
  }
);

export function WebsiteRouter() {
  return <RouterProvider router={router} />;
}
