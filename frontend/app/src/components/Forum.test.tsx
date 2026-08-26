import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Forum } from "./Forum";

const response = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });

function installForumApi() {
  const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
    const url = new URL(String(input));
    if (url.pathname === "/api/v1/countries") return response([{ id: 1, name: "ОАЭ", topics_count: 3 }]);
    if (url.pathname === "/api/v1/countries/1/topics") {
      return response(url.searchParams.has("cursor")
        ? { items: [{ id: 1, title: "Первая тема", author_id: 7, messages_count: 0 }], next_cursor: null }
        : { items: [{ id: 3, title: "Третья тема", author_id: 7, messages_count: 0 }, { id: 2, title: "Вторая тема", author_id: 8, messages_count: 2 }], next_cursor: "topic-page-2" });
    }
    if (url.pathname === "/api/v1/topics/2/messages") {
      return response(url.searchParams.has("cursor")
        ? { items: [{ id: 1, body: "Первое сообщение", author: { id: 7, name: "Мария", avatar_url: null }, is_ai: false }], next_cursor: null }
        : { items: [{ id: 3, body: "Третье сообщение", author: { id: 7, name: "Мария", avatar_url: null }, is_ai: false }, { id: 2, body: "Второе сообщение", author: { id: 7, name: "Мария", avatar_url: null }, is_ai: false }], next_cursor: "message-page-2" });
    }
    if (url.pathname === "/api/v1/topics/3" && init?.method === "DELETE") return new Response(null, { status: 204 });
    if (url.pathname === "/api/v1/messages/3" && init?.method === "DELETE") return new Response(null, { status: 204 });
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

    expect(await screen.findByRole("heading", { name: "Страны — Форум" })).toBeTruthy();
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
    expect(await screen.findByRole("button", { name: "← Форум стран" })).toBeTruthy();
    expect(await screen.findByText("Третье сообщение")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Показать ещё" }));

    expect(await screen.findByText("Первое сообщение")).toBeTruthy();
    await waitFor(() => expect(screen.queryByRole("button", { name: "Показать ещё" })).toBeNull());
  });

  it("shows deletion only to a topic author or administrator", async () => {
    installForumApi();
    const props = { page: "countries" as const, initialCountryId: 1, onNavigate: vi.fn(), onCountryNavigate: vi.fn(), onError: vi.fn() };
    const { rerender } = render(<Forum {...props} viewer={{ id: 7, email: null, name: "Автор", avatar_url: null, bio: null, role: "reader", is_anonymous: false }} />);

    expect(await screen.findByRole("button", { name: "Удалить тему: Третья тема" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Удалить тему: Вторая тема" })).toBeNull();

    rerender(<Forum {...props} viewer={{ id: 9, email: null, name: "Гость", avatar_url: null, bio: null, role: "reader", is_anonymous: false }} />);
    expect(screen.queryByRole("button", { name: /Удалить тему:/ })).toBeNull();

    rerender(<Forum {...props} viewer={{ id: 9, email: null, name: "Администратор", avatar_url: null, bio: null, role: "admin", is_anonymous: false }} />);
    expect(await screen.findAllByRole("button", { name: /Удалить тему:/ })).toHaveLength(2);
  });

  it("shows message deletion only to its author or administrator", async () => {
    installForumApi();
    const props = { initialCountryId: 1, onNavigate: vi.fn(), onCountryNavigate: vi.fn(), onError: vi.fn() };
    const { rerender } = render(<Forum {...props} page="countries" viewer={{ id: 7, email: null, name: "Автор", avatar_url: null, bio: null, role: "reader", is_anonymous: false }} />);

    fireEvent.click(await screen.findByRole("button", { name: /Вторая тема/ }));
    rerender(<Forum {...props} page="topic" viewer={{ id: 7, email: null, name: "Автор", avatar_url: null, bio: null, role: "reader", is_anonymous: false }} />);
    expect(await screen.findByRole("button", { name: "Удалить сообщение: Третье сообщение" })).toBeTruthy();

    rerender(<Forum {...props} page="topic" viewer={{ id: 9, email: null, name: "Гость", avatar_url: null, bio: null, role: "reader", is_anonymous: false }} />);
    expect(screen.queryByRole("button", { name: /Удалить сообщение:/ })).toBeNull();

    rerender(<Forum {...props} page="topic" viewer={{ id: 9, email: null, name: "Администратор", avatar_url: null, bio: null, role: "admin", is_anonymous: false }} />);
    expect(await screen.findAllByRole("button", { name: /Удалить сообщение:/ })).toHaveLength(2);
  });

  it("requires confirmation before deleting a topic and a message", async () => {
    const fetchMock = installForumApi();
    const props = { initialCountryId: 1, onNavigate: vi.fn(), onCountryNavigate: vi.fn(), onError: vi.fn(), viewer: { id: 7, email: null, name: "Автор", avatar_url: null, bio: null, role: "reader", is_anonymous: false } };
    const { rerender } = render(<Forum {...props} page="countries" />);

    fireEvent.click(await screen.findByRole("button", { name: "Удалить тему: Третья тема" }));
    expect(screen.getByRole("dialog", { name: "Удалить тему" })).toBeTruthy();
    expect(fetchMock.mock.calls.some(([input, init]) => String(input).endsWith("/topics/3") && init?.method === "DELETE")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Подтвердить удаление" }));
    await waitFor(() => expect(screen.queryByText("Третья тема")).toBeNull());
    expect(fetchMock.mock.calls.some(([input, init]) => String(input).endsWith("/topics/3") && init?.method === "DELETE")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: /Вторая тема/ }));
    rerender(<Forum {...props} page="topic" />);
    fireEvent.click(await screen.findByRole("button", { name: "Удалить сообщение: Третье сообщение" }));
    expect(screen.getByRole("dialog", { name: "Удалить сообщение" })).toBeTruthy();
    expect(fetchMock.mock.calls.some(([input, init]) => String(input).endsWith("/messages/3") && init?.method === "DELETE")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Подтвердить удаление" }));
    await waitFor(() => expect(screen.queryByText("Третье сообщение")).toBeNull());
    expect(fetchMock.mock.calls.some(([input, init]) => String(input).endsWith("/messages/3") && init?.method === "DELETE")).toBe(true);
  });
});
