import { useState } from "react";

import type { DraftSummary } from "../hooks";

export function Drafts({ drafts, loading, error, onRetry, onOpen, onDelete }: { drafts: DraftSummary[]; loading: boolean; error: string; onRetry: () => void; onOpen: (draft: DraftSummary) => void; onDelete: (draft: DraftSummary) => Promise<void> }) {
  const [deleteConfirm, setDeleteConfirm] = useState<DraftSummary | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteError("");
    try {
      await onDelete(deleteConfirm);
      setDeleteConfirm(null);
    } catch (cause) {
      setDeleteError(cause instanceof Error ? cause.message : "Не удалось удалить черновик");
    }
  };

  return <main className="feed-page"><div className="feed-wrap"><section className="journal-intro"><p>Для редактора</p><h1>Черновики</h1><div className="ornament"><i />◆<i /></div><div className="intro-text">Сохранённые материалы, которые ещё не опубликованы.</div></section>{loading && <div className="comment-skeleton"><i /><i /><i /></div>}{!loading && error && <div className="empty-comments" role="alert"><p>{error}</p><button type="button" className="panel-button" onClick={onRetry}>Повторить</button></div>}{!loading && !error && drafts.length === 0 && <div className="empty-comments">Черновиков пока нет.</div>}{drafts.map((draft) => <article className="surface-card draft-card" key={draft.id}><button type="button" className="draft-open" onClick={() => onOpen(draft)}><strong>{draft.title}</strong><small>Обновлён {new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(draft.updated_at))}</small></button><button type="button" className="danger-button draft-delete" aria-label={`Удалить черновик: ${draft.title}`} onClick={() => { setDeleteError(""); setDeleteConfirm(draft); }}>Удалить</button></article>)}</div>{deleteConfirm && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Удалить черновик"><section className="delete-confirmation"><h2>Удалить черновик?</h2><p>Это действие нельзя отменить</p>{deleteError && <p role="alert">{deleteError}</p>}<div><button type="button" className="panel-button" onClick={() => setDeleteConfirm(null)}>Отмена</button><button type="button" className="danger-button" onClick={() => void confirmDelete()}>Подтвердить удаление</button></div></section></div>}</main>;
}
