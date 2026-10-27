// Turns Obsidian-style [[Page]] and [[Page|label]] links into real links.
// Targets are looked up by each entry's title and aliases across the content
// collections. A link to a page that doesn't exist on the atlas becomes plain
// text, so content can be pasted from the vault without leaking dead links.
import fs from "node:fs";
import path from "node:path";

const COLLECTIONS = ["places", "gods", "history", "figures", "sky"];
const EXTRA_PAGES = {
  "next adventure": "next-adventure/",
  calendar: "calendar/",
  gods: "gods/",
  "inspiration board": "inspiration/",
  "notable figures": "figures/",
  "the erodian standard calendar": "calendar/",
};

function readFrontmatter(file) {
  const text = fs.readFileSync(file, "utf8");
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const fm = match[1];
  const title = fm.match(/^title:\s*"?(.*?)"?\s*$/m)?.[1];
  const aliases = [];
  const block = fm.match(/^aliases:\s*\r?\n((?:\s+-.*\r?\n?)*)/m);
  if (block) {
    for (const line of block[1].split(/\r?\n/)) {
      const value = line.match(/^\s+-\s*"?(.*?)"?\s*$/)?.[1];
      if (value) aliases.push(value);
    }
  }
  return { title, aliases };
}

export function buildLinkIndex(base) {
  const index = new Map();
  for (const collection of COLLECTIONS) {
    const dir = path.resolve("src/content", collection);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith(".md")) continue;
      const slug = name.replace(/\.md$/, "");
      const url = `${base}/${collection}/${slug}/`;
      const { title, aliases } = readFrontmatter(path.join(dir, name));
      for (const key of [title, ...(aliases ?? [])]) {
        if (key) index.set(key.toLowerCase(), url);
      }
    }
  }
  for (const [key, page] of Object.entries(EXTRA_PAGES)) {
    index.set(key, `${base}/${page}`);
  }
  return index;
}

const WIKILINK = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

export function remarkWikilinks({ base }) {
  return (tree) => {
    const index = buildLinkIndex(base);
    const walk = (node) => {
      if (!node.children) return;
      if (node.type === "link" || node.type === "code" || node.type === "inlineCode") return;
      const next = [];
      for (const child of node.children) {
        if (child.type !== "text" || !child.value.includes("[[")) {
          walk(child);
          next.push(child);
          continue;
        }
        let last = 0;
        for (const m of child.value.matchAll(WIKILINK)) {
          if (m.index > last) next.push({ type: "text", value: child.value.slice(last, m.index) });
          const target = m[1].trim();
          const label = (m[2] ?? target).trim();
          const url = index.get(target.toLowerCase());
          next.push(
            url
              ? { type: "link", url, children: [{ type: "text", value: label }] }
              : { type: "text", value: label },
          );
          last = m.index + m[0].length;
        }
        if (last < child.value.length) next.push({ type: "text", value: child.value.slice(last) });
      }
      node.children = next;
    };
    walk(tree);
  };
}
