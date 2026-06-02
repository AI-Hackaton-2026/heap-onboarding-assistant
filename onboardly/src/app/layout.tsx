import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

// Root layout for the whole Onboardly app (wraps both public and authenticated routes).
export const metadata: Metadata = {
  title: "Onboardly",
  description:
    "AI onboarding assistant grounded in your company's GitHub, Slack, and docs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("font-sans", geist.variable)}
    >
      <body className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
