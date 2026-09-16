import Header from "./temp-header";
import Footer from "@/components/footer";
import type { Metadata } from "next";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
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

export const metadata: Metadata = {
  title: "Labels",
  description: "Manage your task labels.",
};