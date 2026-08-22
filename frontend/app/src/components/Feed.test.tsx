import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Feed } from "./Feed";

const editorProps = {
  posts: [],
  loading: false,
  canCreate: true,
  onCreatePost: vi.fn().mockResolvedValue(undefined),
  onOpenArticle: vi.fn(),
  onOpenProfile: vi.fn(),
};

describe("Feed composer modal", () => {
  it("keeps the composer out of the initial feed and opens it only by the compact action", () => {
    render(<Feed {...editorProps} />);

    expect(screen.queryByRole("heading", { name: "Создать публикацию" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Создать публикацию" }));

    expect(screen.getByRole("dialog", { name: "Создание публикации" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Создать публикацию" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Текст публикации" })).toBeTruthy();
  });

  it("closes the composer modal on Escape and a backdrop click", () => {
    render(<Feed {...editorProps} />);

    fireEvent.click(screen.getByRole("button", { name: "Создать публикацию" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Создание публикации" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Создать публикацию" }));
    fireEvent.mouseDown(screen.getByLabelText("Закрыть создание публикации"));
    expect(screen.queryByRole("dialog", { name: "Создание публикации" })).toBeNull();
  });
});
