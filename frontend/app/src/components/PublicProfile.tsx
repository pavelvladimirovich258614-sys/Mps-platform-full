import { useEffect, useRef, useState } from "react";

import type { ApiPost, PublicProfile as PublicProfileData } from "../hooks";
import { RichTextContent } from "./RichTextContent";

type Tab = "activity" | "posts" | "answers" | "likes" | "subscriptions";

type PublicProfileProps = {
  profile: PublicProfileData;
  posts: ApiPost[];
  likes: ApiPost[];
  loading: boolean;
  likesLoading: boolean;
  viewerId: number | null;
  onOpenPost: (post: ApiPost) => void;
  onToggleFollow: () => Promise<void>;
  onEditProfile?: () => void;
  onLogout?: () => Promise<void>;
  onNotice?: (message: string) => void;
  isOnline?: boolean;
};

const tabs: Array<{ id: Tab; label: string; empty: string }> = [
  { id: "activity", label: "Активность", empty: "Скоро здесь появится активность пользователя." },
  { id: "posts", label: "Публикации", empty: "" },
  { id: "answers", label: "Ответы", empty: "Скоро здесь появятся ответы пользователя." },
  { id: "likes", label: "Лайки", empty: "Скоро здесь появятся понравившиеся публикации." },
  { id: "subscriptions", label: "Подписки", empty: "Скоро здесь появятся подписки пользователя." },
];

function countLabel(count: number, singular: string, few: string, many: string) {
  const remainder = count % 100;
  if (remainder >= 11 && remainder <= 14) return `${count} ${many}`;
  if (count % 10 === 1) return `${count} ${singular}`;
  if (count % 10 >= 2 && count % 10 <= 4) return `${count} ${few}`;
  return `${count} ${many}`;
}

export function PublicProfile({ profile, posts, likes, loading, likesLoading, viewerId, onOpenPost, onToggleFollow, onEditProfile, onLogout, onNotice, isOnline = false }: PublicProfileProps) {
  const [tab, setTab] = useState<Tab>("posts");
  const [followPending, setFollowPending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const current = tabs.find((item) => item.id === tab) ?? tabs[1];
  const isOwner = viewerId === profile.id;
  const showingPosts = tab === "posts";
  const showingLikes = tab === "likes";
  const visiblePosts = showingLikes ? likes : posts;
  const postsLoading = showingLikes ? likesLoading : loading;
  const profileUrl = new URL(`/users/${profile.id}`, window.location.origin).href;

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    const closeOnOutsideClick = (event: MouseEvent) => { if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false); };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => { document.removeEventListener("keydown", closeOnEscape); document.removeEventListener("mousedown", closeOnOutsideClick); };
  }, [menuOpen]);
  const toggleFollow = async () => {
    setFollowPending(true);
    try {
      await onToggleFollow();
    } finally {
      setFollowPending(false);
    }
  };

  const copyLink = async () => {
    setMenuOpen(false);
    try { await navigator.clipboard.writeText(profileUrl); onNotice?.("Ссылка на профиль скопирована"); }
    catch { onNotice?.("Не удалось скопировать ссылку"); }
  };
  const shareLink = async () => {
    if (!navigator.share) { await copyLink(); return; }
    setMenuOpen(false);
    try { await navigator.share({ title: profile.name || "Профиль путешественника", url: profileUrl }); onNotice?.("Ссылка на профиль отправлена"); }
    catch (cause) { if (!(cause instanceof DOMException && cause.name === "AbortError")) onNotice?.("Не удалось поделиться ссылкой"); }
  };
  const logout = async () => { setMenuOpen(false); await onLogout?.(); };

  return (
    <main className="public-profile-page">
      <section className="public-profile-header">
        <div className="public-profile-summary">
          <h1>{profile.name || "Путешественник"}</h1>
          {profile.bio && <p className="public-profile-bio">{profile.bio}</p>}
          <p className="public-profile-count">{countLabel(profile.posts_count, "публикация", "публикации", "публикаций")}</p>
          <p className="public-profile-followers">Посмотреть подписчиков · {profile.followers_count}</p>
          <div className="public-profile-social">
            <span>{countLabel(profile.followers_count, "подписчик", "подписчика", "подписчиков")}</span>
            <span>{countLabel(profile.following_count, "подписка", "подписки", "подписок")}</span>
          </div>
          <div className="public-profile-actions">
            {isOwner ? <button className="public-profile-edit" onClick={onEditProfile}>Редактировать профиль</button> : (
              <button className="public-profile-follow" onClick={() => void toggleFollow()} disabled={followPending}>{followPending ? "Сохраняем…" : profile.is_following ? "Отписаться" : "Подписаться"}</button>
            )}
            <div className="public-profile-menu" ref={menuRef}>
              <button className="public-profile-menu-button" aria-label="Действия с профилем" aria-expanded={menuOpen} aria-controls="profile-actions-menu" onClick={() => setMenuOpen(!menuOpen)}>•••</button>
              {menuOpen && <div className="public-profile-menu-popover" id="profile-actions-menu" role="menu">
                <button role="menuitem" onClick={() => void copyLink()}>⌁ <span>Скопировать ссылку</span></button>
                <button role="menuitem" onClick={() => void shareLink()}>⇧ <span>Поделиться</span></button>
                {isOwner && onLogout && <button role="menuitem" onClick={() => void logout()}>↪ <span>Выйти</span></button>}
              </div>}
            </div>
          </div>
        </div>
        <span className="public-profile-avatar-wrap"><span className="public-profile-avatar">{profile.avatar_url && <img src={profile.avatar_url} alt={`Аватар ${profile.name || "пользователя"}`} />}</span>{isOnline && <i className="online-indicator" aria-label={`${profile.name || "Путешественник"} сейчас на платформе`} />}</span>
      </section>

      {profile.countries.length > 0 && (
        <section className="public-profile-countries" aria-label="Направления в публикациях">
          <h2>Направления в публикациях</h2>
          <div className="country-chips">
            {profile.countries.map((country) => <span key={country.id}>{country.flag_emoji} {country.name}</span>)}
          </div>
        </section>
      )}

      <div className="public-profile-tabs" role="tablist" aria-label="Разделы профиля">
        {tabs.map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? "current" : ""}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {(showingPosts || showingLikes) ? (
        <section className="public-profile-posts" aria-label={showingLikes ? "Понравившиеся публикации" : "Публикации пользователя"}>
          {postsLoading && <div className="comment-skeleton"><i /><i /><i /></div>}
          {!postsLoading && visiblePosts.map((post) => (
            <article key={post.id} className="public-profile-post">
              <p className="post-tag">{post.type === "article" ? "Статья" : post.type === "video_review" ? "Видеообзор" : "Фишка"}</p>
              <h2>{post.title}</h2>
              <RichTextContent html={post.body} className="post-body-excerpt" />
              <button onClick={() => onOpenPost(post)} aria-label={`Читать публикацию: ${post.title}`}>Читать публикацию →</button>
            </article>
          ))}
          {!postsLoading && !visiblePosts.length && <p className="empty-comments">{showingLikes ? "Понравившихся публикаций пока нет." : "Публикаций пока нет."}</p>}
        </section>
      ) : (
        <section className="public-profile-empty" role="tabpanel">
          <h2>{current.label}</h2>
          <p>{current.empty}</p>
        </section>
      )}
    </main>
  );
}
