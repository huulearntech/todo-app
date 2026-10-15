"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/header";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { InboxIcon } from "lucide-react";

export default function InboxHeader() {
  const pathname = usePathname();
  const isCompletedPage = pathname === "/inbox/completed";

  return (
    <Header
      left={
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              {isCompletedPage ? (
                <BreadcrumbLink
                  render={<Link href="/inbox" />}
                  className="flex items-center gap-1.5 font-semibold text-foreground text-xs sm:text-sm"
                >
                  <InboxIcon className="size-3.5 text-primary" />
                  <span>Inbox</span>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="flex items-center gap-1.5 font-semibold text-foreground text-xs sm:text-sm">
                  <InboxIcon className="size-3.5 text-primary" />
                  <span>Inbox</span>
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>

            {isCompletedPage && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-semibold text-foreground text-xs sm:text-sm">
                    Completed
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      }
    />
  );
}
