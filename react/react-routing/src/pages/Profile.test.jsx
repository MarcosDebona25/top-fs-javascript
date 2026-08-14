import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router";
import Profile from "./Profile";

describe("Profile", () => {
  it("renders the Popeye profile for /profile/popeye", () => {
    render(
      <MemoryRouter initialEntries={["/profile/popeye"]}>
        <Routes>
          <Route path="/profile/:name" element={<Profile />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/popeye/i)).toBeInTheDocument();
  });

  it("renders the default profile for an unknown name", () => {
    render(
      <MemoryRouter initialEntries={["/profile/unknown"]}>
        <Routes>
          <Route path="/profile/:name" element={<Profile />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/nothing to see here/i)).toBeInTheDocument();
  });
});
