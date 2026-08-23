import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RichTextContent, sanitizeRichTextHtml } from "./RichTextContent";

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

  it("renders an uploaded relative media image in a published article", () => {
    render(<RichTextContent html={'<p>Маршрут</p><img src="/media/sea.webp" alt="Море">'} />);

    expect(screen.getByRole("img", { name: "Море" }).getAttribute("src")).toBe("/media/sea.webp");
  });

  it("renders a stored image carousel with accessible controls and leaves a single image ordinary", () => {
    const { container, rerender } = render(
      <RichTextContent html={'<figure data-carousel="images"><img src="/media/one.webp" alt="Первое"><img src="/media/two.webp" alt="Второе"></figure>'} />,
    );

    expect(screen.getByRole("region", { name: "Карусель изображений" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Первое" })).toBeTruthy();
    expect(screen.queryByRole("img", { name: "Второе" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Следующее изображение" }));
    expect(screen.getByRole("img", { name: "Второе" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Слайд 2" }).getAttribute("aria-current")).toBe("true");

    rerender(<RichTextContent html={'<img src="/media/alone.webp" alt="Одинокое">'} />);
    expect(container.querySelector("figure")).toBeNull();
    expect(screen.getByRole("img", { name: "Одинокое" })).toBeTruthy();
  });

  it("keeps a real slide visible when a reusable carousel loses its active image", () => {
    const { rerender } = render(
      <RichTextContent html={'<figure data-carousel="images"><img src="/media/one.webp" alt="Первое"><img src="/media/two.webp" alt="Второе"><img src="/media/three.webp" alt="Третье"></figure>'} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Слайд 3" }));
    expect(screen.getByRole("img", { name: "Третье" })).toBeTruthy();

    rerender(
      <RichTextContent html={'<figure data-carousel="images"><img src="/media/one.webp" alt="Первое"><img src="/media/two.webp" alt="Второе"></figure>'} />,
    );

    expect(screen.getByRole("region", { name: "Карусель изображений" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Второе" }).getAttribute("src")).toBe("/media/two.webp");
  });

  it("keeps only the approved carousel attribute after the client sanitization boundary", () => {
    const safeHtml = sanitizeRichTextHtml('<figure data-carousel="images" class="evil" style="display:none" onclick="alert(1)" data-extra="x"><img src="/media/one.webp" alt="Первое" onclick="alert(1)"><img src="/media/two.webp" alt="Второе" style="display:none"></figure>');
    const container = document.createElement("div");
    container.innerHTML = safeHtml;

    const carousel = container.querySelector("figure");
    expect(carousel?.getAttribute("data-carousel")).toBe("images");
    expect(carousel?.hasAttribute("class")).toBe(false);
    expect(carousel?.hasAttribute("style")).toBe(false);
    expect(carousel?.hasAttribute("onclick")).toBe(false);
    expect(carousel?.hasAttribute("data-extra")).toBe(false);
    expect(carousel?.querySelector("img")?.hasAttribute("onclick")).toBe(false);
  });
});
