import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Greeting from "./Greeting";

describe("Greeting", () => {
  it("renders a heading with the provided name", () => {
    render(<Greeting name="Marcos" />);

    const heading = screen.getByRole("heading", { level: 1 });

    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent("Welcome, Marcos!");
  });

  it("falls back to the default name when none is provided", () => {
    render(<Greeting />);

    expect(screen.getByText(/welcome, guest/i)).toBeInTheDocument();
  });
});
