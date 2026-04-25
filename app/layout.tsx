import type { Metadata } from "next";
import { Source_Sans_3, JetBrains_Mono, Caveat } from "next/font/google";
import "./globals.css";
import "phosphor-icons/src/css/icons.css";
import "katex/dist/katex.min.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";


const sourceSans = Source_Sans_3({ 
  variable: "--font-source-sans", 
  subsets: ["latin"],
  display: 'swap', 
});

const jetBrainsMono = JetBrains_Mono({ 
  variable: "--font-jetbrains-mono", 
  subsets: ["latin"],
  display: 'swap',
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
    <html lang="en" className={`${sourceSans.variable} ${jetBrainsMono.variable} ${caveat.variable} scroll-smooth`}>
      <body className="min-h-screen font-sans antialiased bg-white text-gray-900">
        <Navbar />
        {children}
        <Footer/>
      </body>
    </html>
  );
}