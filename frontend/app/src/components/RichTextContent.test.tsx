import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RichTextContent, sanitizeRichTextHtml } from "./RichTextContent";

describe("RichTextContent", () => {
  it("offers expansion when only a carousel is collapsed beside short text", () => {
    render(<RichTextContent preview collapseCarouselInPreview html={'<p>Короткий текст</p><figure data-carousel="images"><img src="/media/one.webp" alt="Первый слайд"><img src="/media/two.webp" alt="Второй слайд"></figure>'} />);

    expect(screen.getByText("Короткий текст")).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Карусель изображений" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Читать полностью" }));
    expect(screen.getByRole("region", { name: "Карусель изображений" })).toBeTruthy();
  });

  it("collapses only text in preview mode while keeping every image visible", () => {
    render(<RichTextContent preview html={'<p>Первый абзац</p><p>Второй абзац</p><p>Третий абзац</p><p>Четвёртый абзац</p><img src="/media/alone.webp" alt="Одиночное фото"><figure data-carousel="images"><img src="/media/one.webp" alt="Первый слайд"><img src="/media/two.webp" alt="Второй слайд"></figure>'} />);

    expect(screen.getByText("Первый абзац")).toBeTruthy();
    expect(screen.queryByText("Четвёртый абзац")).toBeNull();
    expect(screen.getByRole("img", { name: "Одиночное фото" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Карусель изображений" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Читать полностью" }));
    expect(screen.getByText("Четвёртый абзац")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Свернуть" }));
    expect(screen.queryByText("Четвёртый абзац")).toBeNull();
  });

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
    const { container } = render(<RichTextContent html={'<p>Маршрут</p><img src="/media/sea-large.webp" alt="Море">'} />);

    const image = screen.getByRole("img", { name: "Море" });
    expect(image.getAttribute("src")).toBe("/media/sea-large.webp");
    expect(image.getAttribute("srcset")).toBe("/media/sea-thumbnail.webp 320w, /media/sea-medium.webp 960w, /media/sea-large.webp 1600w");
    expect(image.getAttribute("sizes")).toBe("(max-width: 900px) 100vw, 760px");
    expect(image.getAttribute("loading")).toBe("lazy");
    expect(image.getAttribute("decoding")).toBe("async");
    expect(container.querySelector('source[type="image/avif"]')?.getAttribute("srcset")).toBe(
      "/media/sea-thumbnail.avif 320w, /media/sea-medium.avif 960w, /media/sea-large.avif 1600w",
    );
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

  it("keeps responsive image attributes but strips unapproved attributes at the client sanitization boundary", () => {
    const safeHtml = sanitizeRichTextHtml('<figure data-carousel="images" class="evil" style="display:none" onclick="alert(1)" data-extra="x"><img src="/media/one-large.webp" alt="Первое" loading="lazy" decoding="async" srcset="/media/one-medium.webp 960w" sizes="100vw" onclick="alert(1)"><img src="/media/two.webp" alt="Второе" style="display:none"></figure>');
    const container = document.createElement("div");
    container.innerHTML = safeHtml;

    const carousel = container.querySelector("figure");
    expect(carousel?.getAttribute("data-carousel")).toBe("images");
    expect(carousel?.hasAttribute("class")).toBe(false);
    expect(carousel?.hasAttribute("style")).toBe(false);
    expect(carousel?.hasAttribute("onclick")).toBe(false);
    expect(carousel?.hasAttribute("data-extra")).toBe(false);
    const image = carousel?.querySelector("img");
    expect(image?.getAttribute("loading")).toBe("lazy");
    expect(image?.getAttribute("decoding")).toBe("async");
    expect(image?.getAttribute("srcset")).toBe("/media/one-medium.webp 960w");
    expect(image?.getAttribute("sizes")).toBe("100vw");
    expect(image?.hasAttribute("onclick")).toBe(false);
  });
});
