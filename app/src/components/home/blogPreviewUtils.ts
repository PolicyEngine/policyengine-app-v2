import type { BlogPost } from '@/types/blog';

export function getPostImageUrl(post: BlogPost): string {
  if (!post.image) {
    return '';
  }
  if (post.image.startsWith('http')) {
    return post.image;
  }
  return `/assets/posts/${post.image}`;
}

export function formatPostDate(dateStr: string): string {
  // Append T12:00:00 to date-only strings to avoid UTC midnight timezone shift
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? `${dateStr}T12:00:00` : dateStr;
  return new Date(normalized).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
