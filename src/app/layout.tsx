import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Experio — Experiences worth living",
  description:
    "Discover unforgettable experiences curated for every mood. Romantic dinners, wellness retreats, adventures, and more — live the experience.",
  openGraph: {
    title: "Experio — Experiences worth living",
    description:
      "Discover unforgettable experiences curated for every mood. Romantic dinners, wellness retreats, adventures, and more — live the experience.",
    siteName: "Experio",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-[#faf8f6] text-[#222222] antialiased min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-18">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
