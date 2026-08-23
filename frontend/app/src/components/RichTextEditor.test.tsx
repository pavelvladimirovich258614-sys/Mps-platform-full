import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ upload: vi.fn() }));

vi.mock("../api/client", () => ({ apiForm: mocks.upload }));

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
    expect(screen.getByRole("button", { name: "Вставить изображение" })).toBeTruthy();

    expect(onChange).not.toHaveBeenCalled();
  });

  it("uploads an image and inserts its media URL into the TipTap document", async () => {
    mocks.upload.mockResolvedValue({ url: "/media/sea.webp" });
    const onChange = vi.fn();
    render(<RichTextEditor value="<p>Черновик</p>" onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Выбрать изображение"), {
      target: { files: [new File(["image"], "sea.webp", { type: "image/webp" })] },
    });

    await waitFor(() => expect(mocks.upload).toHaveBeenCalled());
    expect(mocks.upload).toHaveBeenCalledWith("/media", "POST", expect.any(FormData));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(expect.stringContaining('src="/media/sea.webp"')));
  });

  it("shows an upload error and keeps the editor usable", async () => {
    mocks.upload.mockRejectedValue(new Error("Файл превышает 10 МБ"));
    render(<RichTextEditor value="<p>Черновик</p>" onChange={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Выбрать изображение"), {
      target: { files: [new File(["bad"], "large.jpg", { type: "image/jpeg" })] },
    });

    expect((await screen.findByRole("alert")).textContent).toContain("Файл превышает 10 МБ");
    expect(screen.getByRole("textbox", { name: "Текст публикации" })).toBeTruthy();
  });
});
