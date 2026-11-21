import type { Metadata } from "next";
// KaTeX first so globals.css can override its sizing.
import "katex/dist/katex.min.css";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Splash from "@/components/layout/Splash";

export const metadata: Metadata = {
  title: "Nirav Pandey",
  description: "Personal site",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-palette="y2k" className="scroll-smooth">
      <body className="min-h-screen bg-paper font-sans text-gray-900 antialiased">
        <Splash />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
