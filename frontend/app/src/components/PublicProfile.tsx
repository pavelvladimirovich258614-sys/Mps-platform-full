import { useEffect, useRef, useState } from "react";

import type { ApiPost, PublicProfile as PublicProfileData, PublicProfileActivity, PublicProfileComment, PublicProfileFollow, User } from "../hooks";
import { ResponsivePostImage } from "./ResponsivePostImage";
import { RichTextContent } from "./RichTextContent";

type Tab = "activity" | "posts" | "answers" | "likes" | "subscriptions";

type PublicProfileProps = {
  profile: PublicProfileData;
  posts: ApiPost[];
  likes: ApiPost[];
  activity?: PublicProfileActivity[];
  comments?: PublicProfileComment[];
  followers?: PublicProfileFollow[];
  following?: PublicProfileFollow[];
  loading: boolean;
  likesLoading: boolean;
  activityLoading?: boolean;
  activityLoadingMore?: boolean;
  activityHasMore?: boolean;
  commentsLoading?: boolean;
  followListsLoading?: boolean;
  viewerId: number | null;
  currentUser?: Pick<User, "id" | "role"> | null;
  onOpenPost: (post: ApiPost) => void;
  onLoadMoreActivity?: () => Promise<void> | void;
  onToggleFollow: () => Promise<void>;
  onToggleListFollow?: (userId: number, isFollowing: boolean) => Promise<boolean>;
  onEditProfile?: () => void;
  onLogout?: () => Promise<void>;
  onNotice?: (message: string) => void;
  isOnline?: boolean;
};

const tabs: Array<{ id: Tab; label: string; empty: string }> = [
  { id: "activity", label: "Активность", empty: "Пока нет активности. Здесь появятся ваши публикации, ответы, лайки и подписки." },
  { id: "posts", label: "Публикации", empty: "" },
  { id: "answers", label: "Ответы", empty: "Пока нет ответов. Ваши ответы появятся здесь." },
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

const replyStatusLabel: Record<PublicProfileComment["status"], string> = {
  approved: "Одобрен",
  pending: "На проверке",
  rejected: "Отклонён",
};

function formatReplyDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", { timeZone: "UTC" }).format(new Date(value));
}

function formatLikedDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", { timeZone: "UTC" }).format(new Date(value));
}

function activityText(item: PublicProfileActivity) {
  switch (item.event_type) {
    case "post_published": return `Опубликовал статью «${item.post?.title ?? "публикацию"}»`;
    case "comment_created": return `Ответил на «${item.comment?.post.title ?? "публикацию"}»: ${item.comment?.body ?? ""}`;
    case "post_liked": return `Лайкнул «${item.post?.title ?? "публикацию"}»`;
    case "user_followed": return `Подписался на ${item.user?.name ?? "пользователя"}`;
  }
}

const activityIcon: Record<PublicProfileActivity["event_type"], string> = {
  post_published: "✎",
  comment_created: "↳",
  post_liked: "♥",
  user_followed: "+",
};

export function PublicProfile({ profile, posts, likes, activity = [], comments = [], followers = [], following = [], loading, likesLoading, commentsLoading = false, activityLoading = false, activityLoadingMore = false, activityHasMore = false, followListsLoading = false, viewerId, currentUser = null, onOpenPost, onLoadMoreActivity, onToggleFollow, onToggleListFollow, onEditProfile, onLogout, onNotice, isOnline = false }: PublicProfileProps) {
  const [tab, setTab] = useState<Tab>("posts");
  const [followListTab, setFollowListTab] = useState<"followers" | "following">("followers");
  const [followPending, setFollowPending] = useState(false);
  const [listFollowPendingId, setListFollowPendingId] = useState<number | null>(null);
  const [listFollowOverrides, setListFollowOverrides] = useState<Record<number, boolean>>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const current = tabs.find((item) => item.id === tab) ?? tabs[1];
  const isOwner = viewerId === profile.id;
  const showingPosts = tab === "posts";
  const showingActivity = tab === "activity";
  const showingLikes = tab === "likes";
  const showingAnswers = tab === "answers";
  const showingSubscriptions = tab === "subscriptions";
  const visiblePosts = showingLikes ? likes : posts;
  const postsLoading = showingLikes ? likesLoading : loading;
  const visibleFollowList = followListTab === "followers" ? followers : following;
  const showReplyStatus = currentUser?.role === "admin" && currentUser.id === profile.id;
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
  const toggleListFollow = async (person: PublicProfileFollow) => {
    if (!onToggleListFollow) return;
    const isFollowing = listFollowOverrides[person.id] ?? person.is_following;
    setListFollowPendingId(person.id);
    try {
      const updated = await onToggleListFollow(person.id, isFollowing);
      setListFollowOverrides((current) => ({ ...current, [person.id]: updated }));
    } finally {
      setListFollowPendingId(null);
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

      {showingActivity ? (
        <section className="public-profile-activity" role="tabpanel" aria-label="Активность пользователя">
          {activityLoading && <div className="comment-skeleton"><i /><i /><i /></div>}
          {!activityLoading && activity.map((item) => (
            <article key={item.id} className="public-profile-activity-item">
              <span className="public-profile-activity-icon" aria-hidden="true">{activityIcon[item.event_type]}</span>
              <div>
                <p>{activityText(item)}</p>
                <time dateTime={item.created_at}>{formatReplyDate(item.created_at)}</time>
              </div>
            </article>
          ))}
          {!activityLoading && !activity.length && <p className="empty-comments">Пока нет активности. Здесь появятся ваши публикации, ответы, лайки и подписки.</p>}
          {!activityLoading && activityHasMore && <button className="public-profile-activity-more" onClick={() => void onLoadMoreActivity?.()} disabled={activityLoadingMore}>{activityLoadingMore ? "Загружаем…" : "Показать ещё"}</button>}
        </section>
      ) : (showingPosts || showingLikes) ? (
        <section className="public-profile-posts" aria-label={showingLikes ? "Понравившиеся публикации" : "Публикации пользователя"}>
          {postsLoading && <div className="comment-skeleton"><i /><i /><i /></div>}
          {!postsLoading && visiblePosts.map((post) => (
            <article key={post.id} className="public-profile-post">
              {showingLikes && post.cover_url?.trim() && <ResponsivePostImage className="public-profile-liked-cover" src={post.cover_url.trim()} alt={`Обложка: ${post.title}`} loading="lazy" />}
              <p className="post-tag">{post.type === "article" ? "Статья" : post.type === "video_review" ? "Видеообзор" : "Фишка"}</p>
              <h2>{post.title}</h2>
              {showingLikes && post.liked_at && <p className="public-profile-liked-date">Понравилось {formatLikedDate(post.liked_at)}</p>}
              <RichTextContent html={post.body} className="post-body-excerpt" />
              <button onClick={() => onOpenPost(post)} aria-label={`Читать публикацию: ${post.title}`}>Читать публикацию →</button>
            </article>
          ))}
          {!postsLoading && !visiblePosts.length && <p className="empty-comments">{showingLikes ? "Понравившихся публикаций пока нет." : "Публикаций пока нет."}</p>}
        </section>
      ) : showingAnswers ? (
        <section className="public-profile-replies" role="tabpanel" aria-label="Ответы пользователя">
          {commentsLoading && <div className="comment-skeleton"><i /><i /><i /></div>}
          {!commentsLoading && comments.map((comment) => (
            <article className="public-profile-reply" key={comment.id}>
              <div className="public-profile-reply-meta">
                <a href={`/posts/${comment.post.slug}`}>{comment.post.title}</a>
                <time dateTime={comment.created_at}>{formatReplyDate(comment.created_at)}</time>
                {showReplyStatus && <span className={`public-profile-reply-status ${comment.status}`}>{replyStatusLabel[comment.status]}</span>}
              </div>
              <p>{comment.body}</p>
            </article>
          ))}
          {!commentsLoading && !comments.length && <p className="empty-comments">Пока нет ответов. Ваши ответы появятся здесь.</p>}
        </section>
      ) : showingSubscriptions ? (
        <section className="public-profile-follow-lists" role="tabpanel" aria-label="Подписки пользователя">
          <div className="public-profile-follow-list-tabs" role="tablist" aria-label="Списки подписок">
            <button role="tab" aria-selected={followListTab === "followers"} className={followListTab === "followers" ? "current" : ""} onClick={() => setFollowListTab("followers")}>Подписчики</button>
            <button role="tab" aria-selected={followListTab === "following"} className={followListTab === "following" ? "current" : ""} onClick={() => setFollowListTab("following")}>Подписки</button>
          </div>
          {followListsLoading && <div className="comment-skeleton"><i /><i /><i /></div>}
          {!followListsLoading && visibleFollowList.map((person) => {
            const isFollowing = listFollowOverrides[person.id] ?? person.is_following;
            const pending = listFollowPendingId === person.id;
            return <article className="public-profile-follow-person" key={person.id}>
              <span className="public-profile-follow-avatar">{person.avatar_url ? <img src={person.avatar_url} alt={`Аватар ${person.name || "пользователя"}`} /> : <span aria-hidden="true" />}</span>
              <strong>{person.name || "Путешественник"}</strong>
              {viewerId !== person.id && onToggleListFollow && <button onClick={() => void toggleListFollow(person)} disabled={pending}>{pending ? "Сохраняем…" : isFollowing ? "Подписан" : "Подписаться"}</button>}
            </article>;
          })}
          {!followListsLoading && !visibleFollowList.length && <p className="empty-comments">{followListTab === "followers" ? "Подписчиков пока нет." : "Подписок пока нет."}</p>}
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
