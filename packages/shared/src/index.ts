import { z } from "zod";

export const Roles = z.enum(["USER", "ADMIN"]);
export type Role = z.infer<typeof Roles>;

export const registerInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(2).max(50).optional()
});
export type RegisterInput = z.infer<typeof registerInputSchema>;

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128)
});
export type LoginInput = z.infer<typeof loginInputSchema>;

export const PostMediaType = z.enum(["IMAGE", "VIDEO"]);
export type MediaType = z.infer<typeof PostMediaType>;

export const CreatePostSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(20000),
  isPublic: z.boolean().default(false)
});
export type CreatePostInput = z.infer<typeof CreatePostSchema>;

// Date utils (shared between api & web)
export function addDays(date: Date, days: number): Date {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

export type SafeUser = {
  id: string;
  email: string;
  displayName: string | null;
  role: Role;
  membershipExpiresAt: string | null;
};

export type FeedPost = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  media: { id: string; type: MediaType; url: string }[];
  paywalled: boolean;
};

export function isMembershipActive(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  const t = Date.parse(expiresAt);
  if (Number.isNaN(t)) return false;
  return t > Date.now();
}
