import type { Metadata } from "next";
import "./globals.css";
import { Plus_Jakarta_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
});

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
      className={cn("font-sans", plusJakartaSans.variable)}
    >
      {/* The anti-flash theme script is injected by ThemeProvider via
          useServerInsertedHTML — see src/components/theme/ThemeProvider.tsx. */}
      <body className="bg-background text-foreground antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
