---
description: Interactive walkthrough for publishing a research article or interactive tool
allowed-tools: Read, Write, Edit, Bash(npm run prettier:*), Glob, Grep, AskUserQuestion
---

Help me publish new content to the PolicyEngine website. Walk through each step interactively, asking me questions and waiting for my response before proceeding. Use the AskUserQuestion tool for each step.

## Step 1: Content type

Ask: "What are you publishing?"
- **Research article** → article pathway (writes to `app/src/data/posts/posts.json`)
- **Interactive tool** → tool pathway (writes to `app/src/data/apps/apps.json`)

---

## Article Pathway

Write an entry to `app/src/data/posts/posts.json`.

### Step A1: Title
Ask for the article title. Remind the user: "Use sentence case — capitalize only the first word and proper nouns."

### Step A2: Description
Ask for a brief description (1-2 sentences). Same sentence case reminder.

### Step A3: Filename
Ask for the article filename (markdown `.md` or Jupyter notebook `.ipynb`). Validate the file exists in `app/src/data/posts/articles/` by reading the directory. The slug will be auto-derived from the filename (lowercase, underscores to hyphens, extension stripped).

### Step A4: Date
Ask for the publication date. Suggest today's date in ISO format (e.g., "2026-02-02 12:00:00"). Default to today if the user confirms.

### Step A5: Authors
Ask for author IDs as a comma-separated list (e.g., "max-ghenis, nikhil-woodruff"). Read `app/src/data/posts/authors.json` to validate each author ID exists. If an author is not found, offer to create a new entry in `authors.json` by asking for their name, title, bio, and headshot filename.

### Step A6: Tags
Ask for tags as a comma-separated list. Show common examples:
- **Location tags**: us, uk, ca, ng, global, us-ca, us-ny, us-tx (and other state codes)
- **Topic tags**: policy, technical, ai, tax, benefit, impact, election, inflation, healthcare, org

### Step A7: Image
Ask: "What cover image should this article use?" Present options:
1. **Image file** — provide a filename. The file should be in `app/public/assets/posts/` or an external URL starting with `http`.
2. **CSS visual** — use a registered CSS visual. Available visuals: `state-map-dots`. Format: `"css:state-map-dots"`. If they want a new CSS visual, suggest reading the `css-visual-patterns` skill and creating one first.
3. **External URL** — provide a full URL to an image.

### Step A8: Optional fields
Ask if they want to set any optional fields:
- **imageCredit** — image attribution text
- **hideHeaderImage** — set to `true` to hide the header image on the article page (useful when the image is generic or irrelevant to the content)

### Step A9: Review and write
1. Show the complete JSON entry formatted as a code block.
2. Ask the user to confirm it looks correct.
3. If confirmed:
   - Read `app/src/data/posts/posts.json`
   - Add the new entry at the beginning of the array (newest first)
   - Write the updated file
   - Run `cd /Users/administrator/Documents/PolicyEngine/state-tracker/app && npm run prettier -- --write src/data/posts/posts.json`
4. Remind the user:
   - Place the article file in `app/src/data/posts/articles/`
   - Place any images in `app/public/assets/posts/`
   - Test locally before committing

---

## Tool Pathway

Write an entry to `app/src/data/apps/apps.json`.

### Step T1: App type
Ask: "What type of application is this?"
- **iframe** — standard iframe embed (most common)
- **streamlit** — Streamlit app with sleep-state handling
- **obbba-iframe** — iframe with postMessage/URL sync support
- **custom** — custom React component

### Step T2: Slug
Ask for a URL-safe slug (e.g., "my-new-calculator"). Validate: lowercase, hyphens only, no spaces or special characters.

### Step T3: Title
Ask for the display title. Remind: "Use sentence case."

### Step T4: Description
Ask for a brief description (1-2 sentences). Sentence case reminder.

### Step T5: Source URL
Ask for the external URL where the app is hosted. Validate it looks like a proper URL.

### Step T6: Country
Ask: "Which country does this tool apply to?" Options: us, uk, ca, ng, global.

### Step T7: Tags
Ask for topic tags as a comma-separated list. Do NOT include the country code (that goes in `countryId`). Do NOT include "isFeatured" as a tag (that's a separate boolean field). Suggest common tags: policy, healthcare, reconciliation, interactives, tracker, scotland.

### Step T8: Featured status
Ask: "Should this tool be featured prominently on the Tools landing page?"
- If yes, set `"isFeatured": true`. Read `apps.json` to check if another tool is already featured. If so, warn: "Another tool is currently featured. The newest one by date will be displayed. Make sure to set a date."
- If no, omit the `isFeatured` field.

### Step T9: Research listing
Ask: "Should this tool also appear in the Research listing alongside blog posts?"
- If yes, set `"displayWithResearch": true` and note that `image`, `date`, and `authors` will be required in the next steps.

### Step T10: Image
Ask: "Does this tool have a cover image?" Present options:
1. **Image file** — filename in `app/public/assets/posts/` or external URL
2. **CSS visual** — registered CSS visual (e.g., `"css:state-map-dots"`). If they want a new one, suggest reading the `css-visual-patterns` skill and creating one first.
3. **None** — a decorative placeholder will be shown

### Step T11: Additional metadata
If `displayWithResearch` is true, require:
- **date** — ISO format, suggest today
- **authors** — validate against `app/src/data/posts/authors.json`
- **image_credit** — optional attribution

If `featured` is true and no date was set yet, ask for a date (needed for priority sorting).

Otherwise, ask if they'd like to optionally set date, authors, or image_credit.

### Step T12: Review and write
1. Show the complete JSON entry formatted as a code block.
2. Ask the user to confirm.
3. If confirmed:
   - Read `app/src/data/apps/apps.json`
   - Add the new entry at the end of the array
   - Write the updated file
   - Run `cd /Users/administrator/Documents/PolicyEngine/state-tracker/app && npm run prettier -- --write src/data/apps/apps.json`
4. Remind the user:
   - Place any image files in `app/public/assets/posts/`
   - Test the tools page locally
   - Run `/finalize-pr` before committing
