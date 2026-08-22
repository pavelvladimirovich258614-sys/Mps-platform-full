import { useState } from "react";

import type { ApiPost, PublicProfile as PublicProfileData } from "../hooks";

type Tab = "activity" | "posts" | "answers" | "likes" | "subscriptions";

type PublicProfileProps = {
  profile: PublicProfileData;
  posts: ApiPost[];
  loading: boolean;
  viewerId: number | null;
  onOpenPost: (post: ApiPost) => void;
  onToggleFollow: () => Promise<void>;
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

export function PublicProfile({ profile, posts, loading, viewerId, onOpenPost, onToggleFollow }: PublicProfileProps) {
  const [tab, setTab] = useState<Tab>("posts");
  const [followPending, setFollowPending] = useState(false);
  const current = tabs.find((item) => item.id === tab) ?? tabs[1];
  const canFollow = viewerId !== profile.id;
  const toggleFollow = async () => {
    setFollowPending(true);
    try {
      await onToggleFollow();
    } finally {
      setFollowPending(false);
    }
  };

  return (
    <main className="public-profile-page">
      <section className="public-profile-header">
        <span className="public-profile-avatar">
          {profile.avatar_url && <img src={profile.avatar_url} alt={`Аватар ${profile.name || "пользователя"}`} />}
        </span>
        <div>
          <p className="profile-kicker">Профиль путешественника</p>
          <h1>{profile.name || "Путешественник"}</h1>
          {profile.bio && <p className="public-profile-bio">{profile.bio}</p>}
          <p className="public-profile-count">{countLabel(profile.posts_count, "публикация", "публикации", "публикаций")}</p>
          <div className="public-profile-social">
            <span>{countLabel(profile.followers_count, "подписчик", "подписчика", "подписчиков")}</span>
            <span>{countLabel(profile.following_count, "подписка", "подписки", "подписок")}</span>
          </div>
          {canFollow && (
            <button className="public-profile-follow" onClick={() => void toggleFollow()} disabled={followPending}>
              {followPending ? "Сохраняем…" : profile.is_following ? "Отписаться" : "Подписаться"}
            </button>
          )}
        </div>
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

      {tab === "posts" ? (
        <section className="public-profile-posts" aria-label="Публикации пользователя">
          {loading && <div className="comment-skeleton"><i /><i /><i /></div>}
          {!loading && posts.map((post) => (
            <article key={post.id} className="public-profile-post">
              <p className="post-tag">{post.type === "article" ? "Статья" : post.type === "video_review" ? "Видеообзор" : "Фишка"}</p>
              <h2>{post.title}</h2>
              <p>{post.body}</p>
              <button onClick={() => onOpenPost(post)} aria-label={`Читать публикацию: ${post.title}`}>Читать публикацию →</button>
            </article>
          ))}
          {!loading && !posts.length && <p className="empty-comments">Публикаций пока нет.</p>}
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
