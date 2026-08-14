import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Counter from "./Counter";

describe("Counter", () => {
  it("increments the count when the + button is clicked", async () => {
    const user = userEvent.setup();
    render(<Counter initialCount={0} />);

    await user.click(screen.getByRole("button", { name: "increment" }));

    expect(screen.getByRole("heading", { name: /count/i })).toHaveTextContent("Count: 1");
  });

  it("decrements the count when the - button is clicked", async () => {
    const user = userEvent.setup();
    render(<Counter initialCount={5} />);

    await user.click(screen.getByRole("button", { name: "decrement" }));

    expect(screen.getByRole("heading", { name: /count/i })).toHaveTextContent("Count: 4");
  });

  it("resets the count to its initial value", async () => {
    const user = userEvent.setup();
    render(<Counter initialCount={3} />);

    await user.click(screen.getByRole("button", { name: "increment" }));
    await user.click(screen.getByRole("button", { name: "increment" }));
    await user.click(screen.getByRole("button", { name: /reset/i }));

    expect(screen.getByRole("heading", { name: /count/i })).toHaveTextContent("Count: 3");
  });
});
