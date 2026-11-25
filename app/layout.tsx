import type { Metadata } from "next";
// KaTeX first so globals.css can override its sizing.
import "katex/dist/katex.min.css";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Splash, { splashSeenScript } from "@/components/layout/Splash";

/**
 * Public pages are prerendered and served from cache, refreshed at most hourly in the background.
 * Admin saves revalidate immediately (revalidatePath in the admin actions). Admin pages read cookies,
 * so they still render per request.
 */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Nirav Pandey",
  description: "Personal site",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the splash script may add data-splash-seen to <html> before React hydrates.
    <html lang="en" data-palette="y2k" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: splashSeenScript }} />
      </head>
      <body className="min-h-screen bg-paper font-sans text-gray-900 antialiased">
        <Splash />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
