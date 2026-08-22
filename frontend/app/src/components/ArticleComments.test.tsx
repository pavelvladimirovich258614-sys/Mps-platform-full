import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ArticleComments } from "./ArticleComments";

const mocks = vi.hoisted(() => ({ create: vi.fn(), react: vi.fn() }));

vi.mock("../hooks", () => ({
  useComments: () => ({ comments: [], loading: false, react: mocks.react, create: mocks.create }),
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
    mocks.create.mockReset();
    mocks.react.mockReset();
  });

  it("renders a like button and its count on the full article", () => {
    render(<ArticleComments article={article} commentsModerationEnabled={false} onBack={vi.fn()} onError={vi.fn()} onOpenProfile={vi.fn()} onToggleLike={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Нравится: 3" })).toBeTruthy();
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
