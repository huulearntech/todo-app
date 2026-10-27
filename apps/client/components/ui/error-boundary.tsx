"use client";

import React, { Component, type ReactNode } from "react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircleIcon, RotateCcwIcon } from "lucide-react";

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((props: { error: Error; reset: () => void }) => ReactNode);
  onReset?: () => void;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    } else {
      console.error("Component error boundary caught exception:", error, errorInfo);
    }
  }

  reset = (): void => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (typeof this.props.fallback === "function") {
        return this.props.fallback({
          error: this.state.error,
          reset: this.reset,
        });
      }

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="p-4 sm:p-6 rounded-xl border border-destructive/20 bg-card text-center space-y-3 my-2">
          <div className="size-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <AlertCircleIcon className="size-4" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">
              Component Error
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {this.state.error.message || "An unexpected error occurred in this view."}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={this.reset}
            className="rounded-lg gap-1.5 text-xs mx-auto"
          >
            <RotateCcwIcon className="size-3" />
            <span>Try Again</span>
          </Button>
        </Card>
      );
    }

    return this.props.children;
  }
}

export interface WidgetErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
  className?: string;
}

/**
 * A specialized error boundary for isolated widgets (e.g. Kanban boards, charts, lists).
 * Automatically coordinates with TanStack Query's QueryErrorResetBoundary so resetting
 * the boundary also clears any cached query errors.
 */
export function WidgetErrorBoundary({
  children,
  fallbackTitle = "Unable to load content",
  fallbackMessage,
  onReset,
  className,
}: WidgetErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset: resetQuery }) => (
        <ErrorBoundary
          onReset={() => {
            resetQuery();
            onReset?.();
          }}
          fallback={({ error, reset }) => (
            <div
              className={
                className ??
                "flex flex-col items-center justify-center p-6 text-center h-full min-h-[200px] border border-dashed border-border/70 rounded-2xl bg-muted/20"
              }
            >
              <div className="size-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-3">
                <AlertCircleIcon className="size-5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">
                {fallbackTitle}
              </h3>
              <p className="text-xs text-muted-foreground mb-4 max-w-xs">
                {fallbackMessage ?? error.message ?? "An unexpected error occurred."}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={reset}
                className="rounded-lg gap-1.5 text-xs font-medium cursor-pointer"
              >
                <RotateCcwIcon className="size-3.5" />
                <span>Retry</span>
              </Button>
            </div>
          )}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
