import type { Metadata } from "next";
import { DM_Sans, Geist_Mono, Caveat, EB_Garamond, VT323 } from "next/font/google";
import "./globals.css";
import "phosphor-icons/src/css/icons.css";
import "katex/dist/katex.min.css";
import Navbar from "@/components/layout/Navbar";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

// Serif for headings.
const headingSerif = EB_Garamond({
  variable: "--font-heading-serif",
  subsets: ["latin"],
  display: "swap",
});

// Retro terminal font for the CRT-style student map.
const crt = VT323({
  variable: "--font-vt323",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: "500",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nirav Pandey",
  description: "Personal site",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${headingSerif.variable} ${geistMono.variable} ${crt.variable} ${caveat.variable} scroll-smooth`}>
      <body className="min-h-screen bg-white font-sans text-gray-900 antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
