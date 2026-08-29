import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import "../styles.css";
import { Feed } from "./Feed";

const post = {
  id: 17,
  type: "article" as const,
  title: "Гид по Бали",
  slug: "bali-guide",
  body: "Большой материал о путешествии.",
  views: 12,
  likes_count: 3,
  shot_at: null,
  author: { id: 7, name: "Мария", avatar_url: null },
};
const fishka = { ...post, id: 18, type: "fishka" as const, title: "Фишка вне ленты", slug: "fishka-outside-feed", emoji: "💡" };
const video = { ...post, id: 19, type: "video_review" as const, title: "Видео для ленты", slug: "video-in-feed", shot_at: "2026-08-26" };

const editorProps = {
  posts: [],
  loading: false,
  canCreate: true,
  onCreatePost: vi.fn().mockResolvedValue(undefined),
  onToggleLike: vi.fn(),
  onOpenArticle: vi.fn(),
  onOpenProfile: vi.fn(),
};

const clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, "clipboard");
const execCommandDescriptor = Object.getOwnPropertyDescriptor(document, "execCommand");

function cssRule(selector: string): CSSStyleRule | undefined {
  return Array.from(document.styleSheets).flatMap((sheet) => Array.from(sheet.cssRules))
    .find((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule && rule.selectorText.split(",").map((part: string) => part.trim()).includes(selector));
}

afterEach(() => {
  if (clipboardDescriptor) Object.defineProperty(navigator, "clipboard", clipboardDescriptor);
  else Reflect.deleteProperty(navigator, "clipboard");
  if (execCommandDescriptor) Object.defineProperty(document, "execCommand", execCommandDescriptor);
  else Reflect.deleteProperty(document, "execCommand");
  vi.restoreAllMocks();
});

describe("Feed composer modal", () => {
  it("gives carousel arrows a high-contrast 44px touch target", () => {
    render(<Feed {...editorProps} posts={[{ ...post, body: '<figure data-carousel="images"><img src="/media/one.webp" alt="Первое"><img src="/media/two.webp" alt="Второе"></figure>' }]} />);

    const arrow = screen.getByRole("button", { name: "Следующее изображение" });
    const style = getComputedStyle(arrow);
    expect(style.width).toBe("44px");
    expect(style.height).toBe("44px");
    expect(style.background).toBe("var(--shell)");
    expect(style.border).toBe("2px solid var(--text)");
  });

  it("frames every post image path once and frames a carousel as one container", () => {
    const { container } = render(<Feed {...editorProps} posts={[{ ...post, cover_url: "/media/cover.webp", body: '<p>Маршрут</p><img src="/media/inline.webp" alt="Фото в тексте"><figure data-carousel="images"><img src="/media/one.webp" alt="Первый слайд"><img src="/media/two.webp" alt="Второй слайд"></figure>' }]} />);

    expect(cssRule(".post-card .article-cover-image")?.style.border).toBe("1px solid var(--card-line)");
    expect(cssRule(".post-card .rich-text-content img")?.style.border).toBe("1px solid var(--card-line)");
    expect(cssRule(".post-card .image-carousel")?.style.border).toBe("1px solid var(--card-line)");
    expect(cssRule(".post-card .image-carousel-stage img")?.style.border).toBe("0");
    expect(screen.getByRole("img", { name: "Фото в тексте" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Первый слайд" })).toBeTruthy();
    expect(container.querySelector(".post-card .image-carousel")).toBeTruthy();
  });

  it("copies an absolute post URL and confirms sharing", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    const onNotice = vi.fn();
    render(<Feed {...editorProps} posts={[post]} onNotice={onNotice} />);

    fireEvent.click(screen.getByRole("button", { name: "Поделиться" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/posts/bali-guide`));
    expect(onNotice).toHaveBeenCalledWith("Ссылка на публикацию скопирована");
  });

  it("falls back to the legacy copy command when Clipboard API is unavailable", async () => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
    const execCommand = vi.fn(() => true);
    Object.defineProperty(document, "execCommand", { configurable: true, value: execCommand });
    const onNotice = vi.fn();
    render(<Feed {...editorProps} posts={[post]} onNotice={onNotice} />);

    fireEvent.click(screen.getByRole("button", { name: "Поделиться" }));

    await waitFor(() => expect(execCommand).toHaveBeenCalledWith("copy"));
    expect(onNotice).toHaveBeenCalledWith("Ссылка на публикацию скопирована");
  });

  it("uses the soft card surface for empty and inset content blocks", () => {
    const { container } = render(<Feed {...editorProps} />);
    const emptyState = screen.getByText("Публикаций в этом разделе пока нет.");
    const tourCta = container.querySelector(".tour-cta") as HTMLElement;

    expect(getComputedStyle(emptyState).background).toBe("var(--card-soft)");
    expect(getComputedStyle(tourCta).background).toBe("var(--card-soft)");
  });

  it("keeps fishki out of the main feed while retaining articles and video reviews", () => {
    render(<Feed posts={[post, fishka, video]} loading={false} onToggleLike={vi.fn()} onOpenArticle={vi.fn()} onOpenProfile={vi.fn()} />);

    expect(screen.getByRole("heading", { level: 2, name: post.title })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: video.title })).toBeTruthy();
    expect(screen.queryByRole("heading", { level: 2, name: fishka.title })).toBeNull();
  });

  it("renders an explicit cover image instead of the article fallback", () => {
    const { container } = render(<Feed {...editorProps} posts={[{ ...post, cover_url: "/media/bali-cover.webp" }]} onToggleLike={vi.fn()} />);

    expect(screen.getByRole("img", { name: "Обложка: Гид по Бали" }).getAttribute("src")).toBe("/media/bali-cover.webp");
    expect(screen.queryByText("Под солнцем")).toBeNull();
    expect(container.querySelector(".article-cover")).toBeNull();
  });

  it("renders no cover element when an article has no cover URL", () => {
    const { container } = render(<Feed {...editorProps} posts={[post]} onToggleLike={vi.fn()} />);

    expect(screen.queryByText("Под солнцем")).toBeNull();
    expect(screen.queryByRole("img", { name: "Обложка: Гид по Бали" })).toBeNull();
    expect(container.querySelector(".article-cover")).toBeNull();
    expect(container.querySelector(".article-card")?.firstElementChild?.classList.contains("post-tag")).toBe(true);
  });

  it("renders a like button and its count in a post card", () => {
    render(<Feed {...editorProps} posts={[post]} onToggleLike={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Нравится: 3" })).toBeTruthy();
  });

  it("keeps the composer out of the initial feed and opens it only by the compact action", () => {
    render(<Feed {...editorProps} />);

    expect(screen.getByText("Реальные истории, честные отзывы и разборы направлений — живые впечатления от путешествий")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Статьи" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Все" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Статьи" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Создать публикацию" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Создать публикацию" }));

    expect(screen.getByRole("dialog", { name: "Создание публикации" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Создать публикацию" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Текст публикации" })).toBeTruthy();
  });

  it("closes the composer modal on Escape and a backdrop click", () => {
    render(<Feed {...editorProps} />);

    fireEvent.click(screen.getByRole("button", { name: "Создать публикацию" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Создание публикации" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Создать публикацию" }));
    fireEvent.mouseDown(screen.getByLabelText("Закрыть создание публикации"));
    expect(screen.queryByRole("dialog", { name: "Создание публикации" })).toBeNull();
  });
});
