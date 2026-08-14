import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders the main heading", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { level: 1, name: /react testing library/i })
    ).toBeInTheDocument();
  });

  it("renders all the example components together", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /welcome, marcos/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "marcos@example.com" })).toBeInTheDocument();
  });
});
