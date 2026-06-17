import Script from "next/script";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://mystickynote.app"),
  title: {
    default: "MyStickyNote — Free AI Desktop Sticky Notes for Mac & Windows",
    template: "%s | MyStickyNote",
  },
  description:
    "MyStickyNote is a free, open-source desktop sticky note app for macOS and Windows with AI integration (DeepSeek R1, Google Gemini, ChatGPT), always-on-top mode, auto-dim, focus timers, alarms, and stopwatch. No subscription, no cloud — 100% local.",
  keywords: [
    "sticky note app",
    "desktop sticky notes",
    "sticky notes for mac",
    "sticky notes for windows",
    "always on top sticky note",
    "AI sticky note app",
    "free sticky note app",
    "open source sticky notes",
    "DeepSeek sticky notes",
    "Gemini sticky notes",
    "ChatGPT sticky notes",
    "AI note taking app",
    "desktop productivity app",
    "glassmorphic sticky notes",
    "floating notes app",
    "pin notes on screen",
    "always on top notes mac",
    "sticky notes alternative",
    "mac stickies replacement",
    "windows sticky notes alternative",
    "focus timer app",
    "developer sticky notes",
    "productivity widgets desktop",
    "note taking app with AI",
    "lightweight note app",
    "mystickynote",
    "my sticky note",
  ],
  alternates: {
    canonical: "https://mystickynote.app",
  },
  openGraph: {
    title: "MyStickyNote — Free AI Desktop Sticky Notes for Mac & Windows",
    description:
      "Pin AI-powered sticky notes on your screen. Always-on-top, auto-dim, focus timers, and DeepSeek/Gemini/ChatGPT integration. Free & open source.",
    url: "https://mystickynote.app",
    siteName: "MyStickyNote",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MyStickyNote — AI Desktop Sticky Notes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MyStickyNote — Free AI Desktop Sticky Notes",
    description:
      "Pin AI-powered sticky notes on your screen. Always-on-top, auto-dim, timers. Free, open source, no subscription.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large" as const,
      "max-snippet": -1,
    },
  },
  category: "Productivity",
  creator: "Piyush Thakur",
  publisher: "MyStickyNote",
  applicationName: "MyStickyNote",
  other: {
    "apple-mobile-web-app-title": "MyStickyNote",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // SoftwareApplication Schema
  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "MyStickyNote",
    operatingSystem: "macOS 11.0+, Windows 10, Windows 11",
    applicationCategory: "ProductivityApplication",
    applicationSubCategory: "Note Taking",
    offers: {
      "@type": "Offer",
      price: "0.00",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    description:
      "A free, open-source desktop sticky note app with AI integration (DeepSeek R1, Google Gemini, ChatGPT), always-on-top mode, auto-dim, focus timers, alarms, and stopwatch.",
    downloadUrl: "https://mystickynote.app/#download",
    softwareVersion: "1.0.0",
    author: {
      "@type": "Person",
      name: "Piyush Thakur",
      url: "https://www.linkedin.com/in/piyush-thakur10z/",
    },
    url: "https://mystickynote.app",
    image: "https://mystickynote.app/icon.png",
    screenshot: "https://mystickynote.app/og-image.png",
    featureList:
      "AI Integration, Always-on-Top, Auto-Dim, Focus Timer, Alarm, Stopwatch, Multiple Themes, Trash Recovery, Keyboard Shortcuts",
    isAccessibleForFree: true,
    license: "https://opensource.org/licenses/ISC",
  };

  // FAQPage Schema for rich snippets
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: 'How does the "Always on Top" mode work?',
        acceptedAnswer: {
          "@type": "Answer",
          text: "When toggled, MyStickyNote pins itself above all active applications. On macOS, this includes full-screen spaces, IDEs, and virtual desktops. The Dock auto-hides momentarily to keep your coding environment distraction-free.",
        },
      },
      {
        "@type": "Question",
        name: "Are my notes or API keys saved on any servers?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Absolutely not. MyStickyNote is built with privacy in mind. All your note drafts, configs, and custom API keys for Google Gemini, OpenAI, or DeepSeek are stored locally on your machine.",
        },
      },
      {
        "@type": "Question",
        name: "Is it possible to recover a note I deleted by mistake?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Every note text block you delete is stored in the local History Recycle Bin. Simply click the History tab on the bottom navigation bar to preview and restore it.",
        },
      },
      {
        "@type": "Question",
        name: "How do I get my own API key for DeepSeek or Gemini?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You can easily register for API keys at DeepSeek's Developer Platform or Google's AI Studio. They offer free tier requests that are perfect for personal note expansion, summarizing, and brainstorming.",
        },
      },
      {
        "@type": "Question",
        name: "Is MyStickyNote free?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, MyStickyNote is completely free and open source. There are no subscriptions, no hidden fees, and no premium tiers. The source code is available on GitHub.",
        },
      },
    ],
  };

  // WebSite Schema for sitelinks search box
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "MyStickyNote",
    url: "https://mystickynote.app",
    description:
      "Free, open-source AI-powered desktop sticky notes for macOS and Windows.",
  };

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon.png" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <meta name="theme-color" content="#f59e0b" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(softwareJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd),
          }}
        />
      </head>
      <body>
        {children}

        {/* Google Analytics (GA4) Integration */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}

