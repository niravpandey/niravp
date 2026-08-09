"use server";

import nodemailer from "nodemailer";

export type PteEnquiryState = {
  success: boolean;
  message: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+()\d\s-]{7,}$/;
const OWNER_EMAIL = "nrvpandey2005@gmail.com";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

function getClassLabel(classType: string) {
  if (classType === "one-on-one") {
    return "One-on-one tutoring - from A$35 a class";
  }

  if (classType === "group") {
    return "Group tutoring - up to 5 students, from A$25/hour";
  }

  return classType;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function submitPteEnquiry(
  _prevState: PteEnquiryState | null,
  formData: FormData,
): Promise<PteEnquiryState> {
  const firstName = formData.get("firstName")?.toString().trim() ?? "";
  const lastName = formData.get("lastName")?.toString().trim() ?? "";
  const email = formData.get("email")?.toString().trim().toLowerCase() ?? "";
  const phone = formData.get("phone")?.toString().trim() ?? "";
  const classType = formData.get("classType")?.toString().trim() ?? "";
  const classLabel = getClassLabel(classType);

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

  if (phone && !PHONE_PATTERN.test(phone)) {
    return {
      success: false,
      message: "Please enter a valid phone number.",
    };
  }

  console.info("PTE enquiry", {
    firstName,
    lastName,
    email,
    phone,
    classType,
    submittedAt: new Date().toISOString(),
  });

  const safeFirstName = escapeHtml(firstName);
  const safeLastName = escapeHtml(lastName);
  const safeEmail = escapeHtml(email);
  const safePhone = escapeHtml(phone);
  const safeClassLabel = escapeHtml(classLabel);

  try {
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
        ].join("\n"),
        html: `
          <div style="font-family: sans-serif; font-size: 14px; color: #111; line-height: 1.5;">
            <h1 style="font-size: 18px; margin: 0 0 12px;">New PTE tutoring enquiry</h1>
            <p><strong>Name:</strong> ${safeFirstName} ${safeLastName}</p>
            <p><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
            <p><strong>Phone:</strong> ${safePhone || "Not provided"}</p>
            <p><strong>Class type:</strong> ${safeClassLabel}</p>
          </div>
        `,
      }),
      transporter.sendMail({
        from: `"Nirav Pandey" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: "Thanks for your PTE tutoring enquiry",
        text: [
          `Hi ${firstName},`,
          "",
          "Thanks for your PTE tutoring enquiry. I have received your details and will get back to you soon.",
          "",
          `Class type: ${classLabel}`,
          "",
          "Nirav",
        ].join("\n"),
        html: `
          <div style="font-family: sans-serif; font-size: 14px; color: #111; line-height: 1.5;">
            <p>Hi ${safeFirstName},</p>
            <p>Thanks for your PTE tutoring enquiry. I have received your details and will get back to you soon.</p>
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
    message: "Thanks. I have emailed you and will get back to you soon.",
  };
}
