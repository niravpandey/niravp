import type { Metadata } from "next";
import { VT323 } from "next/font/google";
import "./globals.css";
import "phosphor-icons/src/css/icons.css";
import "katex/dist/katex.min.css";
import Navbar from "@/components/layout/Navbar";
import Splash from "@/components/layout/Splash";

// Retro terminal font for the CRT-style student map.
const crt = VT323({
  variable: "--font-vt323",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nirav Pandey",
  description: "Personal site",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-palette="y2k" className={`${crt.variable} scroll-smooth`}>
      <body className="min-h-screen bg-paper font-sans text-gray-900 antialiased">
        <Splash />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
