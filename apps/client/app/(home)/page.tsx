import { getOptionalUser } from "@/lib/server/auth";
import AuthenticatedHome from "@/features/home/components/authenticated-home";
import LandingHome from "@/features/home/components/landing-home";

export default async function Home() {
  const user = await getOptionalUser();

  if (!user) {
    return <LandingHome />;
  }

  return <AuthenticatedHome />;
}