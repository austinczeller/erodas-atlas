import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const places = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/places" }),
  schema: z.object({
    title: z.string(),
    kind: z.enum(["Continent", "Region", "City", "Town", "Island", "Landmark"]),
    // Slug of the place this one sits inside, e.g. "caldrith".
    parent: z.string().optional(),
    description: z.string(),
    // Position on the Korlornium map, as fractions of its width and height.
    map: z.object({ x: z.number(), y: z.number() }).optional(),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    order: z.number().default(100),
    aliases: z.array(z.string()).optional(),
  }),
});

const gods = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/gods" }),
  schema: z.object({
    title: z.string(),
    domain: z.string(),
    symbol: z.string().optional(),
    quote: z.string().optional(),
    group: z.enum(["The Three Sisters", "The Major Powers", "Lesser Powers"]),
    order: z.number().default(100),
    aliases: z.array(z.string()).optional(),
  }),
});

const history = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/history" }),
  schema: z.object({
    title: z.string(),
    kind: z.enum(["Era", "Event", "Observance"]),
    // How the date reads on the timeline, e.g. "Year 0" or "45th of Xhaale".
    when: z.string(),
    description: z.string(),
    order: z.number(),
    aliases: z.array(z.string()).optional(),
  }),
});

export const collections = { places, gods, history };
