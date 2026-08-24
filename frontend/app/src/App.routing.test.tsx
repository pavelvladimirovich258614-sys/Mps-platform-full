import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setAccessToken } from "./api/client";
import { App } from "./App";
import type { ApiPost } from "./hooks";

const post = {
  id: 17,
  type: "article" as const,
  title: "Гид по Бали",
  slug: "bali-guide",
  body: "Большой материал о путешествии.",
  cover_url: "/media/bali-cover.webp",
  views: 12,
  likes_count: 3,
  shot_at: null,
  author: { id: 7, name: "Мария", avatar_url: "/media/maria.webp" },
};

const fishka = {
  ...post,
  id: 18,
  type: "tip" as const,
  title: "Как не переплатить за трансфер",
  slug: "transfer-tip",
  body: "Проверенная короткая фишка.",
};

const publicProfile = {
  id: 7,
  name: "Мария",
  avatar_url: "/media/maria.webp",
  bio: "Пишу о путешествиях.",
  posts_count: 1,
  followers_count: 0,
  following_count: 0,
  is_following: false,
  countries: [{ id: 1, name: "ОАЭ", flag_emoji: "🇦🇪" }],
};

const jsonResponse = (status: number, body: unknown) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json" },
});

type DetailResult = "ok" | "missing" | "network";

function installApi(detailResult: DetailResult = "ok", currentUser: Record<string, unknown> | null = null, posts: ApiPost[] = [post], online: Array<{ id: number; name: string; avatar_url: string | null }> = []) {
  let likesCount = post.likes_count;
  const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
    const url = new URL(String(input));
    const path = url.pathname;
    if (path === "/api/v1/users/7/profile") return jsonResponse(200, publicProfile);
    if (path === "/api/v1/users/7/likes") return jsonResponse(200, []);
    if (path === "/api/v1/posts/bali-guide") {
      if (detailResult === "missing") return jsonResponse(404, { detail: "Публикация не найдена" });
      if (detailResult === "network") throw new TypeError("Failed to fetch");
      return jsonResponse(200, post);
    }
    if (path === "/api/v1/posts") return jsonResponse(200, posts);
    if (path === "/api/v1/posts/17/like") {
      likesCount = likesCount === post.likes_count ? likesCount + 1 : likesCount - 1;
      return jsonResponse(200, { likes_count: likesCount });
    }
    if (path === "/api/v1/posts/17" && init?.method === "PATCH") return jsonResponse(200, { ...post, ...JSON.parse(String(init.body)) });
    if (path === "/api/v1/posts/17" && init?.method === "DELETE") return new Response(null, { status: 204 });
    if (path === "/api/v1/posts/17/comments") return jsonResponse(200, []);
    if (path === "/api/v1/countries") return jsonResponse(200, [{ id: 1, name: "ОАЭ", topics_count: 0 }]);
    if (path === "/api/v1/countries/1/topics") return jsonResponse(200, []);
    if (path === "/api/v1/online") return jsonResponse(200, online);
    if (path === "/api/v1/notifications") return jsonResponse(200, { items: [] });
    if (path === "/api/v1/auth/logout") return new Response(null, { status: 204 });
    if (path === "/api/v1/me" && currentUser) return jsonResponse(200, currentUser);
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

  it("loads a public profile opened directly by pathname", async () => {
    window.history.replaceState({}, "", "/users/7");
    const fetchMock = installApi();

    render(<App />);

    expect(await screen.findByRole("heading", { level: 1, name: "Мария" })).toBeTruthy();
    expect(screen.getByText("Гид по Бали")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://mir.pod-solncem.ru/api/v1/users/7/profile",
      expect.any(Object),
    );
  });

  it("passes the current online list to the public profile indicator", async () => {
    window.history.replaceState({}, "", "/users/7");
    installApi("ok", null, [post], [{ id: 7, name: "Мария", avatar_url: "/media/maria.webp" }]);

    render(<App />);

    const indicators = await screen.findAllByLabelText("Мария сейчас на платформе");
    expect(indicators.some((indicator) => indicator.parentElement?.classList.contains("public-profile-avatar-wrap"))).toBe(true);
  });

  it("opens the dedicated Fishki route and renders only fishka cards", async () => {
    window.history.replaceState({}, "", "/fishki");
    installApi("ok", null, [post, fishka]);

    render(<App />);

    expect(await screen.findByRole("heading", { level: 1, name: "Фишки" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: fishka.title })).toBeTruthy();
    expect(screen.queryByRole("heading", { level: 2, name: post.title })).toBeNull();
  });

  it("navigates to Fishki from the sidebar and leaves one inactive article heading", async () => {
    installApi("ok", null, [post, fishka]);
    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: /Фишки/ }));
    await waitFor(() => expect(window.location.pathname).toBe("/fishki"));

    fireEvent.click(screen.getByRole("button", { name: "Лента" }));
    await waitFor(() => expect(window.location.pathname).toBe("/"));
    const filters = document.querySelector(".feed-filters");
    expect(filters).not.toBeNull();
    expect(within(filters as HTMLElement).getByRole("heading", { level: 2, name: "Статьи" })).toBeTruthy();
    expect(within(filters as HTMLElement).queryAllByRole("button")).toEqual([]);
  });

  it("opens the authenticated reader's public profile from the header and edits through the existing modal", async () => {
    setAccessToken("reader-access-token");
    installApi("ok", {
      id: 7, email: null, name: "Мария", avatar_url: "/media/maria.webp", bio: "Пишу о путешествиях.", role: "reader", is_anonymous: false,
    });
    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "Мария" }));
    await waitFor(() => expect(window.location.pathname).toBe("/users/7"));
    expect(await screen.findByRole("button", { name: "Редактировать профиль" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Редактировать профиль" }));
    expect(await screen.findByRole("dialog", { name: "Мой профиль" })).toBeTruthy();
  });

  it("logs the profile owner out from the compact menu and returns to the guest feed", async () => {
    window.history.replaceState({}, "", "/users/7");
    setAccessToken("owner-access-token");
    const fetchMock = installApi("ok", { id: 7, email: null, name: "Мария", avatar_url: null, bio: null, role: "reader", is_anonymous: false });
    render(<App />);
    expect(await screen.findByRole("button", { name: "Редактировать профиль" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Действия с профилем" }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Выйти/ }));
    await waitFor(() => expect(fetchMock.mock.calls.some(([input, init]) => new URL(String(input)).pathname === "/api/v1/auth/logout" && (init as RequestInit).method === "POST")).toBe(true));
    await waitFor(() => expect(window.location.pathname).toBe("/"));
    expect(localStorage.getItem("access_token")).toBeNull();
    expect(screen.getByRole("button", { name: "Войти" })).toBeTruthy();
  });

  it("shows an editor's drafts and opens the selected draft with composer prefill", async () => {
    window.history.replaceState({}, "", "/drafts");
    setAccessToken("editor-access-token");
    const draft = { ...post, id: 24, title: "Черновик Бали", slug: "bali-draft", body: "Текст черновика", status: "draft", updated_at: "2026-08-24T08:00:00+00:00" };
    vi.stubGlobal("fetch", vi.fn<typeof fetch>(async (input, init) => {
      const path = new URL(String(input)).pathname;
      if (path === "/api/v1/me") return jsonResponse(200, { id: 5, email: null, name: "Редактор", avatar_url: null, bio: null, role: "editor", is_anonymous: false });
      if (path === "/api/v1/posts/drafts") return jsonResponse(200, [{ id: draft.id, title: draft.title, updated_at: draft.updated_at }]);
      if (path === `/api/v1/posts/drafts/${draft.id}`) return jsonResponse(200, draft);
      if (path === `/api/v1/posts/${draft.id}` && init?.method === "PATCH") return jsonResponse(200, { ...draft, ...JSON.parse(String(init.body)) });
      if (path === "/api/v1/posts" || path === "/api/v1/online") return jsonResponse(200, []);
      if (path === "/api/v1/notifications") return jsonResponse(200, { items: [] });
      if (path === "/api/v1/auth/refresh") return jsonResponse(401, { detail: "Требуется авторизация" });
      return jsonResponse(200, {});
    }));

    render(<App />);

    expect(await screen.findByRole("heading", { level: 1, name: "Черновики" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /^Черновик Бали/ }));
    expect(await screen.findByRole("dialog", { name: "Редактирование публикации" })).toBeTruthy();
    expect((screen.getByLabelText("Заголовок публикации") as HTMLInputElement).value).toBe("Черновик Бали");
    fireEvent.click(screen.getByRole("button", { name: "Сохранить черновик" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Редактирование публикации" })).toBeNull());
  });

  it("deletes a draft after confirmation and removes its card from the list", async () => {
    window.history.replaceState({}, "", "/drafts");
    setAccessToken("editor-access-token");
    const draft = { ...post, id: 24, title: "Черновик Бали", slug: "bali-draft", body: "Текст черновика", status: "draft", updated_at: "2026-08-24T08:00:00+00:00" };
    let visibleDrafts = [{ id: draft.id, title: draft.title, updated_at: draft.updated_at }];
    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      const path = new URL(String(input)).pathname;
      if (path === "/api/v1/me") return jsonResponse(200, { id: 5, email: null, name: "Редактор", avatar_url: null, bio: null, role: "editor", is_anonymous: false });
      if (path === "/api/v1/posts/drafts") return jsonResponse(200, visibleDrafts);
      if (path === `/api/v1/posts/${draft.id}` && init?.method === "DELETE") { visibleDrafts = []; return new Response(null, { status: 204 }); }
      if (path === "/api/v1/posts" || path === "/api/v1/online") return jsonResponse(200, []);
      if (path === "/api/v1/notifications") return jsonResponse(200, { items: [] });
      if (path === "/api/v1/auth/refresh") return jsonResponse(401, { detail: "Требуется авторизация" });
      return jsonResponse(200, {});
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    expect(await screen.findByText(draft.title)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: `Удалить черновик: ${draft.title}` }));
    expect(fetchMock.mock.calls.some(([input, init]) => new URL(String(input)).pathname === `/api/v1/posts/${draft.id}` && (init as RequestInit).method === "DELETE")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Подтвердить удаление" }));
    await waitFor(() => expect(fetchMock.mock.calls.some(([input, init]) => new URL(String(input)).pathname === `/api/v1/posts/${draft.id}` && (init as RequestInit).method === "DELETE")).toBe(true));
    await waitFor(() => expect(screen.queryByText(draft.title)).toBeNull());
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

  it("shows a Telegram-only login modal without an email path", async () => {
    installApi();
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Войти" }));

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.queryByPlaceholderText("Электронная почта")).toBeNull();
    expect(screen.queryByPlaceholderText("Код из письма")).toBeNull();
    expect(screen.queryByRole("button", { name: "Получить код" })).toBeNull();
    expect(screen.queryByText(/коду из письма/i)).toBeNull();
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

  it("toggles a post like locally for an authenticated reader", async () => {
    setAccessToken("reader-access-token");
    installApi("ok", {
      id: 5, email: null, name: "Читатель", avatar_url: null, bio: null, role: "reader", is_anonymous: false,
    });
    render(<App />);

    const like = await screen.findByRole("button", { name: "Нравится: 3" });
    fireEvent.click(like);
    expect(await screen.findByRole("button", { name: "Нравится: 4" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Нравится: 4" }));
    expect(await screen.findByRole("button", { name: "Нравится: 3" })).toBeTruthy();
  });

  it("opens the login modal for a guest like without calling the like API", async () => {
    const fetchMock = installApi();
    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "Нравится: 3" }));

    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(fetchMock.mock.calls.some(([input]) => new URL(String(input)).pathname === "/api/v1/posts/17/like")).toBe(false);
  });

  it.each([
    ["guest", null],
    ["reader", { id: 5, email: null, name: "Читатель", avatar_url: null, bio: null, role: "reader", is_anonymous: false }],
    ["premium", { id: 5, email: null, name: "Премиум", avatar_url: null, bio: null, role: "premium", is_anonymous: false }],
  ])("hides article management controls from %s", async (_role, currentUser) => {
    window.history.replaceState({}, "", "/posts/bali-guide");
    if (currentUser) setAccessToken("non-editor-access-token");
    installApi("ok", currentUser);
    const view = render(<App />);

    await screen.findByRole("heading", { level: 1, name: post.title });
    expect(screen.queryByRole("button", { name: "Редактировать" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Удалить" })).toBeNull();
    view.unmount();
  });

  it("lets an editor patch an article and delete it only after confirmation", async () => {
    window.history.replaceState({}, "", "/posts/bali-guide");
    setAccessToken("editor-access-token");
    const fetchMock = installApi("ok", {
      id: 5, email: null, name: "Редактор", avatar_url: null, bio: null, role: "editor", is_anonymous: false,
    });
    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "Редактировать" }));
    expect(await screen.findByRole("dialog", { name: "Редактирование публикации" })).toBeTruthy();
    expect((screen.getByLabelText("Заголовок публикации") as HTMLInputElement).value).toBe(post.title);
    fireEvent.click(screen.getByRole("button", { name: "Сохранить изменения" }));
    await waitFor(() => expect(fetchMock.mock.calls.some(([input, init]) => new URL(String(input)).pathname === "/api/v1/posts/17" && (init as RequestInit).method === "PATCH")).toBe(true));
    const patchCall = fetchMock.mock.calls.find(([input, init]) => new URL(String(input)).pathname === "/api/v1/posts/17" && (init as RequestInit).method === "PATCH");
    expect(JSON.parse(String((patchCall?.[1] as RequestInit).body))).toEqual({ title: post.title, type: "article", body: post.body, status: "published", cover_url: post.cover_url });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Редактирование публикации" })).toBeNull());

    fireEvent.click(screen.getByRole("button", { name: "Удалить" }));
    expect(fetchMock.mock.calls.some(([input, init]) => new URL(String(input)).pathname === "/api/v1/posts/17" && (init as RequestInit).method === "DELETE")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Подтвердить удаление" }));
    await waitFor(() => expect(window.location.pathname).toBe("/"));
    expect(fetchMock.mock.calls.some(([input, init]) => new URL(String(input)).pathname === "/api/v1/posts/17" && (init as RequestInit).method === "DELETE")).toBe(true);
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
