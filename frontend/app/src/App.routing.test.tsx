import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setAccessToken } from "./api/client";
import { App } from "./App";
import type { ApiPost, Notification, Question } from "./hooks";

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
  type: "fishka" as const,
  title: "Как не переплатить за трансфер",
  slug: "transfer-tip",
  body: "Проверенная короткая фишка.",
  emoji: "💡",
  category: "Трансфер и дорога в аэропорт",
};

const hotelFishka = {
  ...fishka,
  id: 19,
  title: "Как получить раннее заселение",
  slug: "hotel-tip",
  emoji: "🏨",
  category: "Отель и заселение",
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
const scrollIntoViewMock = vi.fn();

type DetailResult = "ok" | "missing" | "network";
type FishkaOptions = {
  canSubmit?: boolean;
  adminEnabled?: boolean;
  adminUpdateStatus?: number;
  categories?: string[];
  irishkaEnabled?: boolean;
  irishkaDelayMin?: number;
};
type QAOptions = {
  irishkaResponse?: Promise<Response>;
  questions?: Question[];
  notifications?: Notification[];
};

function installApi(detailResult: DetailResult = "ok", currentUser: Record<string, unknown> | null = null, posts: ApiPost[] = [post], online: Array<{ id: number; name: string; avatar_url: string | null }> = [], profileComments: unknown[] = [], profileLikes: ApiPost[] = [], profileActivity: { items: unknown[]; next_cursor: string | null } = { items: [], next_cursor: null }, nextProfileActivity: { items: unknown[]; next_cursor: string | null } = { items: [], next_cursor: null }, fishkaOptions: FishkaOptions = {}, qaOptions: QAOptions = {}) {
  let likesCount = post.likes_count;
  let currentProfileLikes = profileLikes;
  const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
    const url = new URL(String(input));
    const path = url.pathname;
    if (path === "/api/v1/users/7/profile") return jsonResponse(200, publicProfile);
    if (path === "/api/v1/users/7/likes") return jsonResponse(200, currentProfileLikes);
    if (path === "/api/v1/users/7/activity") return jsonResponse(200, url.searchParams.has("cursor") ? nextProfileActivity : profileActivity);
    if (path === "/api/v1/users/7/comments") return jsonResponse(200, profileComments);
    if (path === "/api/v1/users/7/followers" || path === "/api/v1/users/7/following") return jsonResponse(200, []);
    if (path === "/api/v1/posts/bali-guide") {
      if (detailResult === "missing") return jsonResponse(404, { detail: "Публикация не найдена" });
      if (detailResult === "network") throw new TypeError("Failed to fetch");
      return jsonResponse(200, post);
    }
    if (path === "/api/v1/posts/fishki/categories") return jsonResponse(200, fishkaOptions.categories ?? []);
    if (path === "/api/v1/posts/fishki/permission") return jsonResponse(200, { can_submit_fishka: fishkaOptions.canSubmit ?? false });
    if (path === "/api/v1/admin/settings" && init?.method === "PATCH") {
      if (fishkaOptions.adminUpdateStatus) return jsonResponse(fishkaOptions.adminUpdateStatus, { detail: "Настройка недоступна" });
      return jsonResponse(200, JSON.parse(String(init.body)));
    }
    if (path === "/api/v1/admin/settings") return jsonResponse(200, {
      fishka_submissions_enabled: fishkaOptions.adminEnabled ?? false,
      irishka_enabled: fishkaOptions.irishkaEnabled ?? true,
      irishka_delay_min: fishkaOptions.irishkaDelayMin ?? 30,
    });
    if (path === "/api/v1/posts" && init?.method === "POST") return jsonResponse(201, { ...fishka, ...JSON.parse(String(init.body)), status: JSON.parse(String(init.body)).status });
    if (path === "/api/v1/posts") {
      const category = url.searchParams.get("category");
      return jsonResponse(200, category ? posts.filter((item) => item.category === category) : posts);
    }
    if (path === "/api/v1/posts/17/like") {
      likesCount = likesCount === post.likes_count ? likesCount + 1 : likesCount - 1;
      currentProfileLikes = currentProfileLikes.some((item) => item.id === post.id) ? [] : [{ ...post, liked_at: "2026-08-25T09:30:00Z" }];
      return jsonResponse(200, { likes_count: likesCount });
    }
    if (path === "/api/v1/posts/17" && init?.method === "PATCH") return jsonResponse(200, { ...post, ...JSON.parse(String(init.body)) });
    if (path === "/api/v1/posts/17" && init?.method === "DELETE") return new Response(null, { status: 204 });
    if (path === "/api/v1/posts/17/comments") return jsonResponse(200, []);
    if (path === "/api/v1/qa/my") return jsonResponse(200, qaOptions.questions ?? []);
    if (path === "/api/v1/qa/irishka" && init?.method === "POST") return qaOptions.irishkaResponse ?? jsonResponse(200, { answer: "Ответ Иришки" });
    if (path === "/api/v1/countries") return jsonResponse(200, [{ id: 1, name: "ОАЭ", topics_count: 0 }]);
    if (path === "/api/v1/countries/1/topics") return jsonResponse(200, { items: [], next_cursor: null });
    if (path === "/api/v1/online") return jsonResponse(200, online);
    if (path === "/api/v1/notifications") return jsonResponse(200, { items: qaOptions.notifications ?? [] });
    if (path === "/api/v1/notifications/read" && init?.method === "PATCH") return jsonResponse(200, { updated: 1 });
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
    Object.defineProperty(Element.prototype, "scrollIntoView", { configurable: true, value: scrollIntoViewMock });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(Element.prototype, "scrollIntoView");
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
    expect(fetchMock.mock.calls.some(([input]) => {
      const url = new URL(String(input));
      return url.pathname === "/api/v1/posts" && url.searchParams.get("author_id") === "7";
    })).toBe(true);
  });

  it("loads replies for a public profile from the profile comments endpoint", async () => {
    window.history.replaceState({}, "", "/users/7");
    const fetchMock = installApi("ok", null, [post], [], [{
      id: 31,
      body: "Совет по маршруту",
      created_at: "2026-08-11T09:30:00Z",
      status: "approved",
      post: { slug: "portugal-guide", title: "Гид по Португалии" },
    }]);

    render(<App />);

    fireEvent.click(await screen.findByRole("tab", { name: "Ответы" }));
    expect(await screen.findByText("Совет по маршруту")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://mir.pod-solncem.ru/api/v1/users/7/comments",
      expect.any(Object),
    );
  });

  it("loads and paginates Activity through the profile activity endpoint", async () => {
    window.history.replaceState({}, "", "/users/7");
    const fetchMock = installApi("ok", null, [post], [], [], [], {
      items: [{ id: 1, event_type: "post_published", created_at: "2026-08-11T09:30:00Z", post: { id: 17, title: "Гид по Бали", slug: "bali-guide" } }],
      next_cursor: "next-page",
    }, {
      items: [{ id: 2, event_type: "user_followed", created_at: "2026-08-10T09:30:00Z", user: { id: 9, name: "Анна", avatar_url: null } }],
      next_cursor: null,
    });

    render(<App />);

    fireEvent.click(await screen.findByRole("tab", { name: "Активность" }));
    expect(await screen.findByText("Опубликовал статью «Гид по Бали»")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Показать ещё" }));
    expect(await screen.findByText("Подписался на Анна")).toBeTruthy();
    expect(fetchMock.mock.calls.some(([input]) => {
      const url = new URL(String(input));
      return url.pathname === "/api/v1/users/7/activity" && url.searchParams.get("cursor") === "next-page";
    })).toBe(true);
  });

  it("refreshes the current user's shared liked-posts state after a like toggle", async () => {
    window.history.replaceState({}, "", "/users/7");
    const fetchMock = installApi("ok", {
      id: 7, email: null, name: "Мария", avatar_url: null, bio: null, role: "reader", is_anonymous: false,
    }, [post], [], [], [post]);
    setAccessToken("reader-access-token");
    render(<App />);

    fireEvent.click(await screen.findByRole("tab", { name: "Лайки" }));
    fireEvent.click(screen.getByRole("button", { name: "Читать публикацию: Гид по Бали" }));
    fireEvent.click(await screen.findByRole("button", { name: "Нравится: 3" }));

    await waitFor(() => expect(fetchMock.mock.calls.filter(([input]) => new URL(String(input)).pathname === "/api/v1/users/7/likes")).toHaveLength(2));
    window.history.back();
    window.dispatchEvent(new PopStateEvent("popstate"));
    fireEvent.click(await screen.findByRole("tab", { name: "Лайки" }));
    expect(await screen.findByText("Понравившихся публикаций пока нет.")).toBeTruthy();
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
    expect(screen.getByText("Секреты удачных поездок — от тех, кто уже там побывал")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: fishka.title })).toBeTruthy();
    expect(screen.getByText("💡")).toBeTruthy();
    expect(screen.queryByRole("heading", { level: 2, name: post.title })).toBeNull();
  });

  it("requests fishki through the explicit type filter", async () => {
    window.history.replaceState({}, "", "/fishki");
    const fetchMock = installApi("ok", null, [post, fishka]);

    render(<App />);

    await screen.findByRole("heading", { level: 1, name: "Фишки" });
    await waitFor(() => expect(fetchMock.mock.calls.some(([input]) => {
      const url = new URL(String(input));
      return url.pathname === "/api/v1/posts" && url.searchParams.get("type") === "fishka";
    })).toBe(true));
  });

  it("loads fishka categories and refetches the list for the selected category", async () => {
    window.history.replaceState({}, "", "/fishki");
    const categories = ["Трансфер и дорога в аэропорт", "Отель и заселение"];
    const fetchMock = installApi("ok", null, [fishka, hotelFishka], [], [], [], { items: [], next_cursor: null }, { items: [], next_cursor: null }, { categories });

    render(<App />);

    const filter = await screen.findByRole("combobox", { name: "Тема" });
    expect(within(filter).getByRole("option", { name: "Все темы" })).toBeTruthy();
    expect(within(filter).getByRole("option", { name: "Отель и заселение" })).toBeTruthy();
    fireEvent.change(filter, { target: { value: "Отель и заселение" } });

    await waitFor(() => expect(fetchMock.mock.calls.some(([input]) => {
      const url = new URL(String(input));
      return url.pathname === "/api/v1/posts"
        && url.searchParams.get("type") === "fishka"
        && url.searchParams.get("category") === "Отель и заселение";
    })).toBe(true));
    expect(await screen.findByRole("heading", { level: 2, name: hotelFishka.title })).toBeTruthy();
    expect(screen.queryByRole("heading", { level: 2, name: fishka.title })).toBeNull();
  });

  it("offers all block emoji without removing visually similar Unicode variants", async () => {
    window.history.replaceState({}, "", "/fishki");
    setAccessToken("editor-access-token");
    installApi("ok", { id: 5, email: null, name: "Редактор", avatar_url: null, bio: null, role: "editor", is_anonymous: false });

    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "Добавить фишку" }));
    const choices = screen.getAllByRole("button", { name: /Выбрать emoji/ }).map((button) => button.textContent);
    expect(choices).toHaveLength(23);
    expect(choices).toEqual(expect.arrayContaining(["🚖", "🛂", "💰", "🎒", "🌐", "👶", "📅", "🍽", "🔒", "🗺", "🎯"]));
    expect(choices).toEqual(expect.arrayContaining(["🍽️", "🍽", "🗺️", "🗺", "🚕", "🚖"]));
    expect(choices.filter((emoji) => emoji === "🏨")).toHaveLength(1);
    expect(choices.filter((emoji) => emoji === "📱")).toHaveLength(1);
  });

  it("always shows the fishka form to an editor and publishes selected emoji immediately", async () => {
    window.history.replaceState({}, "", "/fishki");
    setAccessToken("editor-access-token");
    const fetchMock = installApi("ok", { id: 5, email: null, name: "Редактор", avatar_url: null, bio: null, role: "editor", is_anonymous: false });

    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "Добавить фишку" }));
    fireEvent.change(screen.getByLabelText("Заголовок фишки"), { target: { value: "Бронируйте заранее" } });
    fireEvent.change(screen.getByLabelText("Текст фишки"), { target: { value: "Так будет больше вариантов." } });
    expect(screen.getByRole("button", { name: "Опубликовать" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Опубликовать" }));
    expect(await screen.findByText("Выберите эмодзи для фишки")).toBeTruthy();
    expect(fetchMock.mock.calls.some(([input, init]) => new URL(String(input)).pathname === "/api/v1/posts" && (init as RequestInit).method === "POST")).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Выбрать emoji 💡" }));
    fireEvent.click(screen.getByRole("button", { name: "Опубликовать" }));
    await waitFor(() => expect(fetchMock.mock.calls.some(([input, init]) => {
      if (new URL(String(input)).pathname !== "/api/v1/posts" || (init as RequestInit).method !== "POST") return false;
      const body = JSON.parse(String((init as RequestInit).body));
      return body.type === "fishka" && body.emoji === "💡" && body.status === "published";
    })).toBe(true));
    expect(await screen.findByText("Фишка опубликована")).toBeTruthy();
  });

  it("lets an admin toggle reader fishka submissions from the Fishki page", async () => {
    window.history.replaceState({}, "", "/fishki");
    setAccessToken("admin-access-token");
    const fetchMock = installApi("ok", { id: 1, email: null, name: "Администратор", avatar_url: null, bio: null, role: "admin", is_anonymous: false }, [fishka], [], [], [], { items: [], next_cursor: null }, { items: [], next_cursor: null }, { adminEnabled: false });

    render(<App />);

    const toggle = await screen.findByRole("checkbox", { name: "Разрешить пользователям добавлять фишки" });
    expect((toggle as HTMLInputElement).checked).toBe(false);
    fireEvent.click(toggle);

    await waitFor(() => expect(fetchMock.mock.calls.some(([input, init]) => {
      if (new URL(String(input)).pathname !== "/api/v1/admin/settings" || (init as RequestInit).method !== "PATCH") return false;
      return JSON.parse(String((init as RequestInit).body)).fishka_submissions_enabled === true;
    })).toBe(true));
    expect((screen.getByRole("checkbox", { name: "Разрешить пользователям добавлять фишки" }) as HTMLInputElement).checked).toBe(true);
  });

  it("never requests or shows fishka admin settings to an editor", async () => {
    window.history.replaceState({}, "", "/fishki");
    setAccessToken("editor-access-token");
    const fetchMock = installApi("ok", { id: 5, email: null, name: "Редактор", avatar_url: null, bio: null, role: "editor", is_anonymous: false });

    render(<App />);

    await screen.findByRole("heading", { level: 1, name: "Фишки" });
    expect(screen.queryByRole("checkbox", { name: "Разрешить пользователям добавлять фишки" })).toBeNull();
    expect(fetchMock.mock.calls.some(([input]) => new URL(String(input)).pathname === "/api/v1/admin/settings")).toBe(false);
  });

  it("keeps the admin fishka setting unchanged when its update fails", async () => {
    window.history.replaceState({}, "", "/fishki");
    setAccessToken("admin-access-token");
    installApi("ok", { id: 1, email: null, name: "Администратор", avatar_url: null, bio: null, role: "admin", is_anonymous: false }, [fishka], [], [], [], { items: [], next_cursor: null }, { items: [], next_cursor: null }, { adminEnabled: false, adminUpdateStatus: 503 });

    render(<App />);

    const toggle = await screen.findByRole("checkbox", { name: "Разрешить пользователям добавлять фишки" });
    fireEvent.click(toggle);

    expect((await screen.findByRole("alert")).textContent).toContain("Не удалось изменить настройку");
    expect((screen.getByRole("checkbox", { name: "Разрешить пользователям добавлять фишки" }) as HTMLInputElement).checked).toBe(false);
  });

  it("shows the fishka form to a reader only when the effective permission allows it and sends pending", async () => {
    window.history.replaceState({}, "", "/fishki");
    setAccessToken("reader-access-token");
    const fetchMock = installApi("ok", { id: 7, email: null, name: "Мария", avatar_url: null, bio: null, role: "reader", is_anonymous: false }, [fishka], [], [], [], { items: [], next_cursor: null }, { items: [], next_cursor: null }, { canSubmit: true });

    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: "Добавить фишку" }));
    fireEvent.change(screen.getByLabelText("Заголовок фишки"), { target: { value: "Проверьте паспорт" } });
    fireEvent.change(screen.getByLabelText("Текст фишки"), { target: { value: "До вылета." } });
    fireEvent.click(screen.getByRole("button", { name: "Выбрать emoji 🧳" }));
    expect(screen.getByRole("button", { name: "Отправить на модерацию" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Отправить на модерацию" }));
    await waitFor(() => expect(fetchMock.mock.calls.some(([input, init]) => {
      if (new URL(String(input)).pathname !== "/api/v1/posts" || (init as RequestInit).method !== "POST") return false;
      return JSON.parse(String((init as RequestInit).body)).status === "pending";
    })).toBe(true));
    expect(await screen.findByText("Фишка отправлена на проверку")).toBeTruthy();
  });

  it("hides the fishka form from a reader when the effective permission is disabled", async () => {
    window.history.replaceState({}, "", "/fishki");
    setAccessToken("reader-access-token");
    const fetchMock = installApi("ok", { id: 7, email: null, name: "Мария", avatar_url: null, bio: null, role: "reader", is_anonymous: false });

    render(<App />);

    await screen.findByRole("heading", { level: 1, name: "Фишки" });
    await waitFor(() => expect(fetchMock.mock.calls.some(([input]) => new URL(String(input)).pathname === "/api/v1/posts/fishki/permission")).toBe(true));
    expect(screen.queryByRole("button", { name: "Добавить фишку" })).toBeNull();
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

  it("asks Irishka in the QA modal and renders the answer after loading", async () => {
    let resolveIrishka: (response: Response) => void = () => undefined;
    const irishkaResponse = new Promise<Response>((resolve) => { resolveIrishka = resolve; });
    const fetchMock = installApi("ok", null, [post], [], [], [], { items: [], next_cursor: null }, { items: [], next_cursor: null }, {}, { irishkaResponse });

    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: /Вопрос-ответ/ }));
    fireEvent.click(screen.getByRole("button", { name: "Иришка ИИ" }));
    fireEvent.change(screen.getByPlaceholderText("Спросить Иришку…"), { target: { value: "Что посмотреть в Шардже?" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Спросить" }));

    expect(screen.getByText("Иришка думает…")).toBeTruthy();
    resolveIrishka(jsonResponse(200, { answer: "Начните с пляжей и музеев Шарджи." }));
    expect(await screen.findByText("Начните с пляжей и музеев Шарджи.")).toBeTruthy();
    expect(fetchMock.mock.calls.some(([input, init]) => {
      if (new URL(String(input)).pathname !== "/api/v1/qa/irishka" || (init as RequestInit).method !== "POST") return false;
      return JSON.parse(String((init as RequestInit).body)).text === "Что посмотреть в Шардже?";
    })).toBe(true);
  });

  it("labels qa_answered notifications using the linked question target", async () => {
    setAccessToken("reader-access-token");
    const questions: Question[] = [
      { id: 41, target: "manager", body: "Вопрос менеджеру", status: "answered", answer: "Ответ менеджера" },
      { id: 42, target: "lawyer", body: "Вопрос юристу", status: "answered", answer: "Ответ юриста" },
    ];
    const notifications: Notification[] = [
      { id: 91, type: "qa_answered", payload: { question_id: 41 }, is_read: false, created_at: "2026-08-26T10:00:00Z" },
      { id: 92, type: "qa_answered", payload: { question_id: 42 }, is_read: false, created_at: "2026-08-26T10:01:00Z" },
    ];
    installApi("ok", { id: 7, email: null, name: "Мария", avatar_url: null, bio: null, role: "reader", is_anonymous: false }, [post], [], [], [], { items: [], next_cursor: null }, { items: [], next_cursor: null }, {}, { questions, notifications });

    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: "Уведомления" }));

    expect(await screen.findByRole("button", { name: /Менеджер ответил на ваш вопрос/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Юрист ответил на ваш вопрос/ })).toBeTruthy();
  });

  it("opens the linked QA thread, selects its tab and marks only that notification read", async () => {
    setAccessToken("reader-access-token");
    const question: Question = { id: 42, target: "lawyer", body: "Нужна консультация", status: "answered", answer: "Ответ юриста" };
    const notification: Notification = { id: 92, type: "qa_answered", payload: { question_id: 42 }, is_read: false, created_at: "2026-08-26T10:01:00Z" };
    const fetchMock = installApi("ok", { id: 7, email: null, name: "Мария", avatar_url: null, bio: null, role: "reader", is_anonymous: false }, [post], [], [], [], { items: [], next_cursor: null }, { items: [], next_cursor: null }, {}, { questions: [question], notifications: [notification] });

    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: "Уведомления" }));
    fireEvent.click(await screen.findByRole("button", { name: /Юрист ответил на ваш вопрос/ }));

    expect(await screen.findByRole("dialog", { name: "Вопрос-ответ" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Юрист" }).classList.contains("current")).toBe(true);
    const linkedQuestion = await screen.findByTestId("qa-question-42");
    expect(linkedQuestion.classList.contains("qa-message-focused")).toBe(true);
    expect(within(linkedQuestion).getByText("Нужна консультация")).toBeTruthy();
    expect(within(linkedQuestion).getByText("Ответ юриста")).toBeTruthy();
    expect(scrollIntoViewMock).toHaveBeenCalled();
    for (const tab of ["Менеджер", "Иришка ИИ", "Юрист"]) {
      fireEvent.click(screen.getByRole("button", { name: tab }));
      await waitFor(() => expect(screen.getByRole("button", { name: tab }).classList.contains("current")).toBe(true));
    }
    expect(fetchMock.mock.calls.some(([input, init]) => {
      if (new URL(String(input)).pathname !== "/api/v1/notifications/read" || (init as RequestInit).method !== "PATCH") return false;
      return JSON.parse(String((init as RequestInit).body)).ids?.[0] === 92;
    })).toBe(true);
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

  it("lets an admin persist forum Irishka settings from the countries page", async () => {
    window.history.replaceState({}, "", "/countries");
    setAccessToken("admin-access-token");
    const fetchMock = installApi("ok", { id: 1, email: null, name: "Администратор", avatar_url: null, bio: null, role: "admin", is_anonymous: false }, [post], [], [], [], { items: [], next_cursor: null }, { items: [], next_cursor: null }, { irishkaEnabled: false, irishkaDelayMin: 45 });

    render(<App />);

    const enabled = await screen.findByRole("checkbox", { name: "Автоответы Иришки в форуме" });
    const delay = screen.getByRole("spinbutton", { name: "Ответить не раньше чем через, минут" });
    expect((enabled as HTMLInputElement).checked).toBe(false);
    expect((delay as HTMLInputElement).value).toBe("45");

    fireEvent.click(enabled);
    fireEvent.change(delay, { target: { value: "60" } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить настройки Иришки" }));

    await waitFor(() => expect(fetchMock.mock.calls.some(([input, init]) => {
      if (new URL(String(input)).pathname !== "/api/v1/admin/settings" || (init as RequestInit).method !== "PATCH") return false;
      return JSON.stringify(JSON.parse(String((init as RequestInit).body))) === JSON.stringify({ irishka_enabled: true, irishka_delay_min: 60 });
    })).toBe(true));
    expect((screen.getByRole("checkbox", { name: "Автоответы Иришки в форуме" }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole("spinbutton", { name: "Ответить не раньше чем через, минут" }) as HTMLInputElement).value).toBe("60");
  });

  it("never requests or shows Irishka admin settings to an editor", async () => {
    window.history.replaceState({}, "", "/countries");
    setAccessToken("editor-access-token");
    const fetchMock = installApi("ok", { id: 5, email: null, name: "Редактор", avatar_url: null, bio: null, role: "editor", is_anonymous: false });

    render(<App />);

    await screen.findByRole("heading", { level: 1, name: "Страны — Форум" });
    expect(screen.queryByRole("checkbox", { name: "Автоответы Иришки в форуме" })).toBeNull();
    expect(fetchMock.mock.calls.some(([input]) => new URL(String(input)).pathname === "/api/v1/admin/settings")).toBe(false);
  });

  it("restores confirmed Irishka settings when saving fails", async () => {
    window.history.replaceState({}, "", "/countries");
    setAccessToken("admin-access-token");
    installApi("ok", { id: 1, email: null, name: "Администратор", avatar_url: null, bio: null, role: "admin", is_anonymous: false }, [post], [], [], [], { items: [], next_cursor: null }, { items: [], next_cursor: null }, { irishkaEnabled: false, irishkaDelayMin: 45, adminUpdateStatus: 503 });

    render(<App />);

    const enabled = await screen.findByRole("checkbox", { name: "Автоответы Иришки в форуме" });
    const delay = screen.getByRole("spinbutton", { name: "Ответить не раньше чем через, минут" });
    fireEvent.click(enabled);
    fireEvent.change(delay, { target: { value: "60" } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить настройки Иришки" }));

    expect((await screen.findByRole("alert")).textContent).toContain("Не удалось сохранить настройки Иришки");
    expect((screen.getByRole("checkbox", { name: "Автоответы Иришки в форуме" }) as HTMLInputElement).checked).toBe(false);
    expect((screen.getByRole("spinbutton", { name: "Ответить не раньше чем через, минут" }) as HTMLInputElement).value).toBe("45");
  });

  it("reacts to browser back/forward popstate navigation", async () => {
    window.history.replaceState({}, "", "/reviews");
    installApi();
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Отзывы" })).toBeTruthy();

    window.history.pushState({}, "", "/about");
    window.dispatchEvent(new PopStateEvent("popstate"));

    expect(await screen.findByRole("heading", { name: "Официальный партнёр крупнейших туроператоров России" })).toBeTruthy();
  });
});
