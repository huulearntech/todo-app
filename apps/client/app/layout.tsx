import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
import AuthProvider from "@/providers/AuthProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toast";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar/app-sidebar";
import Script from "next/script";

import { MyStoreProvider } from "@/providers/MyStoreProvider";
import EditTaskDialog from "@/app/inbox/edit-task-dialog";
import AddTaskForm from "@/components/(home)/add-task-form";
import { EditProjectProvider } from "@/providers/EditProjectProvider";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
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
          <AuthProvider>
            <MyStoreProvider>
              <EditProjectProvider>
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
                    <AppSidebar />
                    {children}
                    <Toaster />
                    <EditTaskDialog />
                    <AddTaskForm />

                  </SidebarProvider>
                </TooltipProvider>
              </EditProjectProvider>
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
