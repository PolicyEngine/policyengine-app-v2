import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getArticleContent, getAllSlugs, getPostBySlug } from "@/lib/articles";
import { encodeJsonForScript } from "@/lib/encodeJsonForScript";
import { isNotebookFile } from "@/lib/notebookUtils";
import ArticleClient from "./ArticleClient";

/**
 * Generate static params for all article slugs.
 * Next.js pre-renders each page at build time.
 */
export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

/**
 * Generate metadata (OG tags, title) for each article.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ countryId: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  const imageUrl = post.image
    ? post.image.startsWith("http")
      ? post.image
      : `/assets/posts/${post.image}`
    : undefined;

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ countryId: string; slug: string }>;
}) {
  const { countryId, slug } = await params;

  // Redirect old dated URL format (YYYY-MM-DD-slug → slug)
  const datePrefix = /^\d{4}-\d{2}-\d{2}-/;
  if (datePrefix.test(slug)) {
    redirect(`/${countryId}/research/${slug.substring(11)}`);
  }

  const post = getPostBySlug(slug);
  if (!post) notFound();

  const content = getArticleContent(post.filename);
  const isNotebook = isNotebookFile(post.filename);

  const imageUrl = post.image
    ? post.image.startsWith("http")
      ? post.image
      : `https://www.policyengine.org/assets/posts/${post.image}`
    : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: post.authors.map((name) => ({ "@type": "Person", name })),
    publisher: {
      "@type": "Organization",
      name: "PolicyEngine",
      url: "https://www.policyengine.org",
    },
    ...(imageUrl ? { image: imageUrl } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: encodeJsonForScript(jsonLd) }}
      />
      <ArticleClient
        post={post}
        content={content}
        isNotebook={isNotebook}
        countryId={countryId}
      />
    </>
  );
}
