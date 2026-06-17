import Script from "next/script";
import "./globals.css";

export const metadata = {
  title: "MyStickyNote | Premium AI-Powered Desktop Sticky Note Companion",
  description: "Ditch the browser tabs! MyStickyNote is an elegant, glassmorphic desktop companion for macOS and Windows. Connects with DeepSeek R1, Google Gemini, and ChatGPT, featuring timers, alarms, stopwatches, auto-dim, and always-on-top modes.",
  keywords: [
    "mystickynote",
    "my sticky note",
    "sticky note app",
    "desktop sticky notes",
    "always on top sticky note",
    "AI sticky note",
    "DeepSeek sticky notes",
    "mac sticky note",
    "windows sticky notes",
    "glassmorphic sticky notes",
    "productivity widgets",
    "developer sticky notes"
  ],
  alternates: {
    canonical: "https://mystickynote.app"
  },
  openGraph: {
    title: "MyStickyNote | Premium AI-Powered Desktop Sticky Note Companion",
    description: "An elegant, glassmorphic desktop utility for macOS and Windows with AI deep reasoning, always-on-top, focus timers, and alarms.",
    url: "https://mystickynote.app",
    siteName: "MyStickyNote",
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "MyStickyNote | Desktop Sticky Notes with DeepSeek AI",
    description: "Connect your AI key for DeepSeek, Gemini, or ChatGPT, and pin notes above your screen with auto-dimming.",
    creator: "@mystickynote"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    }
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "MyStickyNote",
    "operatingSystem": "macOS 11.0 Big Sur or later, Windows 10, Windows 11",
    "applicationCategory": "ProductivityApplication",
    "offers": {
      "@type": "Offer",
      "price": "0.00",
      "priceCurrency": "USD"
    },
    "description": "An elegant, glassmorphic desktop sticky note application featuring AI integration (DeepSeek, Gemini, OpenAI), focus timers, alarms, and auto-dim features.",
    "downloadUrl": "https://mystickynote.app/#download",
    "softwareVersion": "1.0.0"
  };

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
