/**
 * Router for the Website (policyengine.org)
 * Contains homepage, blog, team, and embedded apps
 */
import { createBrowserRouter, Navigate, RouterProvider, useParams } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import StaticLayout from './components/StaticLayout';
import AdsDashboardPage from './pages/AdsDashboard.page';
import AIGrowthResearchPage from './pages/AIGrowthResearch.page';
import AppPage from './pages/AppPage';
import BlogPage from './pages/Blog.page';
import BrandPage from './pages/Brand.page';
import BrandAssetsPage from './pages/BrandAssets.page';
import BrandDesignPage from './pages/BrandDesign.page';
import BrandWritingPage from './pages/BrandWriting.page';
import DonatePage from './pages/Donate.page';
import OrgLogosEmbedPage from './pages/embed/OrgLogosEmbed.page';
import HomePage from './pages/Home.page';
import ClaudePluginsPage from './pages/ClaudePlugins.page';
import ModelPage from './pages/Model.page';
import PrivacyPage from './pages/Privacy.page';
import ResearchPage from './pages/Research.page';
import SupportersPage from './pages/Supporters.page';
import TeamPage from './pages/Team.page';
import TermsPage from './pages/Terms.page';
import YearInReviewPage from './pages/YearInReview.page';
import { CountryAppGuard } from './routing/guards/CountryAppGuard';
import { CountryGuardSimple } from './routing/guards/CountryGuardSimple';
import { RedirectToCountry } from './routing/RedirectToCountry';

// Redirect component for legacy /blog/:postName URLs
function BlogRedirect() {
  const { postName } = useParams();
  return <Navigate to={`../research/${postName}`} replace />;
}

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
              element: <Navigate to="../model" replace />,
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
            {
              path: 'brand',
              element: <BrandPage />,
            },
            {
              path: 'brand/design',
              element: <BrandDesignPage />,
            },
            {
              path: 'brand/writing',
              element: <BrandWritingPage />,
            },
            {
              path: 'brand/assets',
              element: <BrandAssetsPage />,
            },
            {
              path: 'ads-dashboard',
              element: <AdsDashboardPage />,
            },
            {
              path: 'ai-inequality',
              element: <AIGrowthResearchPage />,
            },
            {
              path: 'model',
              element: <ModelPage />,
            },
            {
              path: 'claude-plugins',
              element: <ClaudePluginsPage />,
            },
          ],
        },
        // Full-page embeds - no layout wrapper
        {
          path: '2025-year-in-review',
          element: <YearInReviewPage />,
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
        // Interactive app routes - use AppLayout (no legacy banner) with CountryAppGuard
        {
          element: <CountryAppGuard />,
          children: [
            {
              element: <AppLayout />,
              children: [
                {
                  path: ':slug/*',
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
              path: 'blog',
              element: <Navigate to="../research" replace />,
            },
            {
              path: 'blog/:postName',
              element: <BlogRedirect />,
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
