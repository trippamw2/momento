import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Momento — What do you feel like doing today?",
  description:
    "Discover unforgettable experiences curated for every feeling — romantic dates, laid-back chill spots, celebrations, and escapes across Malawi. Live The Moment.",
  openGraph: {
  title: "Momento — What do you feel like doing today?",
    description:
      "Discover unforgettable experiences curated for every feeling — romantic dates, laid-back chill spots, celebrations, and escapes across Malawi. Live The Moment.",
    siteName: "Momento",
    type: "website",
    images: [{ url: "/experio-logo.png", width: 1280, height: 683 }],
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
        <main className="flex-1 pt-16 pb-20">{children}</main>
        <MobileBottomNav />
        <Footer />
      </body>
    </html>
  );
}
