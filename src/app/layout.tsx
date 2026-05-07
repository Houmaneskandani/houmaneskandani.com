import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter_Tight } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { CustomCursor } from "@/components/cursor/CustomCursor";
import { PageTransition } from "@/components/transitions/PageTransition";
import { Preloader } from "@/components/transitions/Preloader";
import { SITE } from "@/lib/data";
import "./globals.css";

// schema.org JSON-LD. Person is the primary entity; WebSite gives Google
// the canonical name + URL for sitelinks-style search treatment.
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: SITE.name,
  alternateName: SITE.shortName,
  url: SITE.url,
  jobTitle: SITE.role,
  description:
    "Backend Software Engineer with 5+ years building high-security, multi-tenant APIs in Go, Java, and Python. Currently at The Vport on the VCloud GraphQL platform; previously at IDEMIA on a card-personalization platform serving tier-1 U.S. banks.",
  email: `mailto:${SITE.email}`,
  image: `${SITE.url}/portrait.jpg`,
  sameAs: [SITE.social.github, SITE.social.linkedin],
  knowsAbout: [
    "Backend Development",
    "API Design",
    "GraphQL",
    "REST",
    "gRPC",
    "Go",
    "Python",
    "Java",
    "TypeScript",
    "PostgreSQL",
    "Kubernetes",
    "Google Cloud Platform",
    "Amazon Web Services",
    "OAuth 2.0",
    "JWT",
    "PCI-DSS",
    "Distributed Systems",
    "Cloud Platform Engineering",
  ],
  address: {
    "@type": "PostalAddress",
    addressLocality: "Irvine",
    addressRegion: "CA",
    addressCountry: "US",
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE.name,
  alternateName: `${SITE.name} — Portfolio`,
  url: SITE.url,
  inLanguage: "en-US",
  author: { "@type": "Person", name: SITE.name, url: SITE.url },
};

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
  // Set NEXT_PUBLIC_GOOGLE_VERIFICATION on Vercel once Search Console issues
  // a token. Until then this stays unset and the meta tag is omitted.
  verification: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION }
    : undefined,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-bg text-fg overflow-x-clip">
        <SmoothScroll>
          <PageTransition>{children}</PageTransition>
          <div aria-hidden className="grain" />
        </SmoothScroll>
        <Preloader />
        <CustomCursor />
        <Analytics />
      </body>
    </html>
  );
}
