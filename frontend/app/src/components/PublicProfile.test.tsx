import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PublicProfile } from "./PublicProfile";

const profile = {
  id: 7,
  name: "Мария",
  avatar_url: "/media/maria.webp",
  bio: "Пишу о путешествиях.",
  posts_count: 1,
  followers_count: 12,
  following_count: 3,
  is_following: false,
  countries: [{ id: 1, name: "ОАЭ", flag_emoji: "🇦🇪" }],
};

const post = {
  id: 17,
  type: "article" as const,
  title: "Гид по Бали",
  slug: "bali-guide",
  body: "Большой материал о путешествии.",
  cover_url: "/media/bali-cover.webp",
  liked_at: "2026-08-11T09:30:00Z",
  views: 12,
  likes_count: 3,
  shot_at: null,
  author: { id: 7, name: "Мария", avatar_url: "/media/maria.webp" },
};

const reply = {
  id: 31,
  body: "Совет по маршруту",
  created_at: "2026-08-11T09:30:00Z",
  status: "pending" as const,
  post: { slug: "portugal-guide", title: "Гид по Португалии" },
};

describe("PublicProfile", () => {
  it("shows the online indicator only when App marks the profile as currently online", () => {
    const commonProps = {
      profile,
      posts: [],
      likes: [],
      loading: false,
      likesLoading: false,
      viewerId: null,
      onOpenPost: vi.fn(),
      onToggleFollow: vi.fn(),
    };
    const view = render(<PublicProfile {...commonProps} isOnline />);

    expect(screen.getByLabelText("Мария сейчас на платформе").parentElement?.classList.contains("public-profile-avatar-wrap")).toBe(true);

    view.rerender(<PublicProfile {...commonProps} isOnline={false} />);
    expect(screen.queryByLabelText("Мария сейчас на платформе")).toBeNull();
  });

  it("shows public author data, replies empty state and publications", () => {
    const onOpenPost = vi.fn();
    render(<PublicProfile profile={profile} posts={[post]} likes={[]} loading={false} likesLoading={false} viewerId={profile.id} onOpenPost={onOpenPost} onToggleFollow={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Мария" })).toBeTruthy();
    expect(screen.getByText("Направления в публикациях")).toBeTruthy();
    expect(screen.getByText("🇦🇪 ОАЭ")).toBeTruthy();
    expect(screen.getByText("Гид по Бали")).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: "Ответы" }));
    expect(screen.getByText("Пока нет ответов. Ваши ответы появятся здесь.")).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: "Публикации" }));
    fireEvent.click(screen.getByRole("button", { name: "Читать публикацию: Гид по Бали" }));
    expect(onOpenPost).toHaveBeenCalledWith(post);
  });

  it("shows replies with article context and status labels only to an admin on their own profile", () => {
    const { rerender } = render(
      <PublicProfile
        profile={profile}
        posts={[]}
        likes={[]}
        comments={[reply]}
        commentsLoading={false}
        currentUser={{ id: profile.id, role: "admin" }}
        loading={false}
        likesLoading={false}
        viewerId={profile.id}
        onOpenPost={vi.fn()}
        onToggleFollow={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Ответы" }));
    expect(screen.getByText("Совет по маршруту")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Гид по Португалии" }).getAttribute("href")).toBe("/posts/portugal-guide");
    expect(screen.getByText("11.08.2026")).toBeTruthy();
    expect(screen.getByText("На проверке")).toBeTruthy();

    rerender(
      <PublicProfile
        profile={profile}
        posts={[]}
        likes={[]}
        comments={[reply]}
        commentsLoading={false}
        currentUser={{ id: 9, role: "admin" }}
        loading={false}
        likesLoading={false}
        viewerId={9}
        onOpenPost={vi.fn()}
        onToggleFollow={vi.fn()}
      />,
    );
    expect(screen.queryByText("На проверке")).toBeNull();

    rerender(
      <PublicProfile
        profile={profile}
        posts={[]}
        likes={[]}
        comments={[reply]}
        commentsLoading={false}
        currentUser={{ id: profile.id, role: "reader" }}
        loading={false}
        likesLoading={false}
        viewerId={profile.id}
        onOpenPost={vi.fn()}
        onToggleFollow={vi.fn()}
      />,
    );
    expect(screen.queryByText("На проверке")).toBeNull();
  });

  it("shows real follower counters and lets a visitor follow another profile only", async () => {
    const onToggleFollow = vi.fn().mockResolvedValue(undefined);
    const { rerender } = render(
      <PublicProfile
        profile={profile}
        posts={[]}
        likes={[]}
        loading={false}
        likesLoading={false}
        viewerId={9}
        onOpenPost={vi.fn()}
        onToggleFollow={onToggleFollow}
      />,
    );

    expect(screen.getByText("12 подписчиков")).toBeTruthy();
    expect(screen.getByText("3 подписки")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Подписаться" }));
    expect(onToggleFollow).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.getByRole("button", { name: "Подписаться" })).toBeTruthy());

    rerender(
      <PublicProfile
        profile={{ ...profile, is_following: true }}
        posts={[]}
        likes={[]}
        loading={false}
        likesLoading={false}
        viewerId={9}
        onOpenPost={vi.fn()}
        onToggleFollow={onToggleFollow}
      />,
    );
    expect(screen.getByRole("button", { name: "Отписаться" })).toBeTruthy();
    rerender(
      <PublicProfile
        profile={profile}
        posts={[]}
        likes={[]}
        loading={false}
        likesLoading={false}
        viewerId={profile.id}
        onOpenPost={vi.fn()}
        onToggleFollow={onToggleFollow}
      />,
    );
    expect(screen.queryByRole("button", { name: "Подписаться" })).toBeNull();
  });

  it("shows owner actions and copies the public link from the compact menu", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const onNotice = vi.fn();
    const clipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(
      <PublicProfile
        profile={profile}
        posts={[]}
        likes={[]}
        loading={false}
        likesLoading={false}
        viewerId={profile.id}
        onOpenPost={vi.fn()}
        onToggleFollow={vi.fn()}
        onNotice={onNotice}
      />,
    );

    expect(screen.getByText("12 подписчиков")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Редактировать профиль" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Действия с профилем" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Действия с профилем" }));
    expect(screen.getByRole("menuitem", { name: /Скопировать ссылку/ })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: /Поделиться/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("menuitem", { name: /Скопировать ссылку/ }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/users/7`));
    expect(onNotice).toHaveBeenCalledWith("Ссылка на профиль скопирована");
    fireEvent.click(screen.getByRole("button", { name: "Действия с профилем" }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Поделиться/ }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(2));
    if (clipboard) Object.defineProperty(navigator, "clipboard", clipboard);
    else Reflect.deleteProperty(navigator, "clipboard");
  });

  it("offers logout only to the profile owner and closes the menu before calling it", () => {
    const onLogout = vi.fn().mockResolvedValue(undefined);
    const { rerender } = render(<PublicProfile profile={profile} posts={[]} likes={[]} loading={false} likesLoading={false} viewerId={profile.id} onOpenPost={vi.fn()} onToggleFollow={vi.fn()} onLogout={onLogout} />);
    fireEvent.click(screen.getByRole("button", { name: "Действия с профилем" }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Выйти/ }));
    expect(onLogout).toHaveBeenCalledOnce();
    expect(screen.queryByRole("menu")).toBeNull();

    rerender(<PublicProfile profile={profile} posts={[]} likes={[]} loading={false} likesLoading={false} viewerId={9} onOpenPost={vi.fn()} onToggleFollow={vi.fn()} onLogout={onLogout} />);
    fireEvent.click(screen.getByRole("button", { name: "Действия с профилем" }));
    expect(screen.queryByRole("menuitem", { name: /Выйти/ })).toBeNull();
  });

  it("loads real liked posts in the likes tab", () => {
    const { rerender } = render(
      <PublicProfile
        profile={profile}
        posts={[]}
        likes={[post]}
        loading={false}
        likesLoading={false}
        viewerId={profile.id}
        onOpenPost={vi.fn()}
        onToggleFollow={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Лайки" }));
    expect(screen.getByText("Гид по Бали")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Обложка: Гид по Бали" })).toBeTruthy();
    expect(screen.getByText("Понравилось 11.08.2026")).toBeTruthy();
    expect(screen.queryByText("Скоро здесь появятся понравившиеся публикации.")).toBeNull();

    rerender(
      <PublicProfile
        profile={profile}
        posts={[]}
        likes={[{ ...post, cover_url: "   " }]}
        loading={false}
        likesLoading={false}
        viewerId={profile.id}
        onOpenPost={vi.fn()}
        onToggleFollow={vi.fn()}
      />,
    );
    expect(screen.queryByRole("img", { name: "Обложка: Гид по Бали" })).toBeNull();
  });

  it("shows follower and following lists and toggles a listed person's follow state", async () => {
    const onToggleListFollow = vi.fn().mockResolvedValue(true);
    render(
      <PublicProfile
        profile={{ ...profile, is_following: true }}
        posts={[]}
        likes={[]}
        followers={[{ id: 11, name: "Новый подписчик", avatar_url: "/media/follower.webp", is_following: false }]}
        following={[{ id: 12, name: "Автор маршрутов", avatar_url: null, is_following: true }]}
        loading={false}
        likesLoading={false}
        followListsLoading={false}
        viewerId={9}
        onOpenPost={vi.fn()}
        onToggleFollow={vi.fn()}
        onToggleListFollow={onToggleListFollow}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Подписки" }));
    expect(screen.getByText("Новый подписчик")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Аватар Новый подписчик" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Подписаться" }));
    await waitFor(() => expect(onToggleListFollow).toHaveBeenCalledWith(11, false));
    expect(await screen.findByRole("button", { name: "Подписан" })).toBeTruthy();

    fireEvent.click(within(screen.getByRole("tablist", { name: "Списки подписок" })).getByRole("tab", { name: "Подписки" }));
    expect(screen.getByText("Автор маршрутов")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Подписан" })).toBeTruthy();
  });
});
