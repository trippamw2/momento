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
    title: "Experio — Curated Experiences in Malawi",
  description:
    "Discover unforgettable experiences curated for every mood across Malawi. Romantic dinners, wellness retreats, adventures, and more — live the moment.",
  openGraph: {
  title: "Experio — Curated Experiences in Malawi",
    description:
      "Discover unforgettable experiences curated for every mood across Malawi. Romantic dinners, wellness retreats, adventures, and more — live the moment.",
    siteName: "Experio",
    type: "website",
    images: [{ url: "/experio-logo.png", width: 512, height: 512 }],
  },
  icons: {
    icon: "/experio-logo.png",
    apple: "/experio-logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-[#05070B] text-white antialiased min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-18">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
