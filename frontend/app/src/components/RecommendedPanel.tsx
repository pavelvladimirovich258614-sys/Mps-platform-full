import type { RecommendedAuthor } from "../hooks";

export type RecommendedPanelProps = {
  authors: RecommendedAuthor[];
  loading: boolean;
  error: string;
  followingId: number | null;
  onOpenProfile: (userId: number) => void;
  onFollow: (userId: number) => void | Promise<void>;
  onDismiss: (userId: number) => void;
  onRetry: () => void;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const selected = parts.length === 1 ? parts : [parts[0], parts.at(-1) ?? ""];
  return selected.map((part) => part.charAt(0)).join("").toLocaleUpperCase("ru-RU");
}

function CloseIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m7 7 10 10M17 7 7 17" /></svg>;
}

export function RecommendedPanel({
  authors,
  loading,
  error,
  followingId,
  onOpenProfile,
  onFollow,
  onDismiss,
  onRetry,
}: RecommendedPanelProps) {
  return (
    <aside className="recommended-panel" aria-label="Рекомендовано для вас">
      <header><h2>Рекомендовано для вас</h2></header>
      {loading && <p className="rail-status" role="status">Загружаем рекомендации…</p>}
      {!loading && error && (
        <div className="rail-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={onRetry} aria-label="Повторить загрузку рекомендаций">
            Повторить
          </button>
        </div>
      )}
      {!loading && !error && authors.length === 0 && (
        <p className="rail-status">Новых рекомендаций пока нет.</p>
      )}
      {!loading && !error && authors.length > 0 && (
        <div className="recommended-list">
          {authors.map((author) => {
            const displayName = author.name.trim() || "Путешественник";
            const pending = followingId === author.id;
            return (
              <article className="recommended-person" key={author.id}>
                <button
                  type="button"
                  className="recommended-profile"
                  onClick={() => onOpenProfile(author.id)}
                  aria-label={`Открыть профиль ${displayName}`}
                >
                  <span className="recommended-avatar">
                    {author.avatar_url
                      ? <img src={author.avatar_url} alt={`Аватар ${displayName}`} />
                      : <span aria-hidden="true">{initials(displayName)}</span>}
                  </span>
                  <span className="recommended-copy">
                    <strong>{displayName}</strong>
                    <span>{author.bio?.trim() || "Автор журнала"}</span>
                  </span>
                </button>
                <button
                  type="button"
                  className="recommended-follow"
                  disabled={pending}
                  onClick={() => void onFollow(author.id)}
                  aria-label={pending
                    ? `Подписка на ${displayName} выполняется`
                    : `Подписаться на ${displayName}`}
                >
                  {pending ? "Подписываем…" : "Подписаться"}
                </button>
                <button
                  type="button"
                  className="recommended-dismiss"
                  onClick={() => onDismiss(author.id)}
                  aria-label={`Скрыть рекомендацию ${displayName}`}
                >
                  <CloseIcon />
                </button>
              </article>
            );
          })}
        </div>
      )}
    </aside>
  );
}
