import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TelegramLogin, type TelegramAuthData } from "./TelegramLogin";

declare global {
  interface Window {
    __mpsTelegramAuth?: (payload: TelegramAuthData) => void;
  }
}

const payload: TelegramAuthData = {
  id: 42,
  first_name: "Павел",
  last_name: "Тестов",
  username: "pavel",
  photo_url: "https://t.me/i/userpic/320/example.jpg",
  auth_date: 1_725_000_000,
  hash: "signed-hash",
};

describe("TelegramLogin", () => {
  it("loads the official widget and forwards its signed callback payload", async () => {
    const onAuth = vi.fn().mockResolvedValue(undefined);
    const view = render(
      <TelegramLogin botUsername="pod_solncem_bot" onAuth={onAuth} onError={vi.fn()} />,
    );

    const script = view.container.querySelector("script");
    expect(script?.src).toBe("https://telegram.org/js/telegram-widget.js?22");
    expect(script?.dataset.telegramLogin).toBe("pod_solncem_bot");
    expect(script?.dataset.onauth).toBe("__mpsTelegramAuth(user)");
    expect(script?.dataset.requestAccess).toBe("write");

    window.__mpsTelegramAuth?.(payload);

    await waitFor(() => expect(onAuth).toHaveBeenCalledWith(payload));
  });

  it("does not load the widget without a configured bot username", () => {
    const view = render(<TelegramLogin botUsername="" onAuth={vi.fn()} onError={vi.fn()} />);

    expect(view.container.querySelector("script")).toBeNull();
    expect(view.getByText("Вход через Telegram временно недоступен")).toBeTruthy();
  });
});
