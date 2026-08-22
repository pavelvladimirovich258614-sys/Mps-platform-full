import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArticleComments } from "./ArticleComments";

vi.mock("../hooks", () => ({
  useComments: () => ({ comments: [], loading: false, react: vi.fn(), create: vi.fn() }),
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
  it("renders the tour CTA after the discussion section", () => {
    render(<ArticleComments article={article} onBack={vi.fn()} onError={vi.fn()} onOpenProfile={vi.fn()} />);

    const discussion = screen.getByRole("heading", { name: "Обсуждение" }).closest("section");
    const tourCta = screen.getByRole("heading", { name: "Хотите так же, но без планирования?" }).closest("section");

    expect(discussion?.compareDocumentPosition(tourCta!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});
