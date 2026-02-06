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
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
