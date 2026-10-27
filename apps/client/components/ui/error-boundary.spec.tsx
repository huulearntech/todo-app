import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { ErrorBoundary } from "./error-boundary";

describe("ErrorBoundary", () => {
  it("renders children when no error occurs", () => {
    const html = renderToString(
      <ErrorBoundary>
        <div id="content">Normal Content</div>
      </ErrorBoundary>,
    );

    expect(html).toContain("Normal Content");
  });

  it("updates state correctly on getDerivedStateFromError", () => {
    const error = new Error("Simulated render crash");
    const nextState = ErrorBoundary.getDerivedStateFromError(error);

    expect(nextState).toEqual({
      hasError: true,
      error,
    });
  });

  it("calls onError when componentDidCatch is invoked", () => {
    const onError = vi.fn();
    const boundary = new ErrorBoundary({
      children: <div>child</div>,
      onError,
    });

    const error = new Error("Test error");
    const errorInfo = { componentStack: "at ChildComponent" };

    boundary.componentDidCatch(error, errorInfo as React.ErrorInfo);

    expect(onError).toHaveBeenCalledWith(error, errorInfo);
  });

  it("calls onReset and resets state when reset() is triggered", () => {
    const onReset = vi.fn();
    const boundary = new ErrorBoundary({
      children: <div>child</div>,
      onReset,
    });

    const setStateSpy = vi.fn((updater) => {
      boundary.state = typeof updater === "function" ? updater(boundary.state) : updater;
    });
    boundary.setState = setStateSpy as unknown as typeof boundary.setState;

    boundary.state = {
      hasError: true,
      error: new Error("Test failure"),
    };

    boundary.reset();

    expect(onReset).toHaveBeenCalledTimes(1);
    expect(setStateSpy).toHaveBeenCalledWith({
      hasError: false,
      error: null,
    });
    expect(boundary.state).toEqual({
      hasError: false,
      error: null,
    });
  });

  it("renders custom fallback function when in error state", () => {
    const boundary = new ErrorBoundary({
      children: <div>child</div>,
      fallback: ({ error, reset }) => (
        <div id="custom-fallback">
          <span>{error.message}</span>
          <button onClick={reset}>Retry</button>
        </div>
      ),
    });

    boundary.state = {
      hasError: true,
      error: new Error("Custom crash message"),
    };

    const rendered = boundary.render();
    const html = renderToString(rendered as React.ReactElement);

    expect(html).toContain("Custom crash message");
    expect(html).toContain("Retry");
  });
});
