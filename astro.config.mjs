// @ts-check
import { defineConfig } from "astro/config";
import { remarkWikilinks } from "./src/lib/wikilinks.mjs";

const base = "/erodas-atlas";

export default defineConfig({
  site: "https://austinczeller.github.io",
  base,
  trailingSlash: "always",
  markdown: {
    remarkPlugins: [[remarkWikilinks, { base }]],
  },
});
