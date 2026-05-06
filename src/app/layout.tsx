import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter_Tight } from "next/font/google";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { CustomCursor } from "@/components/cursor/CustomCursor";
import { PageTransition } from "@/components/transitions/PageTransition";
import "./globals.css";

const sans = Geist({
  variable: "--font-sans-geist",
  subsets: ["latin"],
  display: "swap",
});

const mono = Geist_Mono({
  variable: "--font-mono-geist",
  subsets: ["latin"],
  display: "swap",
});

const display = Inter_Tight({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Houman Eskandani — Backend & Cloud Platform Engineer",
  description:
    "Backend Software Engineer with 5+ years building high-security, multi-tenant APIs in Go, Java, and Python. Cards at IDEMIA, GraphQL platforms at The Vport, AI agents on the side.",
  metadataBase: new URL("https://houmaneskandani.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Houman Eskandani — Backend & Cloud Platform Engineer",
    description:
      "Backend, APIs, and cloud platform — Go, GraphQL, Postgres, Kubernetes. Past work at IDEMIA and The Vport.",
    type: "website",
    siteName: "Houman Eskandani",
    url: "https://houmaneskandani.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Houman Eskandani — Backend & Cloud Platform Engineer",
    description:
      "Personal portfolio of Houman Eskandani — backend, APIs, and cloud platform engineering.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#07070a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} ${display.variable}`}
    >
      <body className="min-h-screen bg-bg text-fg overflow-x-clip">
        <SmoothScroll>
          <PageTransition>{children}</PageTransition>
          <div aria-hidden className="grain" />
        </SmoothScroll>
        <CustomCursor />
      </body>
    </html>
  );
}
