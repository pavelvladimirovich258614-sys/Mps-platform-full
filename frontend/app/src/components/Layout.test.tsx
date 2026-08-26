import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Layout } from "./Layout";

const callbacks = {
  onNavigate: vi.fn(), onThemeToggle: vi.fn(), onOpenQA: vi.fn(), onOpenProfile: vi.fn(),
  onToggleNotifications: vi.fn(), onOpenPrivacy: vi.fn(), onOpenTerms: vi.fn(),
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
        userAvatarUrl="/media/pavel.webp"
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
    expect(screen.getByRole("button", { name: "Павел" }).querySelector("img")?.getAttribute("src")).toBe("/media/pavel.webp");
    expect(view.container.querySelector(".presence-avatar-fallback")).toBeTruthy();
    expect(view.container.querySelector(".presence-person > i")).toBeNull();
  });
});
