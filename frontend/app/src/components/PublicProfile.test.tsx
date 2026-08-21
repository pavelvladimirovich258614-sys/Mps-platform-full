import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PublicProfile } from "./PublicProfile";

const profile = {
  id: 7,
  name: "Мария",
  avatar_url: "/media/maria.webp",
  bio: "Пишу о путешествиях.",
  posts_count: 1,
  countries: [{ id: 1, name: "ОАЭ", flag_emoji: "🇦🇪" }],
};

const post = {
  id: 17,
  type: "article" as const,
  title: "Гид по Бали",
  slug: "bali-guide",
  body: "Большой материал о путешествии.",
  views: 12,
  likes_count: 3,
  shot_at: null,
};

describe("PublicProfile", () => {
  it("shows public author data and makes only the publications tab functional", () => {
    const onOpenPost = vi.fn();
    render(<PublicProfile profile={profile} posts={[post]} loading={false} onOpenPost={onOpenPost} />);

    expect(screen.getByRole("heading", { name: "Мария" })).toBeTruthy();
    expect(screen.getByText("Направления в публикациях")).toBeTruthy();
    expect(screen.getByText("🇦🇪 ОАЭ")).toBeTruthy();
    expect(screen.getByText("Гид по Бали")).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: "Ответы" }));
    expect(screen.getByText("Скоро здесь появятся ответы пользователя.")).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: "Публикации" }));
    fireEvent.click(screen.getByRole("button", { name: "Читать публикацию: Гид по Бали" }));
    expect(onOpenPost).toHaveBeenCalledWith(post);
  });
});
