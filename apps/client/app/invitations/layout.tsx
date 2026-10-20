import Header from "@/components/layout/header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Project Invitation",
  description: "Join and collaborate with your team on Todo.",
};

export default function InvitationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-col flex-1 min-h-0 min-w-0 h-full max-h-full overflow-hidden bg-background text-foreground">
      <Header showAuthAction={true} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none -z-10" />
      
      <main className="flex-1 w-full overflow-y-auto min-h-0 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-md my-auto py-6 px-2 sm:px-4">
          {children}
        </div>
      </main>
    </div>
  );
}
