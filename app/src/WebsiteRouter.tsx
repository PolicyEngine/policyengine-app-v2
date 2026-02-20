/**
 * Router for the Website (policyengine.org)
 * Contains homepage, blog, team, and embedded apps
 */
import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, RouterProvider, useParams } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import StaticLayout from './components/StaticLayout';
import { CountryAppGuard } from './routing/guards/CountryAppGuard';
import { CountryGuardSimple } from './routing/guards/CountryGuardSimple';
import { RedirectToCountry } from './routing/RedirectToCountry';

// Lazy-loaded pages
const AdsDashboardPage = lazy(() => import('./pages/AdsDashboard.page'));
const AIGrowthResearchPage = lazy(() => import('./pages/AIGrowthResearch.page'));
const AppPage = lazy(() => import('./pages/AppPage'));
const BlogPage = lazy(() => import('./pages/Blog.page'));
const BrandPage = lazy(() => import('./pages/Brand.page'));
const BrandAssetsPage = lazy(() => import('./pages/BrandAssets.page'));
const BrandDesignPage = lazy(() => import('./pages/BrandDesign.page'));
const BrandWritingPage = lazy(() => import('./pages/BrandWriting.page'));
const DonatePage = lazy(() => import('./pages/Donate.page'));
const OrgLogosEmbedPage = lazy(() => import('./pages/embed/OrgLogosEmbed.page'));
const HomePage = lazy(() => import('./pages/Home.page'));
const ModelPage = lazy(() => import('./pages/Model.page'));
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
              element: (
                <Suspense fallback={null}>
                  <HomePage />
                </Suspense>
              ),
            },
            {
              path: 'donate',
              element: (
                <Suspense fallback={null}>
                  <DonatePage />
                </Suspense>
              ),
            },
            {
              path: 'supporters',
              element: (
                <Suspense fallback={null}>
                  <SupportersPage />
                </Suspense>
              ),
            },
            {
              path: 'team',
              element: (
                <Suspense fallback={null}>
                  <TeamPage />
                </Suspense>
              ),
            },
            {
              path: 'privacy',
              element: (
                <Suspense fallback={null}>
                  <PrivacyPage />
                </Suspense>
              ),
            },
            {
              path: 'terms',
              element: (
                <Suspense fallback={null}>
                  <TermsPage />
                </Suspense>
              ),
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
              element: (
                <Suspense fallback={null}>
                  <ResearchPage />
                </Suspense>
              ),
            },
            {
              path: 'research/:slug',
              element: (
                <Suspense fallback={null}>
                  <BlogPage />
                </Suspense>
              ),
            },
            {
              path: 'brand',
              element: (
                <Suspense fallback={null}>
                  <BrandPage />
                </Suspense>
              ),
            },
            {
              path: 'brand/design',
              element: (
                <Suspense fallback={null}>
                  <BrandDesignPage />
                </Suspense>
              ),
            },
            {
              path: 'brand/writing',
              element: (
                <Suspense fallback={null}>
                  <BrandWritingPage />
                </Suspense>
              ),
            },
            {
              path: 'brand/assets',
              element: (
                <Suspense fallback={null}>
                  <BrandAssetsPage />
                </Suspense>
              ),
            },
            {
              path: 'ads-dashboard',
              element: (
                <Suspense fallback={null}>
                  <AdsDashboardPage />
                </Suspense>
              ),
            },
            {
              path: 'ai-inequality',
              element: (
                <Suspense fallback={null}>
                  <AIGrowthResearchPage />
                </Suspense>
              ),
            },
            {
              path: 'model',
              element: (
                <Suspense fallback={null}>
                  <ModelPage />
                </Suspense>
              ),
            },
          ],
        },
        // Full-page embeds - no layout wrapper
        {
          path: '2025-year-in-review',
          element: (
            <Suspense fallback={null}>
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
                <Suspense fallback={null}>
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
                    <Suspense fallback={null}>
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
