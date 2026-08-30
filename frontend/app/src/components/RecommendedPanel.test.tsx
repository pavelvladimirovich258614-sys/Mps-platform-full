import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RecommendedPanel } from "./RecommendedPanel";

const authors = [
  { id: 7, name: "Анна Кириллова", avatar_url: null, bio: "Пишу о самостоятельных поездках." },
  { id: 8, name: "Игорь Левин", avatar_url: "/media/igor.webp", bio: null },
];

const callbacks = {
  onOpenProfile: vi.fn(),
  onFollow: vi.fn(),
  onDismiss: vi.fn(),
  onRetry: vi.fn(),
};

describe("RecommendedPanel", () => {
  it("renders compact author cards and exposes profile, follow, and dismiss actions", () => {
    render(
      <RecommendedPanel
        {...callbacks}
        authors={authors}
        loading={false}
        error=""
        followingId={null}
      />,
    );

    const panel = screen.getByRole("complementary", { name: "Рекомендовано для вас" });
    expect(within(panel).getByText("АК")).toBeTruthy();
    expect(within(panel).getByRole("img", { name: "Аватар Игорь Левин" }).getAttribute("src"))
      .toBe("/media/igor.webp");
    expect(within(panel).getByText("Пишу о самостоятельных поездках.")).toBeTruthy();

    const profile = within(panel).getByRole("button", { name: "Открыть профиль Анна Кириллова" });
    const follow = within(panel).getByRole("button", { name: "Подписаться на Анна Кириллова" });
    const dismiss = within(panel).getByRole("button", { name: "Скрыть рекомендацию Анна Кириллова" });
    dismiss.focus();
    expect(document.activeElement).toBe(dismiss);

    fireEvent.click(profile);
    fireEvent.click(follow);
    fireEvent.click(dismiss);
    expect(callbacks.onOpenProfile).toHaveBeenCalledWith(7);
    expect(callbacks.onFollow).toHaveBeenCalledWith(7);
    expect(callbacks.onDismiss).toHaveBeenCalledWith(7);
  });

  it("shows loading, empty, error, retry, and pending-follow states", () => {
    const view = render(
      <RecommendedPanel
        {...callbacks}
        authors={[]}
        loading
        error=""
        followingId={null}
      />,
    );
    expect(screen.getByRole("status").textContent).toContain("Загружаем рекомендации");

    view.rerender(
      <RecommendedPanel
        {...callbacks}
        authors={[]}
        loading={false}
        error=""
        followingId={null}
      />,
    );
    expect(screen.getByText("Новых рекомендаций пока нет.")).toBeTruthy();

    view.rerender(
      <RecommendedPanel
        {...callbacks}
        authors={[]}
        loading={false}
        error="Не удалось загрузить рекомендации"
        followingId={null}
      />,
    );
    expect(screen.getByRole("alert").textContent).toContain("Не удалось загрузить рекомендации");
    fireEvent.click(screen.getByRole("button", { name: "Повторить загрузку рекомендаций" }));
    expect(callbacks.onRetry).toHaveBeenCalledOnce();

    view.rerender(
      <RecommendedPanel
        {...callbacks}
        authors={authors}
        loading={false}
        error=""
        followingId={7}
      />,
    );
    const pending = screen.getByRole("button", { name: "Подписка на Анна Кириллова выполняется" });
    expect((pending as HTMLButtonElement).disabled).toBe(true);
    expect(pending.textContent).toBe("Подписываем…");
  });
});
