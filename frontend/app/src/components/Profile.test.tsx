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
  it("uses browser email semantics before requesting a login code", () => {
    const view = render(<Profile user={null} {...props} />);

    expect(view.getByPlaceholderText("Электронная почта").getAttribute("type")).toBe("email");
  });

  it("synchronizes existing profile fields when login changes user without unmounting", () => {
    const view = render(<Profile user={null} {...props} />);

    view.rerender(<Profile user={existingUser} {...props} />);

    expect((view.getByPlaceholderText("Имя") as HTMLInputElement).value).toBe("Павел");
    expect((view.getByPlaceholderText("О себе") as HTMLTextAreaElement).value).toBe("Люблю путешествия");
    expect(view.getByText("Показывать меня онлайн").parentElement?.querySelector("i")?.className).toBe("");
  });

  it("shows the person name, uploads an avatar and logs out", async () => {
    const onLogout = vi.fn().mockResolvedValue(undefined);
    const onUploadAvatar = vi.fn().mockResolvedValue(undefined);
    const view = render(<Profile user={{ ...existingUser, role: "admin" }} {...props} onLogout={onLogout} onUploadAvatar={onUploadAvatar} />);

    expect(view.getByText("Павел")).toBeTruthy();
    expect(view.getByText("Роль: admin")).toBeTruthy();
    fireEvent.change(view.getByLabelText("Загрузить аватар"), {
      target: { files: [new File(["avatar"], "avatar.png", { type: "image/png" })] },
    });
    await waitFor(() => expect(onUploadAvatar).toHaveBeenCalled());
    fireEvent.click(view.getByRole("button", { name: "Выйти" }));
    await waitFor(() => expect(onLogout).toHaveBeenCalledTimes(1));
  });
});
