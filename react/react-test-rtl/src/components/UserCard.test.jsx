import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import UserCard from "./UserCard";
import Avatar from "./Avatar";

// Replace the Avatar child with a stub for every test in this file.
// vi.mock is hoisted to the top of the file.
vi.mock("./Avatar", () => ({
  default: vi.fn(() => <div data-testid="mock-avatar" />),
}));

describe("UserCard", () => {
  const user = {
    name: "Marcos Debona",
    role: "Developer",
    email: "marcos@example.com",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the user data", () => {
    render(<UserCard user={user} />);

    expect(screen.getByRole("heading", { name: "Marcos Debona" })).toBeInTheDocument();
    expect(screen.getByText("Developer")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "marcos@example.com" })).toBeInTheDocument();
  });

  it("renders the mocked Avatar instead of the real one", () => {
    render(<UserCard user={user} />);

    expect(screen.getByTestId("mock-avatar")).toBeInTheDocument();
  });

  it("passes the expected props to the Avatar child", () => {
    render(<UserCard user={user} />);

    // React calls the component with (props, secondArg); inspect the first argument.
    const [props] = Avatar.mock.calls[0];
    expect(props).toEqual({ name: "Marcos Debona" });
  });
});
