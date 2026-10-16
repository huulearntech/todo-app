import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileQuestionIcon, ArrowLeftIcon } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex-1 min-h-[60vh] flex items-center justify-center p-4 sm:p-6">
      <Card className="max-w-md w-full rounded-2xl border border-border/70 bg-card p-6 sm:p-8 text-center shadow-xs space-y-5">
        <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <FileQuestionIcon className="size-6" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Page Not Found
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The page or resource you are looking for does not exist or may have been moved.
          </p>
        </div>

        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-2 text-xs font-semibold"
            render={<Link href="/inbox" />}
            nativeButton={false}
          >
            <ArrowLeftIcon className="size-3.5" />
            <span>Go to Inbox</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
