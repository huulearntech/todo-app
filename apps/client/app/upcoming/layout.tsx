import Header from "@/components/header";

export default function UpcomingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full w-full flex-1 flex-col items-stretch justify-start">
      <Header />
      <main className="flex flex-1 w-full flex-col items-center bg-white dark:bg-black sm:items-center justify-center p-4">
        {children}
      </main>
    </div>
  );
}