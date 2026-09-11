import { z } from 'zod';
export const idSchema = z.coerce.number().int().positive();
export const cardSchema = z.object({
  id: z.number().int().positive().optional(),
  front: z.string().trim().min(1).max(2000),
  back: z.string().trim().min(1).max(8000),
});
export const deckSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().max(1000).default(''),
  category: z.string().trim().min(1).max(60).default('ทั่วไป'),
  color: z.enum(['purple', 'blue', 'green', 'orange']).default('purple'),
  cards: z.array(cardSchema).min(1).max(500),
});
export const credentialsSchema = z.object({
  email: z.email().max(254).transform(s => s.toLowerCase()),
  password: z.string().min(8).max(256),
});
export const registerSchema = credentialsSchema.extend({ name: z.string().trim().min(1).max(80) });
export const reviewSchema = z.object({
  id: z.string().min(1).max(80), card_id: z.number().int().positive(),
  rating: z.enum(['again', 'hard', 'good', 'easy']), seconds: z.number().int().min(0).max(3600).default(0),
});
export const generationSchema = z.object({
  text: z.string().trim().min(5).max(60000), count: z.number().int().min(1).max(30).default(10),
  mode: z.enum(['local', 'ai']).default('local'), language: z.enum(['Thai', 'English', 'Japanese']).default('Thai'),
});
export const fileSchema = z.object({ name: z.string().min(1).max(255), content: z.string().min(1).max(28 * 1024 * 1024) });
