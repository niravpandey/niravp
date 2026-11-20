/** The public site address, without a trailing slash. Set NEXT_PUBLIC_APP_URL to override. */
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://niravpandey.com").replace(/\/+$/, "");
