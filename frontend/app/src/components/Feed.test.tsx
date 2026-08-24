import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

const editorProps = {
  posts: [],
  loading: false,
  canCreate: true,
  onCreatePost: vi.fn().mockResolvedValue(undefined),
  onToggleLike: vi.fn(),
  onOpenArticle: vi.fn(),
  onOpenProfile: vi.fn(),
};

describe("Feed composer modal", () => {
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
