import { fireEvent, render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { User } from "../hooks";
import { Profile } from "./Profile";

const existingUser: User = {
  id: 42,
  email: "pavel@example.test",
  name: "Павел",
  avatar_url: null,
  bio: "Люблю путешествия",
  role: "reader",
  is_anonymous: true,
};

const props = {
  onClose: vi.fn(),
  onRequestCode: vi.fn().mockResolvedValue(undefined),
  onVerifyCode: vi.fn().mockResolvedValue(undefined),
  onTelegramLogin: vi.fn().mockResolvedValue(undefined),
  onUpdate: vi.fn().mockResolvedValue(undefined),
  onUploadAvatar: vi.fn().mockResolvedValue(undefined),
  onLogout: vi.fn().mockResolvedValue(undefined),
  onError: vi.fn(),
};

describe("Profile", () => {
  it("temporarily hides email login and keeps Telegram Login functional", async () => {
    vi.stubEnv("VITE_TELEGRAM_BOT_USERNAME", "pod_solncem_bot");
    const onTelegramLogin = vi.fn().mockResolvedValue(undefined);
    const view = render(<Profile user={null} {...props} onTelegramLogin={onTelegramLogin} />);

    expect(view.queryByPlaceholderText("Электронная почта")).toBeNull();
    expect(view.queryByPlaceholderText("Код из письма")).toBeNull();
    expect(view.queryByRole("button", { name: "Получить код" })).toBeNull();
    expect(view.queryByText(/коду из письма/i)).toBeNull();

    const script = view.container.querySelector<HTMLScriptElement>("script[data-telegram-login]");
    expect(script?.dataset.telegramLogin).toBe("pod_solncem_bot");
    window.__mpsTelegramAuth?.({ id: 42, first_name: "Павел", auth_date: 1_725_000_000, hash: "signed-hash" });
    await waitFor(() => expect(onTelegramLogin).toHaveBeenCalledWith({ id: 42, first_name: "Павел", auth_date: 1_725_000_000, hash: "signed-hash" }));
    vi.unstubAllEnvs();
  });

  it("synchronizes existing profile fields when login changes user without unmounting", () => {
    const view = render(<Profile user={null} {...props} />);

    view.rerender(<Profile user={existingUser} {...props} />);

    expect((view.getByPlaceholderText("Имя") as HTMLInputElement).value).toBe("Павел");
    expect((view.getByPlaceholderText("О себе") as HTMLTextAreaElement).value).toBe("Люблю путешествия");
    expect(view.getByText("Показывать меня онлайн").parentElement?.querySelector("i")?.className).toBe("");
  });

  it("uploads an avatar with the same modern format support as media and resets the file input", async () => {
    const onUploadAvatar = vi.fn().mockResolvedValue(undefined);
    const view = render(<Profile user={existingUser} {...props} onUploadAvatar={onUploadAvatar} />);
    const input = view.getByLabelText("Загрузить аватар") as HTMLInputElement;
    const setValue = vi.fn();
    Object.defineProperty(input, "value", { configurable: true, get: () => "C:\\fakepath\\avatar.png", set: setValue });

    expect(input.accept).toBe("image/jpeg,image/png,image/webp,image/heic,image/heif,image/avif");
    fireEvent.change(input, {
      target: { files: [new File(["avatar"], "avatar.png", { type: "image/png" })] },
    });

    await waitFor(() => expect(onUploadAvatar).toHaveBeenCalledWith(expect.any(File)));
    expect(setValue).toHaveBeenCalledWith("");
  });

  it("shows the person name and logs out", async () => {
    const onLogout = vi.fn().mockResolvedValue(undefined);
    const view = render(<Profile user={{ ...existingUser, role: "admin" }} {...props} onLogout={onLogout} />);

    expect(view.getByText("Павел")).toBeTruthy();
    expect(view.getByText("Роль: admin")).toBeTruthy();
    fireEvent.click(view.getByRole("button", { name: "Выйти" }));
    await waitFor(() => expect(onLogout).toHaveBeenCalledTimes(1));
  });
});
