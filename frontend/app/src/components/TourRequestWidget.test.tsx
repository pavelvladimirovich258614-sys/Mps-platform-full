import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useTourRequest } from "../hooks";
import styles from "../styles.css?raw";
import { TourRequestWidget } from "./TourRequestWidget";

vi.mock("../hooks", () => ({ useTourRequest: vi.fn() }));

const submit = vi.fn();
const countries = [
  { id: 1, name: "Таиланд", topics_count: 4 },
  { id: 2, name: "Турция", topics_count: 7 },
];

function mockTourRequest(overrides: Partial<ReturnType<typeof useTourRequest>> = {}) {
  vi.mocked(useTourRequest).mockReturnValue({
    countries,
    countriesLoading: false,
    countriesError: "",
    reloadCountries: vi.fn(),
    submit,
    ...overrides,
  });
}

describe("TourRequestWidget", () => {
  beforeEach(() => {
    submit.mockReset();
  });

  afterEach(() => {
    document.body.style.overflow = "";
    vi.clearAllMocks();
  });

  it("locks the WIDG-1 breakpoint, mobile-nav safe area and reduced-motion contract", () => {
    mockTourRequest();
    const view = render(<TourRequestWidget onOpenPrivacy={vi.fn()} />);

    expect(view.container.querySelector(".tour-request-desktop")).toBeTruthy();
    expect(view.container.querySelector(".tour-request-fab")).toBeTruthy();
    expect(styles).toMatch(/@media \(max-width:767px\)[\s\S]*\.tour-request-desktop\s*{\s*display:none/);
    expect(styles).toMatch(/@media \(max-width:767px\)[\s\S]*\.tour-request-fab\s*{[\s\S]*display:flex/);
    expect(styles).toMatch(/bottom:calc\([^;]*env\(safe-area-inset-bottom\)/);
    expect(styles).toMatch(/@media \(min-width:768px\)[\s\S]*\.tour-request-desktop\s*{[\s\S]*display:/);
    expect(styles).toMatch(/@media \(min-width:768px\)[\s\S]*\.tour-request-fab\s*{\s*display:none/);
    expect(styles).toMatch(/@media \(prefers-reduced-motion:reduce\)/);
  });

  it("opens a fullscreen dialog, traps focus, closes on Escape and restores the opener", async () => {
    mockTourRequest();
    const view = render(<TourRequestWidget onOpenPrivacy={vi.fn()} />);
    const fab = view.container.querySelector(".tour-request-fab") as HTMLButtonElement;

    fab.focus();
    fireEvent.click(fab);

    const dialog = screen.getByRole("dialog", { name: "Подобрать тур" });
    expect(dialog.classList.contains("tour-request-dialog")).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText("Имя")));

    const close = within(dialog).getByRole("button", { name: "Закрыть форму" });
    close.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(screen.getByLabelText("Имя"));

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Подобрать тур" })).toBeNull();
    expect(document.body.style.overflow).toBe("");
    await waitFor(() => expect(document.activeElement).toBe(fab));
  });

  it("keeps destination free-form, renders country hints and submits the consented payload", async () => {
    submit.mockResolvedValueOnce({ id: 41, status: "new", tg_message_id: 51, created_at: "2026-08-30T00:00:00" });
    mockTourRequest();
    const view = render(<TourRequestWidget onOpenPrivacy={vi.fn()} />);
    fireEvent.click(view.container.querySelector(".tour-request-desktop") as HTMLButtonElement);

    const name = screen.getByLabelText("Имя");
    const contact = screen.getByLabelText("Телефон или Telegram");
    const destination = screen.getByLabelText("Направление");
    expect(contact.getAttribute("type")).toBe("tel");
    expect(destination.getAttribute("list")).toBe("tour-request-countries");
    expect(Array.from(document.querySelectorAll("#tour-request-countries option")).map((option) => option.getAttribute("value")))
      .toEqual(["Таиланд", "Турция"]);

    fireEvent.change(name, { target: { value: " Анна " } });
    fireEvent.change(contact, { target: { value: " @anna " } });
    fireEvent.change(destination, { target: { value: "Остров мечты вне списка" } });
    fireEvent.change(screen.getByLabelText("Бюджет (необязательно)"), { target: { value: "до 250 000 ₽" } });
    fireEvent.change(screen.getByLabelText("Комментарий (необязательно)"), { target: { value: "Двое взрослых" } });
    fireEvent.click(screen.getByLabelText(/Согласен на обработку персональных данных/));
    fireEvent.submit(screen.getByRole("form", { name: "Заявка на подбор тура" }));

    await waitFor(() => expect(submit).toHaveBeenCalledWith({
      name: "Анна",
      contact: "@anna",
      destination: "Остров мечты вне списка",
      budget: "до 250 000 ₽",
      comment: "Двое взрослых",
      personal_data_consent: true,
    }));
    expect((await screen.findByRole("status")).textContent).toContain("Заявка отправлена");
  });

  it("shows inline field and consent errors without sending invalid personal data", () => {
    mockTourRequest();
    const view = render(<TourRequestWidget onOpenPrivacy={vi.fn()} />);
    fireEvent.click(view.container.querySelector(".tour-request-fab") as HTMLButtonElement);
    fireEvent.submit(screen.getByRole("form", { name: "Заявка на подбор тура" }));

    expect(screen.getByText("Укажите имя")).toBeTruthy();
    expect(screen.getByText("Укажите телефон или Telegram")).toBeTruthy();
    expect(screen.getByText("Укажите направление")).toBeTruthy();
    expect(screen.getByText("Нужно согласие на обработку персональных данных")).toBeTruthy();
    expect(screen.getByLabelText(/Согласен на обработку персональных данных/).getAttribute("aria-invalid")).toBe("true");
    expect(submit).not.toHaveBeenCalled();
  });

  it("disables the form while sending and exposes a safe inline server error", async () => {
    let rejectRequest: (reason: Error) => void = () => {};
    submit.mockReturnValueOnce(new Promise((_, reject) => { rejectRequest = reject; }));
    mockTourRequest();
    const view = render(<TourRequestWidget onOpenPrivacy={vi.fn()} />);
    fireEvent.click(view.container.querySelector(".tour-request-fab") as HTMLButtonElement);
    fireEvent.change(screen.getByLabelText("Имя"), { target: { value: "Анна" } });
    fireEvent.change(screen.getByLabelText("Телефон или Telegram"), { target: { value: "+79000000000" } });
    fireEvent.change(screen.getByLabelText("Направление"), { target: { value: "Таиланд" } });
    fireEvent.click(screen.getByLabelText(/Согласен на обработку персональных данных/));
    fireEvent.submit(screen.getByRole("form", { name: "Заявка на подбор тура" }));

    await waitFor(() => expect((screen.getByRole("button", { name: "Отправляем…" }) as HTMLButtonElement).disabled).toBe(true));
    rejectRequest(new Error("Сервис временно недоступен"));
    expect((await screen.findByRole("alert")).textContent).toContain("Сервис временно недоступен");
    expect((screen.getByRole("button", { name: "Отправить заявку" }) as HTMLButtonElement).disabled).toBe(false);
  });
});
