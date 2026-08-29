import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SubscriptionsPanel } from "./SubscriptionsPanel";

const subscriptions = [
  { id: 1, name: "Анна Кириллова", avatar_url: null, is_following: true },
  { id: 2, name: "Игорь Левин", avatar_url: "/media/igor.webp", is_following: true },
  { id: 3, name: "Марина Соколова", avatar_url: null, is_following: true },
  { id: 4, name: "Пётр Волков", avatar_url: null, is_following: true },
  { id: 5, name: "Даша Никитина", avatar_url: null, is_following: true },
  { id: 6, name: "Тимур Алиев", avatar_url: null, is_following: true },
  { id: 7, name: "Олег Романов", avatar_url: null, is_following: true },
  { id: 8, name: "Юлия Миронова", avatar_url: null, is_following: true },
  { id: 9, name: "Скрытый Девятый", avatar_url: null, is_following: true },
];

describe("SubscriptionsPanel", () => {
  it("renders the first eight real subscriptions as a four-column initials grid", () => {
    const onOpenProfile = vi.fn();
    const onShowAll = vi.fn();
    render(
      <SubscriptionsPanel
        subscriptions={subscriptions}
        loading={false}
        onOpenProfile={onOpenProfile}
        onShowAll={onShowAll}
      />,
    );

    const panel = screen.getByRole("complementary", { name: "Подписки" });
    expect(panel.querySelector(".subscriptions-grid")).toBeTruthy();
    expect(within(panel).getAllByRole("button", { name: /Открыть профиль/ })).toHaveLength(8);
    expect(within(panel).getByText("АК")).toBeTruthy();
    expect(within(panel).queryByText("Скрытый Девятый")).toBeNull();

    fireEvent.click(within(panel).getByRole("button", { name: "Открыть профиль Анна Кириллова" }));
    fireEvent.click(within(panel).getByRole("button", { name: "Показать все" }));
    expect(onOpenProfile).toHaveBeenCalledWith(1);
    expect(onShowAll).toHaveBeenCalledOnce();
  });

  it("keeps the panel honest while real subscriptions are loading or absent", () => {
    const props = { onOpenProfile: vi.fn(), onShowAll: vi.fn() };
    const view = render(<SubscriptionsPanel {...props} subscriptions={[]} loading />);

    expect(screen.getByText("Загружаем подписки…")).toBeTruthy();
    view.rerender(<SubscriptionsPanel {...props} subscriptions={[]} loading={false} />);
    expect(screen.getByText("Подписок пока нет.")).toBeTruthy();
  });
});
