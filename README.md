# The Erodian Atlas

The player-facing atlas for the world of Erodas: https://austinczeller.github.io/erodas-atlas/

Everything here is something the players' characters could know. DM notes and secrets live in the private Erodas_Wiki vault, never in this repo.

## Adding or editing content

All content is Markdown in `src/content/`:

| Folder | Tab | Frontmatter |
|---|---|---|
| `places/` | Places | `title`, `kind` (Continent, Region, City, Town, Island, Landmark), `parent` (the slug of the place it sits in), `description`, optional `map: { x, y }`, `image`, `order` |
| `gods/` | Gods | `title`, `domain`, `group` (The Three Sisters, The Major Powers, Lesser Powers), optional `symbol`, `quote`, `order` |
| `history/` | History | `title`, `kind` (Era, Event, Observance), `when`, `description`, `order` |

The Next Adventure page is `src/writing/next-adventure.md`.

The file name is the page's address: `places/dithoria-city.md` becomes `/places/dithoria-city/`.

Links work like Obsidian: `[[Dithoria City]]` or `[[Dithoria City|the city]]`. A link to a page that doesn't exist on the atlas turns into plain text, so nothing breaks if you paste from the vault.

`map: { x, y }` places a pin on the Korlornium map, as a fraction of the map's width and height (0 to 1). Images go in `public/images/`.

## Running it locally

```bash
npm install
npm run dev
```

Pushing to `main` builds and deploys the site to GitHub Pages.
