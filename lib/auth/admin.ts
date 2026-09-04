export function isAdminEmail(email?: string | null) {
  const adminEmails = (process.env.ADMIN_EMAILS || "nrvpandey2005@gmail.com")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return Boolean(email && adminEmails.includes(email.toLowerCase()));
}
