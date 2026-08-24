import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./RichTextEditor", () => ({
  RichTextEditor: ({ onChange }: { onChange: (html: string) => void }) => <button type="button" onClick={() => onChange("<p><strong>Готово</strong></p>")}>Заполнить текст публикации</button>,
}));

const mocks = vi.hoisted(() => ({ upload: vi.fn() }));

vi.mock("../api/client", () => ({ apiForm: mocks.upload }));

import { PostComposer } from "./PostComposer";

describe("PostComposer", () => {
  it("uploads a separately selected cover and submits its URL outside the article body", async () => {
    mocks.upload.mockResolvedValue({ url: "/media/cover.webp" });
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<PostComposer onCreate={onCreate} />);

    fireEvent.click(screen.getByRole("button", { name: "Выбрать обложку" }));
    fireEvent.change(screen.getByLabelText("Выбрать файл обложки"), { target: { files: [new File(["cover"], "cover.webp", { type: "image/webp" })] } });

    await waitFor(() => expect(mocks.upload).toHaveBeenCalledWith("/media", "POST", expect.any(FormData)));
    expect(screen.getByRole("img", { name: "Предпросмотр обложки" }).getAttribute("src")).toBe("/media/cover.webp");
    fireEvent.change(screen.getByLabelText("Заголовок публикации"), { target: { value: "Мой маршрут" } });
    fireEvent.click(screen.getByRole("button", { name: "Заполнить текст публикации" }));
    fireEvent.click(screen.getByRole("button", { name: "Опубликовать" }));

    await waitFor(() => expect(onCreate).toHaveBeenCalledWith({ title: "Мой маршрут", type: "article", body: "<p><strong>Готово</strong></p>", status: "published", cover_url: "/media/cover.webp" }));
  });

  it("prefills the saved cover in edit mode", () => {
    render(<PostComposer initialPost={{ id: 17, title: "Гид по Бали", type: "article", body: "<p>Большой материал</p>", status: "published", cover_url: "/media/saved-cover.webp" }} onUpdate={vi.fn()} />);

    expect(screen.getByRole("img", { name: "Предпросмотр обложки" }).getAttribute("src")).toBe("/media/saved-cover.webp");
  });

  it("is an editor-only publishing surface that submits TipTap HTML", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<PostComposer onCreate={onCreate} />);

    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.queryByText("Тип публикации")).toBeNull();
    fireEvent.change(screen.getByLabelText("Заголовок публикации"), { target: { value: "Мой маршрут" } });
    fireEvent.click(screen.getByRole("button", { name: "Заполнить текст публикации" }));
    fireEvent.click(screen.getByRole("button", { name: "Опубликовать" }));

    await Promise.resolve();
    expect(onCreate).toHaveBeenCalledWith({ title: "Мой маршрут", type: "article", body: "<p><strong>Готово</strong></p>", status: "published" });
  });

  it("prefills an existing article and saves changes instead of publishing a new post", async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(<PostComposer initialPost={{ id: 17, title: "Гид по Бали", type: "article", body: "<p>Большой материал</p>", status: "published" }} onUpdate={onUpdate} />);

    expect((screen.getByLabelText("Заголовок публикации") as HTMLInputElement).value).toBe("Гид по Бали");
    expect(screen.getByRole("button", { name: "Сохранить изменения" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Заголовок публикации"), { target: { value: "Обновлённый гид" } });
    fireEvent.click(screen.getByRole("button", { name: "Заполнить текст публикации" }));
    fireEvent.click(screen.getByRole("button", { name: "Сохранить изменения" }));

    await Promise.resolve();
    expect(onUpdate).toHaveBeenCalledWith({ title: "Обновлённый гид", type: "article", body: "<p><strong>Готово</strong></p>", status: "published" });
  });

  it("keeps the id of a newly saved draft so the next save patches that draft", async () => {
    const onCreate = vi.fn().mockResolvedValue({ id: 24, title: "Черновик", type: "article", body: "<p><strong>Готово</strong></p>", status: "draft" });
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(<PostComposer onCreate={onCreate} onUpdate={onUpdate} />);

    fireEvent.change(screen.getByLabelText("Заголовок публикации"), { target: { value: "Черновик" } });
    fireEvent.click(screen.getByRole("button", { name: "Заполнить текст публикации" }));
    fireEvent.click(screen.getByRole("button", { name: "Сохранить черновик" }));
    await Promise.resolve();

    fireEvent.change(screen.getByLabelText("Заголовок публикации"), { target: { value: "Обновлённый черновик" } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить черновик" }));
    await Promise.resolve();

    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith({ title: "Обновлённый черновик", type: "article", body: "<p><strong>Готово</strong></p>", status: "draft" });

    const publish = screen.getByRole("button", { name: "Опубликовать" }) as HTMLButtonElement;
    await waitFor(() => expect(publish.disabled).toBe(false));
    fireEvent.click(publish);
    await waitFor(() => expect(onUpdate).toHaveBeenLastCalledWith({ title: "Обновлённый черновик", type: "article", body: "<p><strong>Готово</strong></p>", status: "published" }));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it.each(["Сохранить черновик", "Опубликовать"])("closes only after a successful %s create request", async (action) => {
    const onCreate = vi.fn().mockResolvedValue(action === "Сохранить черновик" ? { id: 24, title: "Черновик", type: "article", body: "<p><strong>Готово</strong></p>", status: "draft" } : undefined);
    const onClose = vi.fn();
    render(<PostComposer onCreate={onCreate} onClose={onClose} />);

    fireEvent.change(screen.getByLabelText("Заголовок публикации"), { target: { value: "Материал" } });
    fireEvent.click(screen.getByRole("button", { name: "Заполнить текст публикации" }));
    fireEvent.click(screen.getByRole("button", { name: action }));

    await waitFor(() => expect(onCreate).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("keeps the composer open when its save request fails", async () => {
    const onCreate = vi.fn().mockRejectedValue(new Error("Сервер недоступен"));
    const onClose = vi.fn();
    render(<PostComposer onCreate={onCreate} onClose={onClose} />);

    fireEvent.change(screen.getByLabelText("Заголовок публикации"), { target: { value: "Материал" } });
    fireEvent.click(screen.getByRole("button", { name: "Заполнить текст публикации" }));
    fireEvent.click(screen.getByRole("button", { name: "Опубликовать" }));

    await waitFor(() => expect(onCreate).toHaveBeenCalled());
    await Promise.resolve();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Создать публикацию" })).toBeTruthy();
    expect(screen.getByText("Сервер недоступен")).toBeTruthy();
  });

  it("closes after a successful PATCH of an existing draft or article", async () => {
    const onUpdate = vi.fn().mockResolvedValue({ id: 17, title: "Черновик", type: "article", body: "<p><strong>Готово</strong></p>", status: "draft" });
    const onClose = vi.fn();
    render(<PostComposer initialPost={{ id: 17, title: "Черновик", type: "article", body: "<p>Текст</p>", status: "draft" }} onUpdate={onUpdate} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Заполнить текст публикации" }));
    fireEvent.click(screen.getByRole("button", { name: "Сохранить черновик" }));

    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
