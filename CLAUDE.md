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

1. **Create a markdown file** in `public/documents/{Category}/recipe-name.md`
2. **Add frontmatter** at the top of the file with the following fields:
   ```yaml
   ---
   name: Recipe Name
   categories: Category1, Category2
   preview: /images/recipe-image.jpg
   tags: tag1, tag2, tag3
   ---
   ```
   - `name`: Display name of the recipe (required)
   - `categories`: Comma-separated list of categories (required)
   - `preview`: Path to preview image relative to `public/` directory (required)
   - `tags`: Comma-separated tags for additional classification (optional)

3. **Write the recipe content** using standard markdown after the frontmatter:
   ```markdown
   # Recipe Name

   ## Zutaten
   - Ingredient 1
   - Ingredient 2

   ## Zubereitung
   1. Step 1
   2. Step 2
   ```

4. **Add the preview image** to `public/images/` directory

5. **Rebuild the index** to make the recipe searchable:
   ```bash
   npm run build-index
   ```

**Important Notes:**
- The `preview` path should be relative to the `public/` directory (e.g., `/images/photo.jpg`)
- Categories should match existing category names for consistent navigation
- After adding/modifying recipes, always run `npm run build-index` before testing

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
- Markdown files live in `public/documents/` with category subdirectories
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

- Recipe files must be markdown (`.md`) in `public/documents/` subdirectories
- Recipe metadata (name, categories, preview image) is defined via YAML frontmatter
- The app is German-language focused (stemmer, stopwords, excluded tokens)
- Changes to search behavior require rebuilding the index: `npm run build-index`
- Adding or modifying recipes requires running `npm run build-index` to update registry and search index
