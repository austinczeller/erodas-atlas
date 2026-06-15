import { defineCollection, z } from 'astro:content';

const docs = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().optional(),
    publish: z.union([z.boolean(), z.string()]).optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    aliases: z.array(z.string()).optional(),
  }).passthrough(),
});

export const collections = { docs };
