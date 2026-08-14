import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ProfileCard from "./ProfileCard";

describe("ProfileCard", () => {
  it("matches the snapshot", () => {
    const { container } = render(
      <ProfileCard name="Marcos Debona" role="Developer" email="marcos@example.com" />
    );

    expect(container).toMatchSnapshot();
  });

  it("renders the profile fields explicitly", () => {
    render(<ProfileCard name="Marcos Debona" role="Developer" email="marcos@example.com" />);

    expect(screen.getByRole("heading", { name: "Marcos Debona" })).toBeInTheDocument();
    expect(screen.getByText("Developer")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "marcos@example.com" })).toHaveAttribute(
      "href",
      "mailto:marcos@example.com"
    );
  });
});
