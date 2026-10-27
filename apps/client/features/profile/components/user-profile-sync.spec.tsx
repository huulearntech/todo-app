import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import Avatar from "./avatar";

describe("Profile UI State Synchronization", () => {
  it("renders Avatar directly from avatarUrl prop", () => {
    const avatarUrl = "https://res.cloudinary.com/demo/image/upload/sample.jpg";
    const html = renderToString(
      <Avatar
        avatarUrl={avatarUrl}
        name="Alex Morgan"
      />
    );

    expect(html).toContain(encodeURIComponent(avatarUrl));
    expect(html).toContain("Alex Morgan&#x27;s avatar");
  });

  it("renders default avatar fallback when avatarUrl is missing", () => {
    const html = renderToString(
      <Avatar
        avatarUrl={undefined}
        name="Alex Morgan"
      />
    );

    expect(html).toContain("/default-avatar.svg");
  });
});
