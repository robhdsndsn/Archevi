import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header, Footer } from "@/components/layout";
import { AnnouncementBanner } from "@/components/cms";
import { GoogleAnalytics } from "@/components/analytics";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Archevi - Your family's AI-powered knowledge vault",
    template: "%s | Archevi",
  },
  description:
    "Store, search, and understand your important documents with natural language. Ask questions and get answers with source citations.",
  keywords: [
    "family documents",
    "AI search",
    "document management",
    "knowledge base",
    "RAG",
    "semantic search",
  ],
  authors: [{ name: "Archevi" }],
  creator: "Archevi",
  openGraph: {
    type: "website",
    locale: "en_CA",
    url: "https://archevi.ca",
    siteName: "Archevi",
    title: "Archevi - Your family's AI-powered knowledge vault",
    description:
      "Store, search, and understand your important documents with natural language.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Archevi - Your family's AI-powered knowledge vault",
    description:
      "Store, search, and understand your important documents with natural language.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GoogleAnalytics />
        <AnnouncementBanner location="Everywhere" />
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
