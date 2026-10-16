"use client";

import { useCheckEmailNotice } from "@/features/auth/hooks/use-check-email-notice";
import { EmailVerifiedNotice } from "./email-verified-notice";
import { WaitingVerificationNotice } from "./waiting-verification-notice";

interface CheckEmailNoticeProps {
  email: string;
  userId: string;
  credentials?: { email: string; password: string };
  onReset?: () => void;
}

export default function CheckEmailNotice({
  email,
  userId,
  credentials,
  onReset,
}: CheckEmailNoticeProps) {
  const { isVerified, cooldown, isResending, handleResend } = useCheckEmailNotice({
    email,
    userId,
    credentials,
  });

  if (isVerified) {
    return <EmailVerifiedNotice />;
  }

  return (
    <WaitingVerificationNotice
      email={email}
      cooldown={cooldown}
      isResending={isResending}
      onResend={handleResend}
      onReset={onReset}
    />
  );
}
