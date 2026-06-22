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
      <body className="bg-[#05070B] text-white antialiased min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 relative z-base pt-18">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
