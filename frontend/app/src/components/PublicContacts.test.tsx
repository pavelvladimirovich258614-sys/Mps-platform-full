import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { About } from "./About";
import { Layout } from "./Layout";


const layoutProps = {
  page: "feed" as const,
  theme: "dark" as const,
  notificationsOpen: false,
  unreadCount: 0,
  userName: "Войти",
  online: [],
  publicSettings: null,
  onNavigate: () => undefined,
  onThemeToggle: () => undefined,
  onOpenQA: () => undefined,
  onOpenProfile: () => undefined,
  onToggleNotifications: () => undefined,
  onOpenPrivacy: () => undefined,
  onOpenTerms: () => undefined,
};


describe("public contacts", () => {
  it("does not render fictitious legal or contact details before settings are configured", () => {
    const { unmount } = render(<Layout {...layoutProps}>content</Layout>);

    expect(screen.queryByText(/ИП Иванова/)).toBeNull();
    expect(screen.queryByText(/000000000000/)).toBeNull();
    unmount();

    render(<About publicSettings={null} />);
    expect(screen.queryByText(/900\) 000-00-00/)).toBeNull();
    expect(screen.queryByText(/Москва, ул\. Примерная/)).toBeNull();
  });

  it("renders configured public legal and contact details", () => {
    const publicSettings = {
      legal_name: "Тестовое агентство",
      legal_inn: "123456789012",
      legal_ogrn: "1234567890123",
      contact_email: "contact@example.test",
      contact_phone: "+7 000 000-00-00",
      contact_address: "Тестовый адрес, 1",
    };
    const { unmount } = render(<Layout {...layoutProps} publicSettings={publicSettings}>content</Layout>);

    screen.getByText("Тестовое агентство · ИНН 123456789012 · ОГРН 1234567890123 · contact@example.test");
    unmount();

    render(<About publicSettings={publicSettings} />);
    screen.getByText("+7 000 000-00-00");
    screen.getByText("Тестовый адрес, 1");
  });
});
