import "../globals.css";
import type { Metadata } from "next";
import Header from "@/components/header";
import Footer from "@/components/footer";


export const metadata: Metadata = {
  title: "Todo App",
  description: "A simple todo app built with Next.js and NestJS.",
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full w-full flex-1 flex-col items-stretch justify-start">
      <Header />
      <main className="flex flex-1 w-full flex-col items-center justify-center">
        {children}
      </main>
      <Footer />
    </div>
  );
}
