import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Legal } from "./Legal";

const publicSettings = { legal_name: "ООО «Тест»", legal_inn: "123", legal_ogrn: "456", contact_address: "Тестовый адрес", contact_email: "test@example.test", contact_phone: "+7 000" };

describe("Legal", () => {
  it("uses public settings for operator details and does not render former placeholder text", () => {
    render(<Legal kind="privacy" onBack={() => undefined} publicSettings={publicSettings} />);

    const operator = screen.getByText("Оператор Платформы").parentElement?.textContent;
    expect(operator).toContain("ООО «Тест»");
    expect(operator).toContain("ИНН: 123");
    expect(operator).toContain("ОГРН: 456");
    expect(screen.queryByText(/ИП Иванова/)).toBeNull();
    expect(screen.queryByText(/Москва, ул\. Примерная/)).toBeNull();
  });
});
