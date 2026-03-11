import type { Metadata } from "next";
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Lorde — Local Rental Exchange",
    template: "%s | Lorde",
  },
  description:
    "Lorde connects renters and landlords directly through verified listings and simple communication. No middlemen. Real neighborhoods.",
  keywords: ["rental", "Cincinnati rentals", "apartments", "landlord", "rent directly"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          inter.variable,
          playfair.variable,
          jetbrainsMono.variable,
          "font-sans min-h-screen bg-background text-foreground"
        )}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
