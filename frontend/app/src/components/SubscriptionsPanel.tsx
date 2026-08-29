import type { PublicProfileFollow } from "../hooks";

type SubscriptionsPanelProps = {
  subscriptions: PublicProfileFollow[];
  loading: boolean;
  onOpenProfile: (userId: number) => void;
  onShowAll: () => void;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const selected = parts.length === 1 ? parts : [parts[0], parts.at(-1) ?? ""];
  return selected.map((part) => part.charAt(0)).join("").toLocaleUpperCase("ru-RU");
}

export function SubscriptionsPanel({ subscriptions, loading, onOpenProfile, onShowAll }: SubscriptionsPanelProps) {
  const visibleSubscriptions = subscriptions.slice(0, 8);

  return <aside className="subscriptions-panel" aria-label="Подписки">
    <header>
      <h2>Подписки</h2>
      <button type="button" onClick={onShowAll}>Показать все</button>
    </header>
    {loading && <p className="subscriptions-status">Загружаем подписки…</p>}
    {!loading && !visibleSubscriptions.length && <p className="subscriptions-status">Подписок пока нет.</p>}
    {!loading && visibleSubscriptions.length > 0 && <div className="subscriptions-grid">
      {visibleSubscriptions.map((person) => {
        const displayName = person.name.trim() || "Путешественник";
        return <button
          type="button"
          className="subscription-person"
          key={person.id}
          onClick={() => onOpenProfile(person.id)}
          aria-label={`Открыть профиль ${displayName}`}
          title={displayName}
        >
          <span className={`subscription-avatar subscription-avatar-${person.id % 6}`} aria-hidden="true">{initials(displayName)}</span>
          <span>{displayName}</span>
        </button>;
      })}
    </div>}
  </aside>;
}
