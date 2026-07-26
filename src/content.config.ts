/**
 * TaxBrain — Content Collection Configuration
 *
 * Defines the schema for knowledge base articles.
 * Uses Astro 7.x Content Layer API with glob loader.
 */

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const knowledge = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/knowledge' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum([
      'regimes',
      'deductions',
      'salary',
      'investments',
      'life-events',
      'basics',
    ]),
    tags: z.array(z.string()),
    readingTime: z.number(), // minutes
    priority: z.number().default(0), // Higher = shown first
    relatedSections: z.array(z.string()).default([]),
    lastUpdated: z.string(),
  }),
});

export const collections = { knowledge };
