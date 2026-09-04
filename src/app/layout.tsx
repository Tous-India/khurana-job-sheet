import type { Metadata, Viewport } from "next";
import { Noto_Sans, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
});

// Engineers type Hindi into remarks and faulty-material rows, so the UI font
// stack must cover Devanagari. The PDF has a separate registration (README 6.1).
const notoSansDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-devanagari",
  subsets: ["devanagari"],
});

export const metadata: Metadata = {
  title: "Khurana Electronics — Job Sheet",
  description:
    "Digital job sheet for Khurana Electronics field engineers, Sonipat.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KE Job Sheet",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

// Field engineers use this one-handed on a phone, outdoors.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1e40af",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${notoSans.variable} ${notoSansDevanagari.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
