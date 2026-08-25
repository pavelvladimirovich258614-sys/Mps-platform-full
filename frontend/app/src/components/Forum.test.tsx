import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Forum } from "./Forum";

const response = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });

function installForumApi() {
  const fetchMock = vi.fn<typeof fetch>(async (input) => {
    const url = new URL(String(input));
    if (url.pathname === "/api/v1/countries") return response([{ id: 1, name: "ОАЭ", topics_count: 3 }]);
    if (url.pathname === "/api/v1/countries/1/topics") {
      return response(url.searchParams.has("cursor")
        ? { items: [{ id: 1, title: "Первая тема", messages_count: 0 }], next_cursor: null }
        : { items: [{ id: 3, title: "Третья тема", messages_count: 0 }, { id: 2, title: "Вторая тема", messages_count: 2 }], next_cursor: "topic-page-2" });
    }
    if (url.pathname === "/api/v1/topics/2/messages") {
      return response(url.searchParams.has("cursor")
        ? { items: [{ id: 1, body: "Первое сообщение", author: { id: 7, name: "Мария", avatar_url: null }, is_ai: false }], next_cursor: null }
        : { items: [{ id: 3, body: "Третье сообщение", author: { id: 7, name: "Мария", avatar_url: null }, is_ai: false }, { id: 2, body: "Второе сообщение", author: { id: 7, name: "Мария", avatar_url: null }, is_ai: false }], next_cursor: "message-page-2" });
    }
    if (url.pathname === "/api/v1/me" || url.pathname === "/api/v1/auth/refresh") return new Response(JSON.stringify({ detail: "Требуется авторизация" }), { status: 401 });
    throw new Error(`Unexpected API request: ${url.pathname}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("Forum pagination", () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it("accumulates topic pages and removes the control at the end", async () => {
    const fetchMock = installForumApi();
    render(<Forum page="countries" initialCountryId={1} onNavigate={vi.fn()} onCountryNavigate={vi.fn()} onError={vi.fn()} />);

    expect(await screen.findByRole("heading", { name: /Темы:\s*ОАЭ/ })).toBeTruthy();
    expect(await screen.findByText("Третья тема")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Показать ещё" }));

    expect(await screen.findByText("Первая тема")).toBeTruthy();
    await waitFor(() => expect(screen.queryByRole("button", { name: "Показать ещё" })).toBeNull());
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes("/countries/1/topics?cursor=topic-page-2"))).toBe(true);
  });

  it("accumulates message pages and removes the control at the end", async () => {
    installForumApi();
    const { rerender } = render(<Forum page="countries" initialCountryId={1} onNavigate={vi.fn()} onCountryNavigate={vi.fn()} onError={vi.fn()} />);

    fireEvent.click(await screen.findByRole("button", { name: /Вторая тема/ }));
    rerender(<Forum page="topic" initialCountryId={1} onNavigate={vi.fn()} onCountryNavigate={vi.fn()} onError={vi.fn()} />);
    expect(await screen.findByText("Третье сообщение")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Показать ещё" }));

    expect(await screen.findByText("Первое сообщение")).toBeTruthy();
    await waitFor(() => expect(screen.queryByRole("button", { name: "Показать ещё" })).toBeNull());
  });
});
