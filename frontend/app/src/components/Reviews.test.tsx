import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Reviews } from "./Reviews";
import { useReviews } from "../hooks";
import { apiForm } from "../api/client";

vi.mock("../hooks", () => ({ useReviews: vi.fn() }));
vi.mock("../api/client", () => ({ apiForm: vi.fn() }));

const mockedUseReviews = vi.mocked(useReviews);
const mockedApiForm = vi.mocked(apiForm);
const review = { id: 42, author_name: "Анна", rating: 5, body: "Спасибо за путешествие", photo_url: null, photo_urls: [], status: "pending" };

function installReviews(overrides: Record<string, unknown> = {}) {
  const resource = {
    value: [], loading: false, error: "", reload: vi.fn(), create: vi.fn().mockResolvedValue(review),
    pending: [], pendingLoading: false, pendingError: "", reloadPending: vi.fn(), moderate: vi.fn(),
    mine: [], mineLoading: false, mineError: "", reloadMine: vi.fn(),
    ...overrides,
  };
  mockedUseReviews.mockReturnValue(resource as unknown as ReturnType<typeof useReviews>);
  return resource;
}

function renderReviews(canModerate = false) {
  return render(<Reviews canModerate={canModerate} onError={vi.fn()} onPrivacy={vi.fn()} />);
}

describe("Reviews", () => {
  beforeEach(() => vi.clearAllMocks());

  it("submits a review only once while the first request is pending", async () => {
    let resolveCreate!: (value: typeof review) => void;
    const create = vi.fn(() => new Promise<typeof review>((resolve) => { resolveCreate = resolve; }));
    installReviews({ create });
    renderReviews();

    fireEvent.change(screen.getByPlaceholderText("Как вас зовут"), { target: { value: "Анна" } });
    fireEvent.change(screen.getByPlaceholderText("Что понравилось, что нет — по-честному"), { target: { value: "Всё понравилось" } });
    fireEvent.click(screen.getByRole("checkbox"));
    const submit = screen.getByRole("button", { name: "Отправить" });
    fireEvent.click(submit);
    fireEvent.click(submit);

    expect(create).toHaveBeenCalledTimes(1);
    expect((submit as HTMLButtonElement).disabled).toBe(true);
    resolveCreate(review);
    await waitFor(() => expect((screen.getByPlaceholderText("Как вас зовут") as HTMLInputElement).value).toBe(""));
  });

  it("keeps load failure distinct from an empty public list and retries it", () => {
    const resource = installReviews({ error: "Список отзывов недоступен" });
    renderReviews();

    expect(screen.getByRole("alert").textContent).toContain("Список отзывов недоступен");
    expect(screen.queryByText("Отзывов пока нет.")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));
    expect(resource.reload).toHaveBeenCalledTimes(1);
  });

  it("shows an explicit empty public list", () => {
    installReviews();
    renderReviews();

    expect(screen.getByText("Отзывов пока нет.")).toBeTruthy();
  });

  it("keeps the form values and exposes a retry after submit failure", async () => {
    installReviews({ create: vi.fn().mockRejectedValue(new Error("Не удалось отправить отзыв")) });
    renderReviews();

    fireEvent.change(screen.getByPlaceholderText("Как вас зовут"), { target: { value: "Анна" } });
    fireEvent.change(screen.getByPlaceholderText("Что понравилось, что нет — по-честному"), { target: { value: "Всё понравилось" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Отправить" }));

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect((screen.getByPlaceholderText("Как вас зовут") as HTMLInputElement).value).toBe("Анна");
    expect((screen.getByPlaceholderText("Что понравилось, что нет — по-честному") as HTMLTextAreaElement).value).toBe("Всё понравилось");
    expect(screen.getByRole("button", { name: "Повторить" })).toBeTruthy();
  });

  it("shows the editor moderation queue and removes an approved review", async () => {
    const resource = installReviews({ pending: [review], moderate: vi.fn().mockResolvedValue(undefined) });
    renderReviews(true);

    expect(screen.getByRole("heading", { name: "Отзывы на модерации" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Одобрить отзыв Анна" }));
    await waitFor(() => expect(resource.moderate).toHaveBeenCalledWith(42, "approve"));
  });

  it("uploads no more than two photos, previews them and submits their URLs", async () => {
    const create = vi.fn().mockResolvedValue({ ...review, photo_url: "/media/one.webp", photo_urls: ["/media/one.webp", "/media/two.webp"] });
    mockedApiForm.mockResolvedValueOnce({ url: "/media/one.webp" }).mockResolvedValueOnce({ url: "/media/two.webp" });
    installReviews({ create });
    renderReviews();

    const input = screen.getByLabelText("Добавить фотографии к отзыву");
    fireEvent.change(input, { target: { files: [new File(["one"], "one.webp", { type: "image/webp" }), new File(["two"], "two.webp", { type: "image/webp" }), new File(["three"], "three.webp", { type: "image/webp" })] } });

    await waitFor(() => expect(mockedApiForm).toHaveBeenCalledTimes(2));
    expect(screen.getByRole("img", { name: "Фото отзыва 1" }).getAttribute("src")).toBe("/media/one.webp");
    expect(screen.getByRole("img", { name: "Фото отзыва 2" }).getAttribute("src")).toBe("/media/two.webp");
    fireEvent.change(screen.getByPlaceholderText("Как вас зовут"), { target: { value: "Анна" } });
    fireEvent.change(screen.getByPlaceholderText("Что понравилось, что нет — по-честному"), { target: { value: "Всё понравилось" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Отправить" }));

    await waitFor(() => expect(create).toHaveBeenCalledWith({ author_name: "Анна", body: "Всё понравилось", rating: 5, photo_urls: ["/media/one.webp", "/media/two.webp"] }));
  });

  it("limits review text to 1000 characters and displays a counter", () => {
    installReviews();
    renderReviews();

    const textarea = screen.getByPlaceholderText("Что понравилось, что нет — по-честному") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "а".repeat(1000) } });

    expect(textarea.maxLength).toBe(1000);
    expect(screen.getByText("1000 / 1000")).toBeTruthy();
  });

  it("shows persisted own reviews and their moderation statuses", () => {
    installReviews({ mine: [
      { ...review, photo_url: "/media/sea.webp", photo_urls: ["/media/sea.webp"], status: "pending" },
      { ...review, id: 43, author_name: "Илья", body: "Не опубликован", status: "rejected" },
    ] });
    renderReviews();

    expect(screen.getByRole("heading", { name: "Мои отзывы" })).toBeTruthy();
    expect(screen.getByText("На модерации")).toBeTruthy();
    expect(screen.getAllByText("Не опубликован").length).toBeGreaterThan(0);
    expect(screen.getByRole("img", { name: "Фото отзыва Анна 1" }).getAttribute("src")).toBe("/media/sea.webp");
  });
});
