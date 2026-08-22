import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArticleComments } from "./ArticleComments";
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
  author: { id: 7, name: "Мария", avatar_url: "/media/maria.webp" },
};

vi.mock("../hooks", () => ({
  useComments: () => ({
    comments: [{ id: 3, body: "Спасибо за разбор", author: { id: 7, name: "Мария", avatar_url: "/media/maria.webp" }, reactions: {}, my_reaction: null }],
    loading: false,
    react: vi.fn(),
    create: vi.fn(),
  }),
}));

describe("author profile links", () => {
  it("opens the post author's public profile from Feed", () => {
    const onOpenProfile = vi.fn();
    render(<Feed posts={[post]} loading={false} onOpenArticle={vi.fn()} onOpenProfile={onOpenProfile} />);

    fireEvent.click(screen.getByRole("button", { name: "Автор: Мария" }));
    expect(onOpenProfile).toHaveBeenCalledWith(post.author.id);
  });

  it("opens the comment author's public profile", () => {
    const onOpenProfile = vi.fn();
    render(<ArticleComments article={post} onBack={vi.fn()} onError={vi.fn()} onOpenProfile={onOpenProfile} />);

    fireEvent.click(screen.getByRole("button", { name: "Мария" }));
    expect(onOpenProfile).toHaveBeenCalledWith(post.author.id);
  });
});
