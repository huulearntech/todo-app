import { getOptionalUser } from "@/lib/server/auth";
import AuthenticatedHome from "@/components/(home)/authenticated-home";
import LandingHome from "@/components/(home)/landing-home";

export default async function Home() {
  const user = await getOptionalUser();

  if (!user) {
    return <LandingHome />;
  }

  return <AuthenticatedHome />;
}