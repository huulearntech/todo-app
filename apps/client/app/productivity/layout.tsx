import Header from "@/components/header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Productivity",
  description: "Boost your productivity with your task completion insights.",
};

export default function ProductivityLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full min-h-screen flex-1 flex-col items-stretch justify-start bg-background text-foreground">
      <Header />
      <main className="flex-1 w-full flex flex-col items-center justify-start p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
        {children}
      </main>
    </div>
  );
}