"use server";

import { headers } from "next/headers";
import nodemailer from "nodemailer";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  formatClassPrice,
  getClassTypeByValue,
} from "./components/pteContent";

export type PteEnquiryState = {
  success: boolean;
  message: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AU_MOBILE_PATTERN = /^4\d{8}$/;
const OWNER_EMAIL = "nrvpandey2005@gmail.com";
const NOT_SURE_SCORE_GOAL = "not-sure-yet";
const MIN_TARGET_SCORE = 10;
const MAX_TARGET_SCORE = 90;
const MIN_PASSWORD_LENGTH = 8;

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(4, "1 h"),
});

const studentAuthConfirmPath = "/pte/auth/confirm";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

function getClassLabel(classType: string) {
  const classTypeMeta = getClassTypeByValue(classType);

  if (classTypeMeta) {
    return `${classTypeMeta.label} tutoring - ${formatClassPrice(classTypeMeta.price)} - ${classTypeMeta.description}`;
  }

  return classType;
}

function getAvailabilityLabel(value: string) {
  const timeSlotMatch = /^([a-z]+)-(\d{2}):(\d{2})$/.exec(value);

  if (timeSlotMatch) {
    const [, day, hourText, minuteText] = timeSlotMatch;
    const hour24 = Number(hourText);
    const hour12 = hour24 % 12 || 12;
    const suffix = hour24 < 12 ? "AM" : "PM";
    const dayLabel = day.charAt(0).toUpperCase() + day.slice(1);

    return `${dayLabel} ${hour12}:${minuteText} ${suffix}`;
  }

  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getValueListLabel(values: string[]) {
  return values.length ? values.map(getAvailabilityLabel).join(", ") : "Not provided";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isValidScoreGoal(scoreGoal: string) {
  if (scoreGoal === NOT_SURE_SCORE_GOAL) {
    return true;
  }

  if (!/^\d+$/.test(scoreGoal)) {
    return false;
  }

  const score = Number(scoreGoal);
  return score >= MIN_TARGET_SCORE && score <= MAX_TARGET_SCORE;
}

function getScoreGoalLabel(scoreGoal: string) {
  if (scoreGoal === NOT_SURE_SCORE_GOAL) {
    return "Not sure yet";
  }

  return scoreGoal ? `${scoreGoal}/90` : "Not provided";
}

async function getClientIp() {
  const headerList = await headers();
  return (
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "127.0.0.1"
  );
}

function shouldRateLimitEnquiries() {
  return process.env.NODE_ENV === "production" && process.env.DISABLE_PTE_RATE_LIMIT !== "true";
}

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function submitPteEnquiry(
  _prevState: PteEnquiryState | null,
  formData: FormData,
): Promise<PteEnquiryState> {
  const firstName = formData.get("firstName")?.toString().trim() ?? "";
  const lastName = formData.get("lastName")?.toString().trim() ?? "";
  const email = formData.get("email")?.toString().trim().toLowerCase() ?? "";
  const phoneLocal = formData.get("phone")?.toString().replace(/\D/g, "") ?? "";
  const phone = phoneLocal ? `+61${phoneLocal}` : "";
  const classType = formData.get("classType")?.toString().trim() ?? "";
  const classLabel = getClassLabel(classType);
  const availability = formData
    .getAll("availability")
    .map((value) => value.toString().trim())
    .filter(Boolean);
  const availabilityLabel = availability.length
    ? availability.map(getAvailabilityLabel).join(", ")
    : "Not provided";
  const focusAreas = formData
    .getAll("focusAreas")
    .map((value) => value.toString().trim())
    .filter(Boolean);
  const focusAreasLabel = getValueListLabel(focusAreas);
  const scoreGoal = formData.get("scoreGoal")?.toString().trim() ?? "";
  const scoreGoalLabel = getScoreGoalLabel(scoreGoal);
  const password = formData.get("password")?.toString() ?? "";
  const confirmPassword = formData.get("confirmPassword")?.toString() ?? "";

  if (!firstName || !lastName || !email || !classType) {
    return {
      success: false,
      message: "Please fill in the required fields.",
    };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return {
      success: false,
      message: "Please enter a valid email address.",
    };
  }

  if (phoneLocal && !AU_MOBILE_PATTERN.test(phoneLocal)) {
    return {
      success: false,
      message: "Please enter a 9 digit Australian mobile number starting with 4.",
    };
  }

  if (!isValidScoreGoal(scoreGoal)) {
    return {
      success: false,
      message: "Please enter a target score from 10 to 90, or select Not sure yet.",
    };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      success: false,
      message: "Please create a password with at least 8 characters.",
    };
  }

  if (password !== confirmPassword) {
    return {
      success: false,
      message: "Passwords do not match.",
    };
  }

  if (shouldRateLimitEnquiries()) {
    const ip = await getClientIp();
    const { success: isAllowed, reset } = await ratelimit.limit(`pte-enquiry:${ip}`);

    if (!isAllowed) {
      const minutes = Math.ceil((reset - Date.now()) / 1000 / 60);
      return {
        success: false,
        message: `Too many enquiries. Try again in ${minutes}m.`,
      };
    }
  }

  console.info("PTE enquiry", {
    firstName,
    lastName,
    email,
    phone,
    classType,
    focusAreas,
    scoreGoal,
    availability,
    submittedAt: new Date().toISOString(),
  });

  const safeFirstName = escapeHtml(firstName);
  const safeLastName = escapeHtml(lastName);
  const safeEmail = escapeHtml(email);
  const safePhone = escapeHtml(phone);
  const safeClassLabel = escapeHtml(classLabel);
  const safeAvailabilityLabel = escapeHtml(availabilityLabel);
  const safeFocusAreasLabel = escapeHtml(focusAreasLabel);
  const safeScoreGoalLabel = escapeHtml(scoreGoalLabel);

  try {
    const supabase = createAdminClient();
    const { error: insertError } = await supabase.from("pte_leads").insert({
      first_name: firstName,
      last_name: lastName,
      email,
      phone: phone || null,
      class_type: classType,
      class_label: classLabel,
      focus_areas: focusAreas,
      score_goal: scoreGoal || NOT_SURE_SCORE_GOAL,
      availability,
    });

    if (insertError) {
      console.error("PTE enquiry database error:", insertError);
      return {
        success: false,
        message: "Could not save your enquiry. Please try again later.",
      };
    }

    const { data: signupLinkData, error: signUpError } = await supabase.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role: "pte-student",
        },
      },
    });

    if (signUpError) {
      console.error("PTE account creation error:", signUpError);

      if (signUpError.message.toLowerCase().includes("already")) {
        return {
          success: true,
          message: "Your enquiry is saved. An account already exists for this email, so please sign in or reset your password.",
        };
      }

      return {
        success: false,
        message: "Your enquiry was saved, but I could not create your login. Please try signing up from the student login page.",
      };
    }

    const tokenHash = signupLinkData.properties?.hashed_token;

    if (!tokenHash) {
      return {
        success: false,
        message: "Your enquiry was saved, but I could not create your verification link. Please try signing up from the student login page.",
      };
    }

    const verificationLink = `${getSiteUrl()}${studentAuthConfirmPath}?token_hash=${encodeURIComponent(tokenHash)}&type=signup`;
    const safeVerificationLink = escapeHtml(verificationLink);

    await Promise.all([
      transporter.sendMail({
        from: `"Nirav Pandey" <${process.env.GMAIL_USER}>`,
        to: OWNER_EMAIL,
        replyTo: email,
        subject: `New PTE tutoring enquiry: ${classLabel}`,
        text: [
          "New PTE tutoring enquiry",
          "",
          `Name: ${firstName} ${lastName}`,
          `Email: ${email}`,
          `Phone: ${phone || "Not provided"}`,
          `Class type: ${classLabel}`,
          `Focus areas: ${focusAreasLabel}`,
          `Score goal: ${scoreGoalLabel}`,
          `Availability: ${availabilityLabel}`,
        ].join("\n"),
        html: `
          <div style="font-family: sans-serif; font-size: 14px; color: #111; line-height: 1.5;">
            <h1 style="font-size: 18px; margin: 0 0 12px;">New PTE tutoring enquiry</h1>
            <p><strong>Name:</strong> ${safeFirstName} ${safeLastName}</p>
            <p><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
            <p><strong>Phone:</strong> ${safePhone || "Not provided"}</p>
            <p><strong>Class type:</strong> ${safeClassLabel}</p>
            <p><strong>Focus areas:</strong> ${safeFocusAreasLabel}</p>
            <p><strong>Score goal:</strong> ${safeScoreGoalLabel}</p>
            <p><strong>Availability:</strong> ${safeAvailabilityLabel}</p>
          </div>
        `,
      }),
      transporter.sendMail({
        from: `"Nirav Pandey" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: "Verify your PTE student account",
        text: [
          `Hi ${firstName},`,
          "",
          "Thanks for your PTE tutoring enquiry. Please verify your student account using this secure link:",
          verificationLink,
          "",
          `Class type: ${classLabel}`,
          "",
          "Nirav",
        ].join("\n"),
        html: `
          <div style="font-family: sans-serif; font-size: 14px; color: #111; line-height: 1.5;">
            <p>Hi ${safeFirstName},</p>
            <p>Thanks for your PTE tutoring enquiry. Please verify your student account using this secure link:</p>
            <p><a href="${safeVerificationLink}">Verify student account</a></p>
            <p><strong>Class type:</strong> ${safeClassLabel}</p>
            <p>Nirav</p>
          </div>
        `,
      }),
    ]);
  } catch (err) {
    console.error("PTE enquiry email error:", err);
    return {
      success: false,
      message: "Could not send your enquiry. Please try again later.",
    };
  }

  return {
    success: true,
    message: "Your enquiry is saved. Check your email and click the verification link to activate your student dashboard.",
  };
}
