import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Layout } from "./Layout";

const callbacks = {
  onNavigate: vi.fn(), onThemeToggle: vi.fn(), onOpenQA: vi.fn(), onOpenProfile: vi.fn(),
  onToggleNotifications: vi.fn(), onCreatePost: vi.fn(), onOpenPrivacy: vi.fn(), onOpenTerms: vi.fn(),
};

describe("Layout presence", () => {
  it("uses an accessible bell icon for notifications", () => {
    render(
      <Layout
        {...callbacks}
        page="feed"
        theme="dark"
        notificationsOpen={false}
        unreadCount={2}
        userName="Павел"
        online={[]}
        publicSettings={null}
      >
        <main>Лента</main>
      </Layout>,
    );

    const notifications = screen.getByRole("button", { name: "Уведомления" });
    expect(notifications.querySelector("svg[data-icon='bell']")).toBeTruthy();
    expect(notifications.textContent).not.toContain("♧");
  });

  it("uses the outlined header action hook for search, notifications, and theme", () => {
    render(
      <Layout
        {...callbacks}
        page="feed"
        theme="light"
        notificationsOpen={false}
        unreadCount={0}
        userName="Павел"
        online={[]}
        publicSettings={null}
      >
        <main>Лента</main>
      </Layout>,
    );

    for (const name of ["Поиск", "Уведомления", "Сменить тему"]) {
      expect(screen.getByRole("button", { name }).classList.contains("header-icon-button")).toBe(true);
    }
  });

  it("shows an authenticated user's initial and chevron inside the account pill", () => {
    const view = render(
      <Layout
        {...callbacks}
        page="feed"
        theme="light"
        notificationsOpen={false}
        unreadCount={0}
        userName="Павел"
        isAuthenticated
        online={[]}
        publicSettings={null}
      >
        <main>Лента</main>
      </Layout>,
    );

    const account = screen.getByRole("button", { name: "Павел" });
    expect(within(account).getByText("П").classList.contains("account-button-initial")).toBe(true);
    expect(view.container.querySelector(".account-button-chevron")).toBeTruthy();
  });

  it("adds a separate create shortcut to the editor sidebar", () => {
    const onCreatePost = vi.fn();
    render(
      <Layout
        {...callbacks}
        onCreatePost={onCreatePost}
        page="feed"
        canManagePosts
        theme="light"
        notificationsOpen={false}
        unreadCount={0}
        userName="Редактор"
        isAuthenticated
        online={[]}
        publicSettings={null}
      >
        <main>Лента</main>
      </Layout>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Создать" }));
    expect(onCreatePost).toHaveBeenCalledOnce();
  });

  it("uses the forum wording in navigation and footer", () => {
    render(
      <Layout
        {...callbacks}
        page="countries"
        theme="dark"
        notificationsOpen={false}
        unreadCount={0}
        userName="Павел"
        online={[]}
        publicSettings={null}
      >
        <main>Форум</main>
      </Layout>,
    );

    expect(screen.getByRole("button", { name: "Форум стран" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Страны" })).toBeNull();
  });

  it("uses each online user's avatar and anchors the green indicator to its avatar", () => {
    const view = render(
      <Layout
        {...callbacks}
        page="feed"
        theme="dark"
        notificationsOpen={false}
        unreadCount={0}
        userName="Павел"
        isAuthenticated
        online={[
          { id: 7, name: "Мария", avatar_url: "/media/maria.webp" },
          { id: 8, name: "Антон", avatar_url: null },
        ]}
        publicSettings={null}
      >
        <main>Лента</main>
      </Layout>,
    );

    const presence = screen.getByRole("complementary", { name: "Сейчас на платформе" });
    expect(within(presence).getByRole("img", { name: "Аватар Мария" }).getAttribute("src")).toBe("/media/maria.webp");
    expect(within(presence).getByLabelText("Мария сейчас на платформе").parentElement?.classList.contains("presence-avatar")).toBe(true);
    expect(within(screen.getByRole("button", { name: "Павел" })).getByText("П")).toBeTruthy();
    expect(view.container.querySelector(".presence-avatar-fallback")).toBeTruthy();
    expect(view.container.querySelector(".presence-person > i")).toBeNull();
  });
});
