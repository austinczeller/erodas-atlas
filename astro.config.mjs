import { defineConfig } from 'astro/config';
import { visit } from 'unist-util-visit';

function rehypeCallouts() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'blockquote') return;
      const firstP = node.children?.find(
        (c) => c.type === 'element' && c.tagName === 'p'
      );
      if (!firstP) return;
      const firstText = firstP.children?.[0];
      if (!firstText || firstText.type !== 'text') return;
      const match = firstText.value.match(/^\[!(\w+)\][-+]?\s*/);
      if (!match) return;
      const calloutType = match[1].toLowerCase();
      node.properties = node.properties || {};
      node.properties.className = ['callout', `callout-${calloutType}`];
      node.properties['data-callout'] = calloutType;
      firstText.value = firstText.value.slice(match[0].length);
    });
  };
}

export default defineConfig({
  site: 'https://austinczeller.github.io',
  base: '/erodas-atlas',
  output: 'static',
  markdown: {
    rehypePlugins: [rehypeCallouts],
  },
});
