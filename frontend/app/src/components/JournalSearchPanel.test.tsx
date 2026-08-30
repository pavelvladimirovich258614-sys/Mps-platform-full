import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { JournalSearchPanel } from "./JournalSearchPanel";

const results = {
  articles: [{ id: 1, title: "Маршрут по Байкалу", slug: "baikal-route" }],
  authors: [{ id: 2, name: "Анна Кириллова", avatar_url: null, bio: "Автор журнала" }],
  forum_topics: [{ id: 3, title: "Связь в Марокко", country_id: 4 }],
};

const callbacks = {
  onQueryChange: vi.fn(),
  onRetry: vi.fn(),
  onOpenArticle: vi.fn(),
  onOpenProfile: vi.fn(),
  onOpenForumTopic: vi.fn(),
};

describe("JournalSearchPanel", () => {
  it("renders grouped results with keyboard-focusable navigation actions", () => {
    render(
      <JournalSearchPanel
        {...callbacks}
        query="маршрут"
        results={results}
        loading={false}
        error=""
      />,
    );

    const panel = screen.getByRole("search", { name: "Поиск по журналу" });
    const input = within(panel).getByRole("searchbox", { name: "Поиск по журналу" });
    const article = within(panel).getByRole("button", { name: "Открыть статью Маршрут по Байкалу" });
    const author = within(panel).getByRole("button", { name: "Открыть профиль Анна Кириллова" });
    const topic = within(panel).getByRole("button", { name: "Открыть тему Связь в Марокко" });
    article.focus();
    expect(document.activeElement).toBe(article);
    expect(within(panel).getByText("АК")).toBeTruthy();

    fireEvent.change(input, { target: { value: "байкал" } });
    fireEvent.click(article);
    fireEvent.click(author);
    fireEvent.click(topic);
    expect(callbacks.onQueryChange).toHaveBeenCalledWith("байкал");
    expect(callbacks.onOpenArticle).toHaveBeenCalledWith("baikal-route");
    expect(callbacks.onOpenProfile).toHaveBeenCalledWith(2);
    expect(callbacks.onOpenForumTopic).toHaveBeenCalledWith(4, 3);
  });

  it("shows idle, loading, empty, and recoverable error states", () => {
    const view = render(
      <JournalSearchPanel
        {...callbacks}
        query=""
        results={{ articles: [], authors: [], forum_topics: [] }}
        loading={false}
        error=""
      />,
    );
    expect(screen.getByText("Ищите статьи, авторов и темы форума.")).toBeTruthy();

    view.rerender(
      <JournalSearchPanel
        {...callbacks}
        query="мар"
        results={{ articles: [], authors: [], forum_topics: [] }}
        loading
        error=""
      />,
    );
    expect(screen.getByRole("status").textContent).toContain("Ищем по журналу");

    view.rerender(
      <JournalSearchPanel
        {...callbacks}
        query="мар"
        results={{ articles: [], authors: [], forum_topics: [] }}
        loading={false}
        error=""
      />,
    );
    expect(screen.getByText("Ничего не найдено. Попробуйте изменить запрос.")).toBeTruthy();

    view.rerender(
      <JournalSearchPanel
        {...callbacks}
        query="мар"
        results={{ articles: [], authors: [], forum_topics: [] }}
        loading={false}
        error="Поиск временно недоступен"
      />,
    );
    expect(screen.getByRole("alert").textContent).toContain("Поиск временно недоступен");
    fireEvent.click(screen.getByRole("button", { name: "Повторить поиск" }));
    expect(callbacks.onRetry).toHaveBeenCalledOnce();
  });
});
