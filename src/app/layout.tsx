import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ThemeProvider from "@/providers/theme-provider";
import { ClerkProvider } from "@clerk/nextjs";
import LayoutProvider from "@/providers/layout-provider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "GigFolio",
  description: "Gigfolio is a sleek and dynamic portfolio platform designed to showcase freelancers' skills, projects, and expertise to attract clients effortlessly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
    <html lang="en">
      <body>
        <ThemeProvider>
          <LayoutProvider>{children}</LayoutProvider>
        </ThemeProvider>
      </body>
    </html>
  </ClerkProvider>
  );
}
