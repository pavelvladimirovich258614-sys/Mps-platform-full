import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./RichTextEditor", () => ({
  RichTextEditor: ({ onChange }: { onChange: (html: string) => void }) => <button type="button" onClick={() => onChange("<p><strong>Готово</strong></p>")}>Заполнить текст публикации</button>,
}));

import { PostComposer } from "./PostComposer";

describe("PostComposer", () => {
  it("is an editor-only publishing surface that submits TipTap HTML", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<PostComposer onCreate={onCreate} />);

    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["Статья"]);
    expect(screen.queryByRole("option", { name: "Фишка" })).toBeNull();
    fireEvent.change(screen.getByLabelText("Заголовок публикации"), { target: { value: "Мой маршрут" } });
    fireEvent.click(screen.getByRole("button", { name: "Заполнить текст публикации" }));
    fireEvent.click(screen.getByRole("button", { name: "Опубликовать" }));

    await Promise.resolve();
    expect(onCreate).toHaveBeenCalledWith({ title: "Мой маршрут", type: "article", body: "<p><strong>Готово</strong></p>", status: "published" });
  });
});
