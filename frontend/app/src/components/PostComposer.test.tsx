import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PostComposer } from "./PostComposer";

describe("PostComposer", () => {
  it("is an editor-only publishing surface that submits TipTap HTML", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<PostComposer onCreate={onCreate} />);

    fireEvent.change(screen.getByLabelText("Заголовок публикации"), { target: { value: "Мой маршрут" } });
    fireEvent.input(screen.getByRole("textbox", { name: "Текст публикации" }), { target: { innerHTML: "<p><strong>Готово</strong></p>" } });
    fireEvent.click(screen.getByRole("button", { name: "Опубликовать" }));

    await Promise.resolve();
    expect(onCreate).toHaveBeenCalledWith({ title: "Мой маршрут", type: "article", body: "<p><strong>Готово</strong></p>", status: "published" });
  });
});
