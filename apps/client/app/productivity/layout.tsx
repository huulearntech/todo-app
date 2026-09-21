import Header from "@/components/header";
import Footer from "@/components/footer";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Productivity",
  description: "Boost your productivity with our tools and resources.",
};

export default function ProductivityLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full min-h-screen flex-1 flex-col items-stretch justify-start">
      <Header />
      <main className="flex flex-1 w-full flex-col items-center bg-white dark:bg-black sm:items-center justify-center">
        {children}
      </main>
      <Footer />
    </div>
  );
}