import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import "../styles.css";
import { QA } from "./QA";

const mocks = vi.hoisted(() => ({ create: vi.fn(), askIrishka: vi.fn() }));

vi.mock("../hooks", () => ({
  useQA: () => ({ value: [], loading: false, create: mocks.create, askIrishka: mocks.askIrishka }),
}));

describe("QA composer footer", () => {
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
});
