import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-ui",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MACHINE MIND — Intelligent Chat Interface",
  description:
    "A precision rule engine and AI relay. Full-stack intelligent chat interface with 12 built-in tools, NLP pipeline, and optional Claude integration.",
  keywords: [
    "MACHINE MIND",
    "AI chat",
    "rule engine",
    "tools",
    "NLP",
    "Next.js",
  ],
  authors: [{ name: "MACHINE MIND" }],
  icons: {
    icon: "/favicon.svg",
  },
};

/**
 * Inline script to set data-theme attribute before first paint.
 * Reads preference from localStorage (mm-theme) and resolves system default.
 * Prevents flash of wrong/unstyled theme (FOUC).
 */
const themeInitScript = `
(function(){
  try {
    var pref = localStorage.getItem('mm-theme') || 'system';
    var resolved = pref;
    if (pref === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', resolved);
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${inter.variable} ${jetbrains.variable} antialiased`}
        style={{
          fontFamily: "var(--font-ui), system-ui, sans-serif",
          backgroundColor: "var(--mm-bg-primary)",
          color: "var(--mm-text-primary)",
        }}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
