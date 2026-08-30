import type { DiscoverySearchResponse } from "../hooks";

export type JournalSearchPanelProps = {
  query: string;
  results: DiscoverySearchResponse;
  loading: boolean;
  error: string;
  onQueryChange: (query: string) => void;
  onRetry: () => void;
  onOpenArticle: (slug: string) => void;
  onOpenProfile: (userId: number) => void;
  onOpenForumTopic: (countryId: number, topicId: number) => void;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const selected = parts.length === 1 ? parts : [parts[0], parts.at(-1) ?? ""];
  return selected.map((part) => part.charAt(0)).join("").toLocaleUpperCase("ru-RU");
}

function SearchIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></svg>;
}

export function JournalSearchPanel({
  query,
  results,
  loading,
  error,
  onQueryChange,
  onRetry,
  onOpenArticle,
  onOpenProfile,
  onOpenForumTopic,
}: JournalSearchPanelProps) {
  const termIsUseful = query.trim().length >= 2;
  const hasResults = results.articles.length > 0
    || results.authors.length > 0
    || results.forum_topics.length > 0;

  return (
    <aside className="journal-search-panel" role="search" aria-label="Поиск по журналу">
      <header><h2>Поиск по журналу</h2></header>
      <label className="journal-search-field">
        <span className="sr-only">Поиск по журналу</span>
        <SearchIcon />
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Статьи, авторы, темы"
          aria-label="Поиск по журналу"
          autoComplete="off"
        />
      </label>
      {!termIsUseful && <p className="rail-status">Ищите статьи, авторов и темы форума.</p>}
      {termIsUseful && loading && <p className="rail-status" role="status">Ищем по журналу…</p>}
      {termIsUseful && !loading && error && (
        <div className="rail-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={onRetry}>Повторить поиск</button>
        </div>
      )}
      {termIsUseful && !loading && !error && !hasResults && (
        <p className="rail-status">Ничего не найдено. Попробуйте изменить запрос.</p>
      )}
      {termIsUseful && !loading && !error && hasResults && (
        <div className="journal-search-results" aria-live="polite">
          {results.articles.length > 0 && (
            <section aria-label="Статьи">
              <h3>Статьи</h3>
              {results.articles.map((article) => (
                <button
                  type="button"
                  key={article.id}
                  onClick={() => onOpenArticle(article.slug)}
                  aria-label={`Открыть статью ${article.title}`}
                >
                  <span className="search-result-mark" aria-hidden="true">A</span>
                  <span>{article.title}</span>
                </button>
              ))}
            </section>
          )}
          {results.authors.length > 0 && (
            <section aria-label="Авторы">
              <h3>Авторы</h3>
              {results.authors.map((author) => {
                const displayName = author.name.trim() || "Путешественник";
                return (
                  <button
                    type="button"
                    key={author.id}
                    onClick={() => onOpenProfile(author.id)}
                    aria-label={`Открыть профиль ${displayName}`}
                  >
                    <span className="search-result-avatar">
                      {author.avatar_url
                        ? <img src={author.avatar_url} alt={`Аватар ${displayName}`} />
                        : <span aria-hidden="true">{initials(displayName)}</span>}
                    </span>
                    <span>{displayName}</span>
                  </button>
                );
              })}
            </section>
          )}
          {results.forum_topics.length > 0 && (
            <section aria-label="Темы форума">
              <h3>Темы форума</h3>
              {results.forum_topics.map((topic) => (
                <button
                  type="button"
                  key={topic.id}
                  onClick={() => onOpenForumTopic(topic.country_id, topic.id)}
                  aria-label={`Открыть тему ${topic.title}`}
                >
                  <span className="search-result-mark" aria-hidden="true">Ф</span>
                  <span>{topic.title}</span>
                </button>
              ))}
            </section>
          )}
        </div>
      )}
    </aside>
  );
}
