import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginForm from "./LoginForm";

describe("LoginForm", () => {
  it("submits the username and password", async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn();

    render(<LoginForm onLogin={onLogin} />);

    await user.type(screen.getByLabelText(/username/i), "marcos");
    await user.type(screen.getByLabelText(/password/i), "secret123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(onLogin).toHaveBeenCalledTimes(1);
    expect(onLogin).toHaveBeenCalledWith({ username: "marcos", password: "secret123" });
  });

  it("keeps the submit button disabled while the fields are empty", () => {
    render(<LoginForm onLogin={() => {}} />);

    expect(screen.getByRole("button", { name: /sign in/i })).toBeDisabled();
  });

  it("enables the submit button once both fields have values", async () => {
    const user = userEvent.setup();
    render(<LoginForm onLogin={() => {}} />);

    const button = screen.getByRole("button", { name: /sign in/i });
    expect(button).toBeDisabled();

    await user.type(screen.getByLabelText(/username/i), "marcos");
    await user.type(screen.getByLabelText(/password/i), "secret");

    expect(button).toBeEnabled();
  });
});
