import { z } from "zod";

export const newsletterEmailSchema = z.string().trim().min(1, "Please enter your email address.").max(320, "Please enter a valid email address.").email("Please enter a valid email address.");

export const newsletterRequestSchema = z.object({
  email: z.string().max(500),
  locale: z.string().trim().min(2).max(10).optional(),
  website: z.string().max(200).optional(),
}).strict();

export type NewsletterStatus = "subscribed" | "already_subscribed" | "reactivated" | "invalid_email" | "rate_limited" | "error";

export type NewsletterResponse = { success: boolean; status: NewsletterStatus; message: string };

export function normalizeNewsletterEmail(value: string) {
  return value.trim().toLowerCase();
}

export function invalidNewsletterResponse(value: unknown): NewsletterResponse | null {
  const result = newsletterEmailSchema.safeParse(value);
  if (result.success) return null;
  return { success: false, status: "invalid_email", message: result.error.issues[0]?.message ?? "Please enter a valid email address." };
}

export function newsletterMessage(status: NewsletterStatus): NewsletterResponse {
  const messages: Record<NewsletterStatus, string> = {
    subscribed: "Welcome to the YARA inner circle.",
    already_subscribed: "You’re already part of the YARA inner circle.",
    reactivated: "Welcome back to the YARA inner circle.",
    invalid_email: "Please enter a valid email address.",
    rate_limited: "Please wait a moment before trying again.",
    error: "We couldn’t subscribe you right now. Please try again.",
  };
  return { success: status === "subscribed" || status === "reactivated", status, message: messages[status] };
}
