import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "SmartDoc | Free Online PDF, Word, Excel & PPT Tools",
  description:
    "Scan, compress, merge, convert, and edit PDF, Word, Excel, PPT, and Images effortlessly in one unified workspace. 100% free and private.",
  applicationName: "SmartDoc",
  verification: {
    google: "8rzF7pEuMrgBtUcZ5Z_TVEH132OQd2otILImNVs3iZA",
  },
  openGraph: {
    title: "SmartDoc — Complete Online Document Studio",
    description:
      "Convert, merge, compress, scan, and edit PDF, Word, Excel & PPT files online for free.",
    siteName: "SmartDoc",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "SmartDoc",
    alternateName: "SmartDoc VIP Studio",
    url: "https://smartdoc-vip-studio.vercel.app/",
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}