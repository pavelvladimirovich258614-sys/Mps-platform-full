import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RichTextContent } from "./RichTextContent";

describe("RichTextContent", () => {
  it("renders stored rich HTML but strips unsafe markup again on read", () => {
    const { container } = render(
      <RichTextContent html={'<h2>Маршрут</h2><p><strong>Важно</strong> <a href="https://example.com">ссылка</a><img src="https://cdn.example/sea.jpg" alt="Море"><script>alert(1)</script><code>не формат редактора</code></p>'} />,
    );

    expect(screen.getByRole("heading", { name: "Маршрут" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Море" })).toBeTruthy();
    expect(container.querySelector("strong")?.textContent).toBe("Важно");
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("code")).toBeNull();
    expect(screen.getByText("не формат редактора")).toBeTruthy();
  });

  it("keeps legacy markdown/plain text as text instead of treating it as HTML", () => {
    const { container } = render(<RichTextContent html={"**Старый текст**\nВторая строка <script>"} />);

    expect(container.textContent).toBe("**Старый текст**\nВторая строка <script>");
    expect(container.querySelector("strong")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
  });
});
