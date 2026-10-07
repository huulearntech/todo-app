import { redirect } from "next/navigation";

// TODO: beware of this
export default async function AuthIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const redirectParam = typeof params.redirect === "string" ? params.redirect : undefined;
  const destination = redirectParam
    ? `/auth/sign-in?redirect=${encodeURIComponent(redirectParam)}`
    : "/auth/sign-in";
  redirect(destination);
}