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
    const imageButton = screen.getByRole("button", { name: "Вставить изображение" });
    expect(imageButton.querySelector("svg")).not.toBeNull();
    expect(imageButton.textContent).not.toContain("▧");

    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders a stored carousel as one interactive editor slide", async () => {
    render(
      <RichTextEditor
        value={'<p>До карусели</p><figure data-carousel="images"><img src="/media/one.webp" alt="Первое"><img src="/media/two.webp" alt="Второе"></figure><p>После карусели</p>'}
        onChange={vi.fn()}
      />,
    );

    expect(await screen.findByRole("region", { name: "Карусель изображений" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Первое" })).toBeTruthy();
    expect(screen.queryByRole("img", { name: "Второе" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Следующее изображение" }));
    expect(screen.getByRole("img", { name: "Второе" }).getAttribute("src")).toBe("/media/two.webp");
  });

  it("removes one standalone image without changing surrounding text", async () => {
    const onChange = vi.fn();
    render(
      <RichTextEditor
        value={'<p>Текст до</p><img src="/media/sea.webp" alt="Море"><p>Текст после</p>'}
        onChange={onChange}
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Удалить изображение: Море" }));

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const html = onChange.mock.calls.at(-1)?.[0] as string;
    expect(html).toContain("Текст до");
    expect(html).toContain("Текст после");
    expect(html).not.toContain("/media/sea.webp");
  });

  it("unwraps a two-image carousel when the active image is removed", async () => {
    const onChange = vi.fn();
    render(
      <RichTextEditor
        value={'<p>До</p><figure data-carousel="images"><img src="/media/one.webp" alt="Первое"><img src="/media/two.webp" alt="Второе"></figure><p>После</p>'}
        onChange={onChange}
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Удалить изображение: Первое" }));

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const html = onChange.mock.calls.at(-1)?.[0] as string;
    expect(html).not.toContain("<figure");
    expect(html).not.toContain("/media/one.webp");
    expect(html).toContain('src="/media/two.webp"');
    expect(html).toContain("До");
    expect(html).toContain("После");
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

  it("groups two consecutive uploaded images into the carousel node but keeps one image ordinary", async () => {
    mocks.upload.mockResolvedValueOnce({ url: "/media/one.webp" }).mockResolvedValueOnce({ url: "/media/two.webp" }).mockResolvedValueOnce({ url: "/media/three.webp" });
    const onChange = vi.fn();
    render(<RichTextEditor value="<p>Черновик</p>" onChange={onChange} />);
    const input = screen.getByLabelText("Выбрать изображение");

    fireEvent.change(input, { target: { files: [new File(["one"], "one.webp", { type: "image/webp" })] } });
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(expect.stringContaining('src="/media/one.webp"')));
    expect(onChange.mock.calls.at(-1)?.[0]).not.toContain("<figure");

    fireEvent.change(input, { target: { files: [new File(["two"], "two.webp", { type: "image/webp" })] } });
    await waitFor(() => expect(onChange.mock.calls.at(-1)?.[0]).toContain('<figure data-carousel="images">'));
    expect(onChange.mock.calls.at(-1)?.[0]).toContain('src="/media/one.webp"');
    expect(onChange.mock.calls.at(-1)?.[0]).toContain('src="/media/two.webp"');

    fireEvent.change(input, { target: { files: [new File(["three"], "three.webp", { type: "image/webp" })] } });
    await waitFor(() => expect(onChange.mock.calls.at(-1)?.[0]).toContain('src="/media/three.webp"'));
    expect(onChange.mock.calls.at(-1)?.[0]).toContain('<figure data-carousel="images">');
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
