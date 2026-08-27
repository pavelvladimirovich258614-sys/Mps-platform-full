import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { About } from "./About";

describe("About", () => {
  it("renders the confirmed agency story and contacts", () => {
    const view = render(<About publicSettings={null} />);
    const text = view.container.textContent ?? "";
    const required = [
      "Официальный партнёр крупнейших туроператоров России",
      "Coral Travel, Coral Travel Elite Service, Anex Tour, TUI",
      "Турагентство «Под солнцем»",
      "2003",
      "корпоративные клиенты",
      "сопровождение спортивных сборов и турниров",
      "у метро Таганская",
      "Адрес: г. Москва, ул. Марксистская, 5К1",
      "Телефон: +7 (495) 21-21-421",
      "Email: coralclub47@mail.ru",
    ];

    expect(required.filter((value) => !text.includes(value))).toEqual([]);
  });

  it("does not render the former placeholder-style copy", () => {
    const view = render(<About publicSettings={null} />);
    const text = view.container.textContent ?? "";

    expect(text).not.toMatch(/lorem ipsum/i);
    expect(text).not.toContain("агентство, которое ездит само");
    expect(text).not.toContain("Половина команды — бывшие гиды и авиаперевозчики");
  });

  it("keeps every rendered link usable", () => {
    render(<About publicSettings={null} />);

    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.getAttribute("href")).toBeTruthy();
      expect(link.getAttribute("href")).not.toBe("#");
    }
  });
});
