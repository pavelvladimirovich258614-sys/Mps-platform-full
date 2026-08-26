import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import "../styles.css";
import type { Question } from "../hooks";
import { QA } from "./QA";

const mocks = vi.hoisted(() => ({ create: vi.fn(), askIrishka: vi.fn(), archive: vi.fn(), value: [] as Question[] }));

vi.mock("../hooks", () => ({
  useQA: () => ({ value: mocks.value, loading: false, create: mocks.create, askIrishka: mocks.askIrishka, archive: mocks.archive }),
}));

describe("QA composer footer", () => {
  beforeEach(() => {
    mocks.create.mockReset();
    mocks.askIrishka.mockReset();
    mocks.archive.mockReset();
    mocks.value = [];
  });

  it("keeps a full-size question field and usable consent controls in every tab", () => {
    const onPrivacy = vi.fn();
    const { container } = render(<QA onClose={vi.fn()} onError={vi.fn()} onPrivacy={onPrivacy} />);

    for (const tab of [
      ["Менеджер", "Спросить менеджера…", "Отпр."],
      ["Юрист", "Задать вопрос юристу…", "Отпр."],
      ["Иришка ИИ", "Спросить Иришку…", "Спросить"],
    ]) {
      fireEvent.click(screen.getByRole("button", { name: tab[0] }));

      const textarea = screen.getByPlaceholderText(tab[1]) as HTMLTextAreaElement;
      const footer = textarea.closest("footer") as HTMLElement;
      const consent = screen.getByRole("checkbox");
      const policy = screen.getByRole("button", { name: "политикой обработки данных" });
      const submit = screen.getByRole("button", { name: tab[2] });
      const style = getComputedStyle(textarea);

      expect(footer.classList.contains("qa-composer")).toBe(true);
      expect(textarea.classList.contains("qa-composer-input")).toBe(true);
      expect(style.width).toBe("100%");
      expect(style.minWidth).toBe("0");
      expect(style.minHeight).toBe("96px");
      expect(consent.closest("label")?.classList.contains("qa-consent")).toBe(true);
      expect(policy.classList.contains("qa-policy-link")).toBe(true);
      expect(submit.classList.contains("qa-composer-submit")).toBe(true);
      expect(container.contains(consent) && container.contains(policy) && container.contains(submit)).toBe(true);
    }

    fireEvent.click(screen.getByRole("button", { name: "политикой обработки данных" }));
    expect(onPrivacy).toHaveBeenCalledTimes(1);
  });

  it("shows the local acknowledgement only after a manager or lawyer question is sent", async () => {
    mocks.create.mockResolvedValue({ id: 71, target: "manager", body: "Нужна помощь", status: "open", answer: null });
    render(<QA onClose={vi.fn()} onError={vi.fn()} onPrivacy={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("Спросить менеджера…"), { target: { value: "Нужна помощь" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Отпр." }));

    expect(await screen.findByText("Спасибо за ваш вопрос! Следите за уведомлениями — когда придёт ответ, нажмите на уведомление, чтобы его увидеть.")).toBeTruthy();
    expect(mocks.create).toHaveBeenCalledWith("manager", "Нужна помощь");

    fireEvent.click(screen.getByRole("button", { name: "Иришка ИИ" }));
    expect(screen.queryByText("Спасибо за ваш вопрос! Следите за уведомлениями — когда придёт ответ, нажмите на уведомление, чтобы его увидеть.")).toBeNull();
  });

  it("renders an agency answer as a visually distinct incoming message", () => {
    mocks.value = [{ id: 72, target: "manager", body: "Вопрос", status: "answered", answer: "Ответ менеджера" }];
    render(<QA onClose={vi.fn()} onError={vi.fn()} onPrivacy={vi.fn()} />);

    const question = screen.getByText("Вопрос");
    const answer = screen.getByText("Ответ менеджера");
    expect(answer.closest(".qa-answer")).toBeTruthy();
    expect(question.closest(".mine")).toBeTruthy();
    const rootStyle = getComputedStyle(document.documentElement);
    expect(rootStyle.getPropertyValue("--qa-answer-bg").trim()).not.toBe(rootStyle.getPropertyValue("--accent").trim());
    expect(rootStyle.getPropertyValue("--qa-answer-text").trim()).not.toBe("");
  });

  it("archives history only after confirmation and removes it from the modal", async () => {
    mocks.value = [{ id: 73, target: "manager", body: "Старый вопрос", status: "answered", answer: "Старый ответ" }];
    mocks.archive.mockImplementation(async () => { mocks.value = []; });
    render(<QA onClose={vi.fn()} onError={vi.fn()} onPrivacy={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Очистить историю" }));
    expect(screen.getByRole("dialog", { name: "Очистить историю" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Отмена" }));
    expect(mocks.archive).not.toHaveBeenCalled();
    expect(screen.getByText("Старый вопрос")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Очистить историю" }));
    fireEvent.click(screen.getByRole("button", { name: "Подтвердить очистку" }));
    await waitFor(() => expect(mocks.archive).toHaveBeenCalledTimes(1));
    expect(screen.queryByText("Старый вопрос")).toBeNull();
  });
});
