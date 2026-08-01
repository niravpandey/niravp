"use server";

import { headers } from "next/headers";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Configure Rate Limiter: 3 requests per 1 hour window per IP
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 h"),
});

// Configure Gmail SMTP Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function requestVerification(prevState: any, formData: FormData) {
  const email = formData.get("email")?.toString().trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, message: "Please enter a valid email address." };
  }

  // 1. Enforce IP Rate Limiting
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for") ?? "127.0.0.1";
  const { success: isAllowed, reset } = await ratelimit.limit(`newsletter:${ip}`);

  if (!isAllowed) {
    const minutes = Math.ceil((reset - Date.now()) / 1000 / 60);
    return { success: false, message: `Too many attempts. Try again in ${minutes}m.` };
  }

  // 2. Encrypt the email into a signed JWT (Expires in 24 hours)
  const token = jwt.sign({ email }, process.env.JWT_SECRET!, {
    expiresIn: "24h",
  });

  // 3. Construct Verification Link
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://niravpandey.com";
  const verifyUrl = `${appUrl}/api/newsletter/verify?token=${token}`;

  // 4. Send Email via Gmail SMTP
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
  } catch (err) {
    console.error("Gmail SMTP error:", err);
    return { success: false, message: "Failed to send verification email. Try again later." };
  }

  return {
    success: true,
    message: "Check inbox/spam for verification.",
  };
}