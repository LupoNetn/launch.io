import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "launch.io — Deploy anything, instantly.",
  description:
    "launch.io is the fastest way to deploy your apps. Push code, we handle the rest. Powered by railpack builds, instant previews, and zero-config deployments.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${jetbrainsMono.variable} font-sans h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#080810] text-white">
        {children}
      </body>
    </html>
  );
}
