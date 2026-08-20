import { render } from "@testing-library/react";
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
  onError: vi.fn(),
};

describe("Profile", () => {
  it("synchronizes existing profile fields when login changes user without unmounting", () => {
    const view = render(<Profile user={null} {...props} />);

    view.rerender(<Profile user={existingUser} {...props} />);

    expect((view.getByPlaceholderText("Имя") as HTMLInputElement).value).toBe("Павел");
    expect((view.getByPlaceholderText("О себе") as HTMLTextAreaElement).value).toBe("Люблю путешествия");
    expect(view.getByText("Показывать меня онлайн").parentElement?.querySelector("i")?.className).toBe("");
  });
});
