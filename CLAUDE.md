# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a recipe repository application that uses markdown files to store recipes. A build process generates search indexes and a registry, then the app is deployed as a static Progressive Web App (PWA) to GitHub Pages.

## Key Commands

### Development
```bash
npm run dev                # Start development server with hot reload
npm run build              # Full production build (runs build-index + build-app)
npm run build-index        # Build search index and registry from markdown files
npm run build-app          # Build Vue app (type-check + vite build)
npm run preview            # Preview production build locally
```

### Testing & Type Checking
```bash
npm run test:unit          # Run Vitest unit tests
npm run type-check         # Run TypeScript type checking with vue-tsc
```

### Build Process Details
The `build-index` script (node index.js) must run before `build-app`. It:
- Scans `public/documents/` for markdown files
- Generates `public/registry.json` (recipe metadata)
- Generates `public/searchindex.json` (inverted search index)
- Uses German text processing (stemming, stopwords)

## Adding a New Recipe

Recipe documents use YAML frontmatter to define metadata. To add a new recipe:

### 1. Create the Markdown File

Create a new `.md` file **directly** in `public/documents/` (not in subdirectories). Use a descriptive, lowercase filename with underscore as separator:
```bash
public/documents/recipe_name.md
```

Example filenames: `kartoffel_suppe.md`, `schokoladen_kuchen.md`, `pasta_carbonara.md`

### 2. Add YAML Frontmatter

Start the file with YAML frontmatter containing recipe metadata:

```yaml
---
name: Recipe Name
categories: Category1, Category2
preview: /images/recipe-image.jpg
tags: tag1, tag2, tag3

---
```

**Frontmatter Fields:**
- `name` (required): The display name shown in the UI (e.g., "Kartoffel-Lauch-Suppe")
- `categories` (required): Comma-separated category list. Common categories include:
  - `Hauptgericht` - Main dishes
  - `Dessert` - Desserts
  - `Kuchen` - Cakes
  - `Salat` - Salads
  - `Beilage` - Side dishes
  - Can use multiple: `Hauptgericht, Beilage` or `Dessert, Kuchen`
- `preview` (optional): Path to preview image, relative to `public/` directory (e.g., `/images/soup.jpg`)
  - Leave empty if no image available (just `preview:` with nothing after)
- `tags` (optional): Comma-separated tags for additional classification (e.g., `vegetarisch, vegan, schnell`)
  - Leave empty if not using tags (just `tags:` with nothing after)

**Note:** Leave a blank line after the closing `---`

### 3. Write the Recipe Content

After the frontmatter, write the recipe using standard markdown. The typical structure is:

```markdown
# Recipe Name

## Zutaten

- 500 g Ingredient 1
- 2 Stück Ingredient 2
- 1 TL Ingredient 3
- Salz, Pfeffer

## Zubereitung

1. First preparation step with detailed instructions.

2. Second step explaining the next action.

3. Third step, and so on.

4. Final step and serving suggestions.
```

**German Section Headings:**
- `## Zutaten` - Ingredients list (use bulleted list with `-`)
- `## Zubereitung` - Preparation steps (use numbered list with `1.`, `2.`, etc.)

### 4. Add Preview Image (Optional)

If you have a preview image:
1. Add the image file to `public/images/` directory
2. Update the `preview:` field in frontmatter with the path: `/images/your-image.jpg`

### 5. Rebuild the Index

After creating or modifying any recipe, rebuild the search index and registry:
```bash
npm run build-index
```

This generates `public/registry.json` and `public/searchindex.json` so the recipe appears in the app.

**Important Notes:**
- Recipe files go directly in `public/documents/`, not in category subdirectories
- File names should use lowercase and underscore (e.g., `rote_linsen_dal.md`)
- The recipe name in the markdown heading (`# Recipe Name`) should match the `name` field in frontmatter
- Categories in frontmatter are comma-separated strings, not arrays
- Always run `npm run build-index` after adding/modifying recipes
- Preview images are optional - leave the field empty if you don't have an image yet

## Architecture

### Two-Phase Build System

**Phase 1: Index Generation (`index.js`)**
- Node.js script that processes markdown recipe files
- Extracts recipe metadata from YAML frontmatter (name, categories, preview, tags)
- Categories are split from comma-separated strings into arrays (e.g., "Dessert, Kuchen" → ["Dessert", "Kuchen"])
- Creates two critical JSON files consumed by the Vue app:
  - `registry.json`: Metadata for all recipes (name, slug, path, preview image, category array, modified date)
  - `searchindex.json`: Inverted index mapping stemmed German tokens to recipe paths
- German language processing:
  - Custom German stemmer (3-step suffix removal: ern/er/en → nd/ig/isch/lich → keit/ung)
  - Umlaut normalization (ä→ae, ö→oe, ü→ue, ß→ss)
  - German stopword removal using `stopword` library
  - Recipe-specific token exclusions (e.g., "Zutaten", "Gramm", "Backofen")
  - Frontmatter is stripped before indexing; recipe name from markdown heading is weighted higher in search
- Configurable via CLI args: `--base`, `--publicFolder`, `--documentPath`, `--maxKeywordsPerFile`

**Phase 2: Vue App Build (`vite build`)**
- Standard Vue 3 + TypeScript + Vite build
- Base path set to `/markdown-blog/` for GitHub Pages deployment
- Generates random `BUILD_HASH` for cache-busting the JSON files

### Frontend Architecture

**State Management (Pinia)**
- `useRegistryStore`: Loads `registry.json`, provides category filtering, slug/path lookups
- `useIndexStore`: Loads `searchindex.json` for client-side search

**Search Implementation**
The search algorithm (in `SearchView.vue`) works by:
1. Tokenizing user query with the same German stemmer used during indexing
2. Finding index tokens that contain any query token (substring match)
3. Collecting recipe paths from matching index entries
4. Filtering results to recipes that match ALL query tokens (AND operation)

**Routing**
- `/` - OverviewView (recent recipes)
- `/recipe/:slug` - RecipeRecord (single recipe display)
- `/category/:category` - CategoryView (recipes by category)
- `/search/:query` - SearchView (search results)

### Critical Patterns

**Stemmer Synchronization**
The German stemmer implementation exists in TWO places and must stay identical:
- Build script: `index.js` lines 79-135
- Vue app: `src/helper/stemmer.ts`

Changes to stemming logic require updating both files, then rebuilding the index.

**Path Resolution**
- Markdown files are stored directly in `public/documents/` (flat structure, no category subdirectories)
- Image paths in markdown (`![](image.png)`) are resolved relative to the markdown file
- Preview paths in frontmatter can be absolute (`/images/photo.jpg`) or relative (`../../images/photo.jpg`)
- Relative preview paths are resolved from the markdown file's location, not from `public/`
- All paths converted to URLs relative to `BASE_URL` via `UrlRelativeFromPublic()`

**Cache Busting**
The app loads JSON files with `?hash={BUILD_HASH}` query parameter. The hash is regenerated on each build via `vite.config.ts`.

## Deployment

The app deploys to GitHub Pages via `.github/workflows/publish.yml`:
- Triggered on push to `main` branch
- Uses `xRealNeon/VuePagesAction@1.0.1` to build and publish
- Publishes to `https://yvo-niedrich.github.io/markdown-blog/`

## Important Constraints

- Recipe files must be markdown (`.md`) stored directly in `public/documents/`
- Recipe metadata (name, categories, preview image) is defined via YAML frontmatter
- The app is German-language focused (stemmer, stopwords, excluded tokens)
- Changes to search behavior require rebuilding the index: `npm run build-index`
- Adding or modifying recipes requires running `npm run build-index` to update registry and search index
