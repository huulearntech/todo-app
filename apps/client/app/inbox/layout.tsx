import Header from "@/components/header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inbox",
  description: "Inbox page for the application", // TODO: 
}


export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Header />
      {children}
    </div>
  );
}