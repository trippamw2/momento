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
  title: "Momento — Live The Moment",
  description:
    "Discover, book, gift and enjoy unforgettable real-life experiences curated for every mood and occasion.",
  openGraph: {
    title: "Momento — Live The Moment",
    description:
      "Discover, book, gift and enjoy unforgettable real-life experiences curated for every mood and occasion.",
    siteName: "Momento",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-surface-primary text-text-primary antialiased min-h-screen flex flex-col">
        <div className="gradient-ambient fixed inset-0 pointer-events-none" />
        <Navbar />
        <main className="flex-1 relative z-base">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
