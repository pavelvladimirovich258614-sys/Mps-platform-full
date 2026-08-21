import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setAccessToken } from "./api/client";
import { App } from "./App";

const post = {
  id: 17,
  type: "article" as const,
  title: "Гид по Бали",
  slug: "bali-guide",
  body: "Большой материал о путешествии.",
  views: 12,
  likes_count: 3,
  shot_at: null,
};

const jsonResponse = (status: number, body: unknown) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json" },
});

type DetailResult = "ok" | "missing" | "network";

function installApi(detailResult: DetailResult = "ok") {
  const fetchMock = vi.fn<typeof fetch>(async (input) => {
    const path = new URL(String(input)).pathname;
    if (path === "/api/v1/posts/bali-guide") {
      if (detailResult === "missing") return jsonResponse(404, { detail: "Публикация не найдена" });
      if (detailResult === "network") throw new TypeError("Failed to fetch");
      return jsonResponse(200, post);
    }
    if (path === "/api/v1/posts") return jsonResponse(200, [post]);
    if (path === "/api/v1/posts/17/comments") return jsonResponse(200, []);
    if (path === "/api/v1/countries") return jsonResponse(200, [{ id: 1, name: "ОАЭ", topics_count: 0 }]);
    if (path === "/api/v1/countries/1/topics") return jsonResponse(200, []);
    if (path === "/api/v1/online") return jsonResponse(200, []);
    if (path === "/api/v1/notifications") return jsonResponse(200, { items: [] });
    if (path === "/api/v1/me" || path === "/api/v1/auth/refresh") {
      return jsonResponse(401, { detail: "Требуется авторизация" });
    }
    throw new Error(`Unexpected API request: ${path}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("App pathname routing", () => {
  beforeEach(() => {
    setAccessToken(null);
    localStorage.clear();
    localStorage.setItem("mps-cookie-consent", "accepted");
    window.history.replaceState({}, "", "/");
    vi.stubGlobal("scrollTo", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("loads and renders an article opened directly by pathname", async () => {
    window.history.replaceState({}, "", "/posts/bali-guide");
    const fetchMock = installApi();

    render(<App />);

    expect(await screen.findByRole("heading", { level: 1, name: post.title })).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://mir.pod-solncem.ru/api/v1/posts/bali-guide",
      expect.any(Object),
    );
    expect(window.location.hash).toBe("");
  });

  it("shows a dedicated not-found state for a physically missing slug", async () => {
    window.history.replaceState({}, "", "/posts/bali-guide");
    installApi("missing");

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Публикация не найдена" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Вернуться в ленту" }));
    await waitFor(() => expect(window.location.pathname).toBe("/"));
    expect(await screen.findByRole("heading", { name: /Журнал о путешествиях/ })).toBeTruthy();
  });

  it("reports an API/network failure through a toast instead of a false 404", async () => {
    window.history.replaceState({}, "", "/posts/bali-guide");
    installApi("network");

    render(<App />);

    expect((await screen.findByRole("alert")).textContent).toContain("Не удалось загрузить публикацию");
    expect(screen.queryByText("Публикация не найдена")).toBeNull();
  });

  it("pushes a shareable article URL after an internal feed click", async () => {
    installApi();
    render(<App />);
    const pushState = vi.spyOn(window.history, "pushState");

    fireEvent.click(await screen.findByRole("heading", { level: 2, name: post.title }));

    await waitFor(() => expect(window.location.pathname).toBe("/posts/bali-guide"));
    expect(pushState).toHaveBeenCalledWith({}, "", "/posts/bali-guide");
    expect(await screen.findByRole("heading", { level: 1, name: post.title })).toBeTruthy();
  });

  it("pushes a shareable country URL after an internal country click", async () => {
    window.history.replaceState({}, "", "/countries");
    installApi();
    render(<App />);
    const pushState = vi.spyOn(window.history, "pushState");

    fireEvent.click(await screen.findByRole("button", { name: /ОАЭ/ }));

    await waitFor(() => expect(window.location.pathname).toBe("/countries/1"));
    expect(pushState).toHaveBeenCalledWith({}, "", "/countries/1");
    expect(await screen.findByRole("heading", { name: /Темы: ОАЭ/ })).toBeTruthy();
  });

  it("reacts to browser back/forward popstate navigation", async () => {
    window.history.replaceState({}, "", "/reviews");
    installApi();
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Отзывы" })).toBeTruthy();

    window.history.pushState({}, "", "/about");
    window.dispatchEvent(new PopStateEvent("popstate"));

    expect(await screen.findByRole("heading", { name: "Мы — «Под солнцем»" })).toBeTruthy();
  });
});
