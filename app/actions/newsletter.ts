"use server";

import { headers } from "next/headers";
import nodemailer from "nodemailer";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { signNewsletterToken } from "@/lib/newsletter-token";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://niravpandey.com";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Each IP can request 3 verification emails per hour.
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 h"),
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

type NewsletterState = { success: boolean; message: string } | null;

/** Emails a confirmation link; the subscriber is only saved once they click it. */
export async function requestVerification(_prevState: NewsletterState, formData: FormData): Promise<NewsletterState> {
  const email = formData.get("email")?.toString().trim().toLowerCase();
  if (!email || !EMAIL_PATTERN.test(email)) {
    return { success: false, message: "Please enter a valid email address." };
  }

  const requestHeaders = await headers();
  // x-forwarded-for can be a comma-separated chain; the first entry is the client.
  const ip =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip")?.trim() || "unknown";
  const { success: isAllowed, reset } = await ratelimit.limit(`newsletter:${ip}`);
  if (!isAllowed) {
    const minutes = Math.ceil((reset - Date.now()) / 60_000);
    return { success: false, message: `Too many attempts. Try again in ${minutes}m.` };
  }

  let verifyUrl: string;
  try {
    const token = signNewsletterToken(email, "subscribe", "24h");
    verifyUrl = `${SITE_URL}/api/newsletter/verify?token=${token}`;
  } catch (error) {
    console.error("Newsletter token error:", error);
    return { success: false, message: "Subscriptions are temporarily unavailable." };
  }

  try {
    await transporter.sendMail({
      from: `"Nirav Pandey" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Confirm your newsletter subscription",
      text: `Hi,\n\nPlease confirm your subscription by clicking this link:\n${verifyUrl}\n\nIf you didn't request this, you can ignore this email.`,
      html: `
        <div style="font-family: sans-serif; font-size: 14px; color: #111; line-height: 1.5;">
          <p>Hi there,</p>
          <p>Please confirm your subscription to my newsletter by clicking the link below:</p>
          <p><a href="${verifyUrl}">${verifyUrl}</a></p>
          <p style="color: #666; font-size: 12px; margin-top: 24px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Newsletter email error:", error);
    return { success: false, message: "Failed to send verification email. Try again later." };
  }

  return { success: true, message: "Check inbox/spam for verification." };
}
