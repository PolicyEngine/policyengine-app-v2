/**
 * Router for the Website (policyengine.org)
 * Contains homepage, blog, team, and embedded apps
 */
import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, RouterProvider, useParams } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import StaticLayout from './components/StaticLayout';
import HomePage from './pages/Home.page';
import { CountryAppGuard } from './routing/guards/CountryAppGuard';
import { CountryGuardSimple } from './routing/guards/CountryGuardSimple';
import { RedirectToCountry } from './routing/RedirectToCountry';
import SuspenseOutlet from './routing/SuspenseOutlet';

// Lazy-loaded pages — only fetched when the route is visited
const AdsDashboardPage = lazy(() => import('./pages/AdsDashboard.page'));
const AIGrowthResearchPage = lazy(() => import('./pages/AIGrowthResearch.page'));
const AppPage = lazy(() => import('./pages/AppPage'));
const BlogPage = lazy(() => import('./pages/Blog.page'));
const BrandPage = lazy(() => import('./pages/Brand.page'));
const BrandAssetsPage = lazy(() => import('./pages/BrandAssets.page'));
const BrandDesignPage = lazy(() => import('./pages/BrandDesign.page'));
const BrandWritingPage = lazy(() => import('./pages/BrandWriting.page'));
const ClaudePluginsPage = lazy(() => import('./pages/ClaudePlugins.page'));
const DevToolsPage = lazy(() => import('./pages/DevTools.page'));
const DonatePage = lazy(() => import('./pages/Donate.page'));
const ApiStatusPage = lazy(() => import('./pages/ApiStatus.page'));
const OrgLogosEmbedPage = lazy(() => import('./pages/embed/OrgLogosEmbed.page'));
const PrivacyPage = lazy(() => import('./pages/Privacy.page'));
const ResearchPage = lazy(() => import('./pages/Research.page'));
const SupportersPage = lazy(() => import('./pages/Supporters.page'));
const TeamPage = lazy(() => import('./pages/Team.page'));
const TermsPage = lazy(() => import('./pages/Terms.page'));
const YearInReviewPage = lazy(() => import('./pages/YearInReview.page'));

// Redirect component for legacy /blog/:postName URLs
function BlogRedirect() {
  const { postName } = useParams();
  return <Navigate to={`../research/${postName}`} replace />;
}

// /model is handled by Vercel rewrite; methodology does a full-page redirect
function MethodologyRedirect() {
  const { countryId } = useParams();
  window.location.replace(`/${countryId}/model`);
  return null;
}

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <RedirectToCountry />,
    },
    // /slides is handled by Vercel rewrites (server-side proxy to slides app)
    {
      path: '/:countryId',
      element: <CountryGuardSimple />,
      children: [
        // Static pages - use StaticLayout
        {
          element: <StaticLayout />,
          children: [
            {
              element: <SuspenseOutlet />,
              children: [
                {
                  index: true,
                  element: <HomePage />,
                },
                {
                  path: 'dev-tools',
                  element: <DevToolsPage />,
                },
                {
                  path: 'dev-tools/api-status',
                  element: <ApiStatusPage />,
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
                  element: <MethodologyRedirect />,
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
                // /model is handled by Vercel rewrite to policyengine-model.vercel.app
                {
                  path: 'claude-plugin',
                  element: <ClaudePluginsPage />,
                },
              ],
            },
          ],
        },
        // Full-page embeds - no layout wrapper
        {
          path: '2025-year-in-review',
          element: (
            <Suspense>
              <YearInReviewPage />
            </Suspense>
          ),
        },
        // Embed routes - minimal layout for iframe embedding
        {
          children: [
            {
              path: 'embed/org-logos',
              element: (
                <Suspense>
                  <OrgLogosEmbedPage />
                </Suspense>
              ),
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
                  element: (
                    <Suspense>
                      <AppPage />
                    </Suspense>
                  ),
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
