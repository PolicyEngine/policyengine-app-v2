# Blog Posts

This folder contains the blog posts for PolicyEngine.

## Structure

- `articles/` - Markdown files for each blog post
- `posts.json` - Metadata for all posts (title, description, date, cover image, tags, authors)
- `authors.json` - Author information
- `images/` - Legacy image folder (do not use for new posts)

## Adding Images to Blog Posts

**Important**: Images should be stored in `app/public/assets/posts/{post-name}/` and referenced with absolute paths.

### Correct Format

```markdown
![Alt text](/assets/posts/your-post-name/image.png)
```

### Example

For a post with filename `giving-tuesday-2025.md`:

1. Create folder: `app/public/assets/posts/giving-tuesday-2025/`
2. Add images to that folder
3. Reference in markdown:
   ```markdown
   ![Screenshot](/assets/posts/giving-tuesday-2025/screenshot.png)
   ```

### Cover Images

Cover images are specified in `posts.json` with a relative path from the images folder:

```json
{
  "filename": "your-post.md",
  "image": "your-post/cover.png"
}
```

The cover image file should be at: `app/src/data/posts/images/your-post/cover.png`

## External Images

You can also use external CDN URLs (e.g., from Medium):

```markdown
![](https://cdn-images-1.medium.com/max/2000/image.png)
```
