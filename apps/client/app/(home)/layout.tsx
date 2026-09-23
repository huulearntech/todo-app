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
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header />
      <main className="flex flex-1 w-full flex-col overflow-auto">
        {children}
      </main>
      <Footer />
    </div>
  );
}
