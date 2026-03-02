import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NetworkProvider } from "@/context/NetworkContext";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Avalanche L1 Console",
  description: "Enterprise Control Plane for Avalanche Subnets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} antialiased bg-background text-foreground`}>
        <AuthProvider>
          <NetworkProvider>
            {children}
          </NetworkProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

