import type { DraftSummary } from "../hooks";

export function Drafts({ drafts, loading, onOpen }: { drafts: DraftSummary[]; loading: boolean; onOpen: (draft: DraftSummary) => void }) {
  return <main className="feed-page"><div className="feed-wrap"><section className="journal-intro"><p>Для редактора</p><h1>Черновики</h1><div className="ornament"><i />◆<i /></div><div className="intro-text">Сохранённые материалы, которые ещё не опубликованы.</div></section>{loading && <div className="comment-skeleton"><i /><i /><i /></div>}{!loading && drafts.length === 0 && <div className="empty-comments">Черновиков пока нет.</div>}{drafts.map((draft) => <button type="button" className="surface-card" key={draft.id} onClick={() => onOpen(draft)}><strong>{draft.title}</strong><small>Обновлён {new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(draft.updated_at))}</small></button>)}</div></main>;
}
