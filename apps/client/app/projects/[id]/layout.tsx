import Header from "@/components/header";
import Footer from "@/components/footer";

import type { Metadata, ResolvingMetadata } from 'next'
import { projectService } from "@/services/project.service";
 
export async function generateMetadata(params: Promise<{ id: string }>): Promise<Metadata> {
  const { id } = await params;
 
  // TODO: this is not supported yet, because it need the userId which
  // lives in user browser
  // const project = await projectService.getProjectById(id);
  // if (!project) {
  //   return {
  //     title: "Project Not Found",
  //     description: "The requested project could not be found.",
  //   }
  // }

  const project = {
    name: "TODO: read this file",
    description: "TODO: read this file",
  }
 
  return {
    title: project.name,
    description: project.description,
  }
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full w-full flex-1 flex-col items-stretch justify-start">
      <Header />
      <main className="flex flex-1 w-full flex-col items-center bg-white dark:bg-black sm:items-center justify-center">
        {children}
      </main>
      <Footer />
    </div>
  );
}