import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RichTextEditor } from "./RichTextEditor";

describe("RichTextEditor", () => {
  it("exposes the approved base formatting controls and emits HTML", () => {
    const onChange = vi.fn();
    render(<RichTextEditor value="<p>Черновик</p>" onChange={onChange} />);

    expect(screen.getByRole("button", { name: "Жирный" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Курсив" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Зачёркнутый" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Заголовок 1" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Маркированный список" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Нумерованный список" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Ссылка" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Цитата" })).toBeTruthy();

    fireEvent.input(screen.getByRole("textbox"), { target: { innerHTML: "<p>Новый текст</p>" } });
    expect(onChange).toHaveBeenCalledWith("<p>Новый текст</p>");
  });
});
