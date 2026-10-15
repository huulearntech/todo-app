"use client";

import React, {
  useRef,
  useMemo,
  forwardRef,
  useImperativeHandle,
  type UIEvent,
} from "react";
import { Input } from "@/components/ui/input";
import {
  tokenizeQuickTaskForHighlight,
  type HighlightToken,
} from "@/features/tasks/utils/quick-task-parser";
import { cn } from "@/lib/utils";

export interface HighlightedTaskInputProps
  extends React.ComponentProps<typeof Input> {
  projects?: Array<{ id: string; name: string; colorKey?: string }>;
  sections?: Array<{ id: string; name: string; projectId: string }>;
  labels?: Array<{ id: string; name: string; colorKey?: string }>;
}

export const HighlightedTaskInput = forwardRef<
  HTMLInputElement,
  HighlightedTaskInputProps
>(function HighlightedTaskInput(
  {
    value = "",
    projects,
    sections,
    labels,
    className,
    onScroll,
    ...props
  },
  ref
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Expose internal inputRef to external forwardRef
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  const rawString = typeof value === "string" ? value : String(value ?? "");

  // Memoize tokenization for the current text string
  const tokens = useMemo<HighlightToken[]>(() => {
    return tokenizeQuickTaskForHighlight(rawString, {
      projects,
      sections,
      labels,
    });
  }, [rawString, projects, sections, labels]);

  // Keep backdrop horizontal scroll synchronized with input
  const handleScroll = (e: UIEvent<HTMLInputElement>) => {
    if (backdropRef.current) {
      backdropRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
    onScroll?.(e);
  };

  const hasContent = rawString.length > 0;

  return (
    <div className="relative flex-1 flex items-center min-w-0 w-full overflow-hidden">
      {/* 1. Mirrored Backdrop Highlighting Layer (Strict 1:1 Character Metrics) */}
      <div
        ref={backdropRef}
        aria-hidden="true"
        className={cn(
          "pointer-events-none select-none absolute inset-0 flex items-center overflow-x-hidden whitespace-pre px-1 text-sm sm:text-base font-medium font-sans tracking-normal leading-normal",
          !hasContent && "opacity-0"
        )}
      >
        {tokens.map((token, index) => {
          if (token.type === "text") {
            return (
              <span key={index} className="text-foreground">
                {token.text}
              </span>
            );
          }

          return (
            <span
              key={index}
              className={cn(
                "rounded-[3px] font-medium transition-colors",
                token.className
              )}
            >
              {token.text}
            </span>
          );
        })}
      </div>

      {/* 2. Interactive Foreground Input */}
      <Input
        ref={inputRef}
        value={value}
        onScroll={handleScroll}
        className={cn(
          "h-10 w-full border-0 bg-transparent px-1 text-sm sm:text-base font-medium font-sans tracking-normal leading-normal shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60 transition-colors",
          hasContent
            ? "text-transparent caret-foreground selection:bg-primary/25 selection:text-transparent"
            : "text-foreground",
          className
        )}
        {...props}
      />
    </div>
  );
});
