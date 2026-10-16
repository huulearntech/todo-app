import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
import AuthProvider from "@/providers/AuthProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toast";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar/app-sidebar";
import Script from "next/script";

import { MyStoreProvider } from "@/providers/MyStoreProvider";
import { ModalProvider } from "@/features/modals/components/modal-provider";
import { ThemeProvider } from "@/providers/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | Todo App",
    default: "Todo App",
  },
  description: "Personal task management and productivity application.",
};

import { getOptionalUser } from "@/lib/server/auth";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const initialUser = await getOptionalUser();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full overflow-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider initialUser={initialUser}>
              <MyStoreProvider>
                <TooltipProvider>
                  <SidebarProvider
                    defaultOpen={false}
                    className="h-svh max-h-svh overflow-hidden"
                    style={
                      {
                        "--sidebar-width": "350px",
                      } as React.CSSProperties
                    }
                  >
                    {initialUser && <AppSidebar />}
                    {children}
                    <Toaster />
                    {initialUser && <ModalProvider />}
                  </SidebarProvider>
                </TooltipProvider>
              </MyStoreProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === "development" && (
          <Script
            src="https://unpkg.com/react-scan/dist/auto.global.js"
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
