import Header from "@/components/header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Productivity",
  description: "Boost your productivity with your task completion insights.",
};

export default function ProductivityLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0 h-full max-h-full overflow-hidden bg-background text-foreground">
      <Header />
      <main className="flex-1 w-full overflow-y-auto min-h-0">
        <div className="mx-auto flex flex-col items-center justify-start w-full max-w-6xl p-4 sm:p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}