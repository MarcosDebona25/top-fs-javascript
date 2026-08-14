import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchBox from "./SearchBox";

describe("SearchBox", () => {
  let onSearch;

  beforeEach(() => {
    // A shared mock, recreated clean before each test.
    onSearch = vi.fn();
  });

  it("shows no result before searching", () => {
    render(<SearchBox onSearch={onSearch} />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("calls onSearch with the typed query", async () => {
    const user = userEvent.setup();
    render(<SearchBox onSearch={onSearch} />);

    await user.type(screen.getByLabelText(/search/i), "react");
    await user.click(screen.getByRole("button", { name: /search/i }));

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("react");
  });

  it("renders the value returned by onSearch", async () => {
    // Overrides the return value for this specific test.
    onSearch.mockResolvedValue("42 results");

    const user = userEvent.setup();
    render(<SearchBox onSearch={onSearch} />);

    await user.type(screen.getByLabelText(/search/i), "react");
    await user.click(screen.getByRole("button", { name: /search/i }));

    expect(await screen.findByRole("status")).toHaveTextContent("42 results");
  });

  it("renders an error message when onSearch rejects", async () => {
    onSearch.mockRejectedValue(new Error("network down"));

    const user = userEvent.setup();
    render(<SearchBox onSearch={onSearch} />);

    await user.type(screen.getByLabelText(/search/i), "react");
    await user.click(screen.getByRole("button", { name: /search/i }));

    expect(await screen.findByRole("status")).toHaveTextContent(/something went wrong/i);
  });
});
