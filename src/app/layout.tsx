import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TRPCProvider } from "@/trpc/client";
import { ModalProvider } from "@/modules/providers/ModalProvider";
import { ActiveChatContextProivder } from "@/modules/providers/ActiveChatProvider";
import { SessionProvider } from "@/modules/providers/SessionProvider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WhatsApp Clone",
  description: "A Basic Messenger Project",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TRPCProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Toaster />
            <SessionProvider>
              <ActiveChatContextProivder>
                <ModalProvider>{children}</ModalProvider>
              </ActiveChatContextProivder>
            </SessionProvider>
          </ThemeProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
