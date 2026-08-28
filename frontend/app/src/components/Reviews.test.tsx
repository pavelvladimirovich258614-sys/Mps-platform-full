import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Reviews } from "./Reviews";
import { useReviews } from "../hooks";

vi.mock("../hooks", () => ({ useReviews: vi.fn() }));

const mockedUseReviews = vi.mocked(useReviews);
const review = { id: 42, author_name: "Анна", rating: 5, body: "Спасибо за путешествие", photo_url: null, status: "pending" };

function installReviews(overrides: Record<string, unknown> = {}) {
  const resource = {
    value: [], loading: false, error: "", reload: vi.fn(), create: vi.fn().mockResolvedValue(review),
    pending: [], pendingLoading: false, pendingError: "", reloadPending: vi.fn(), moderate: vi.fn(),
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
    await waitFor(() => expect(screen.getByText("На проверке")).toBeTruthy());
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
});
