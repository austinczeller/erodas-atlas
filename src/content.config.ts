import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const aliases = z.array(z.string()).optional();

// A day of the Erodian Standard Calendar. Months are numbered 1 (Nhaale) to 4 (Salaale).
const calendarDate = z.object({ month: z.number().int().min(1).max(4), day: z.number().int().min(1).max(80) });

const places = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/places" }),
  schema: z.object({
    title: z.string(),
    kind: z.enum(["World", "Continent", "Region", "City", "Town", "Island", "Landmark"]),
    // Slug of the place this one sits inside, e.g. "caldrith".
    parent: z.string().optional(),
    description: z.string(),
    // Position on the Korlornium map, as fractions of its width and height.
    map: z.object({ x: z.number(), y: z.number() }).optional(),
    // How far the locator map zooms in on this place (higher is closer).
    mapZoom: z.number().default(4),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    order: z.number().default(100),
    aliases,
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
    aliases,
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
    // Observances only: where they fall on the calendar.
    date: calendarDate.optional(),
    endDate: calendarDate.optional(),
    aliases,
  }),
});

const figures = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/figures" }),
  schema: z.object({
    title: z.string(),
    // A short line under the name, e.g. "Founder of Dithoria City".
    role: z.string(),
    group: z.enum(["Figures of history", "Rulers and leaders", "Captains of the Scar"]),
    order: z.number().default(100),
    aliases,
  }),
});

const sky = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/sky" }),
  schema: z.object({
    title: z.string(),
    kind: z.enum(["Moon", "Constellation"]),
    description: z.string(),
    cycle: z.string().optional(),
    order: z.number().default(100),
    aliases,
  }),
});

const species = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/species" }),
  schema: z.object({
    title: z.string(),
    // How often the species is met in Korlornium.
    rarity: z.enum(["Common", "Uncommon", "Rare"]),
    description: z.string(),
    order: z.number().default(100),
    aliases,
  }),
});

export const collections = { places, gods, history, figures, sky, species };
