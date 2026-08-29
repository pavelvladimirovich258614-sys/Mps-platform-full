import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ArticleComments } from "./ArticleComments";

const mocks = vi.hoisted(() => ({ comments: [] as Array<Record<string, unknown>>, create: vi.fn(), react: vi.fn() }));

vi.mock("../hooks", () => ({
  useComments: () => ({ comments: mocks.comments, loading: false, react: mocks.react, create: mocks.create }),
}));

const article = {
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

describe("ArticleComments", () => {
  beforeEach(() => {
    mocks.comments.length = 0;
    mocks.create.mockReset();
    mocks.react.mockReset();
  });

  it("opens a reply composer, submits parent_id and renders one nested level", async () => {
    mocks.comments.push(
      { id: 31, parent_id: null, status: "approved", body: "Основной комментарий", author: { id: 8, name: "Анна", avatar_url: null }, reactions: {}, my_reaction: null },
      { id: 32, parent_id: 31, status: "approved", body: "Вложенный ответ", author: { id: 9, name: "Игорь", avatar_url: null }, reactions: {}, my_reaction: null },
    );
    mocks.create.mockResolvedValue({ status: "approved" });

    const { container } = render(<ArticleComments article={article} commentsModerationEnabled={false} onBack={vi.fn()} onError={vi.fn()} onOpenProfile={vi.fn()} />);

    const replies = container.querySelector(".comment-replies");
    expect(replies).not.toBeNull();
    expect(replies?.textContent).toContain("Вложенный ответ");
    expect(screen.getAllByRole("button", { name: "Ответить" })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Ответить" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Ответ для Анна" }), { target: { value: "Спасибо за совет" } });
    fireEvent.click(screen.getByRole("button", { name: "Отправить ответ" }));

    await waitFor(() => expect(mocks.create).toHaveBeenCalledWith("Спасибо за совет", 31));
    expect(screen.queryByRole("textbox", { name: "Ответ для Анна" })).toBeNull();
  });

  it("renders a like button and its count on the full article", () => {
    render(<ArticleComments article={article} commentsModerationEnabled={false} onBack={vi.fn()} onError={vi.fn()} onOpenProfile={vi.fn()} onToggleLike={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Нравится: 3" })).toBeTruthy();
  });

  it("renders an explicit cover image instead of the article fallback", () => {
    const { container } = render(<ArticleComments article={{ ...article, cover_url: "/media/bali-cover.webp" }} commentsModerationEnabled={false} onBack={vi.fn()} onError={vi.fn()} onOpenProfile={vi.fn()} />);

    expect(screen.getByRole("img", { name: "Обложка: Гид по Бали" }).getAttribute("src")).toBe("/media/bali-cover.webp");
    expect(screen.queryByText("Под солнцем")).toBeNull();
    expect(container.querySelector(".article-hero")).toBeNull();
  });

  it("renders no hero element when an article has no cover URL", () => {
    const { container } = render(<ArticleComments article={article} commentsModerationEnabled={false} onBack={vi.fn()} onError={vi.fn()} onOpenProfile={vi.fn()} />);

    expect(screen.queryByText("Под солнцем")).toBeNull();
    expect(screen.queryByRole("img", { name: "Обложка: Гид по Бали" })).toBeNull();
    expect(container.querySelector(".article-hero")).toBeNull();
    expect(container.querySelector(".article-page")?.children[1]?.classList.contains("post-tag")).toBe(true);
  });

  it("shows edit and delete controls only to editor/admin and confirms deletion", () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const { rerender } = render(<ArticleComments article={article} commentsModerationEnabled={false} onBack={vi.fn()} onError={vi.fn()} onOpenProfile={vi.fn()} onToggleLike={vi.fn()} canManage onDelete={onDelete} />);

    fireEvent.click(screen.getByRole("button", { name: "Удалить" }));
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Удалить публикацию" }).textContent).toContain("Это действие нельзя отменить");
    fireEvent.click(screen.getByRole("button", { name: "Подтвердить удаление" }));
    expect(onDelete).toHaveBeenCalledWith(article);

    rerender(<ArticleComments article={article} commentsModerationEnabled={false} onBack={vi.fn()} onError={vi.fn()} onOpenProfile={vi.fn()} onToggleLike={vi.fn()} canManage={false} />);
    expect(screen.queryByRole("button", { name: "Редактировать" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Удалить" })).toBeNull();
  });

  it("renders the tour CTA after the discussion section", () => {
    render(<ArticleComments article={article} commentsModerationEnabled={false} onBack={vi.fn()} onError={vi.fn()} onOpenProfile={vi.fn()} />);

    const discussion = screen.getByRole("heading", { name: "Обсуждение" }).closest("section");
    const tourCta = screen.getByRole("heading", { name: "Хотите так же, но без планирования?" }).closest("section");

    expect(discussion?.compareDocumentPosition(tourCta!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("only explains premoderation when it is enabled", () => {
    const { rerender } = render(<ArticleComments article={article} commentsModerationEnabled onBack={vi.fn()} onError={vi.fn()} onOpenProfile={vi.fn()} />);

    expect(screen.getByText("Комментарии публикуются после проверки менеджером.")).toBeTruthy();

    rerender(<ArticleComments article={article} commentsModerationEnabled={false} onBack={vi.fn()} onError={vi.fn()} onOpenProfile={vi.fn()} />);
    expect(screen.queryByText("Комментарии публикуются после проверки менеджером.")).toBeNull();
  });

  it("notifies the author when a comment is accepted for moderation", async () => {
    mocks.create.mockResolvedValue({ status: "pending" });
    const onError = vi.fn();
    render(<ArticleComments article={article} commentsModerationEnabled onBack={vi.fn()} onError={onError} onOpenProfile={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("Спросить у менеджера или поделиться опытом…"), { target: { value: "Проверочный комментарий" } });
    fireEvent.click(screen.getByRole("button", { name: "Отправить" }));

    await waitFor(() => expect(onError).toHaveBeenCalledWith("Комментарий отправлен на проверку"));
  });
});
