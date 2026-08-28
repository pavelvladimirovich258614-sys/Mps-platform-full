import { useState, type ReactNode } from "react";

import { type Review, useReviews } from "../hooks";

type ReviewsProps = {
  canModerate: boolean;
  onError: (message: string) => void;
  onPrivacy: () => void;
};

export function Reviews({ canModerate, onError, onPrivacy }: ReviewsProps) {
  const { value, loading, error, reload, create, pending, pendingLoading, pendingError, reloadPending, moderate } = useReviews(canModerate);
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [consent, setConsent] = useState(false);
  const [submittedPending, setSubmittedPending] = useState<Review[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [moderatingIds, setModeratingIds] = useState<number[]>([]);
  const [moderationError, setModerationError] = useState("");

  const submit = async () => {
    if (!name.trim() || !body.trim() || !consent || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const review = await create({ author_name: name, body, rating });
      setSubmittedPending((items) => [review, ...items]);
      setName("");
      setBody("");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Не удалось отправить отзыв";
      setSubmitError(message);
      onError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const decideReview = async (reviewId: number, action: "approve" | "reject") => {
    if (moderatingIds.includes(reviewId)) return;
    setModeratingIds((ids) => [...ids, reviewId]);
    setModerationError("");
    try {
      await moderate(reviewId, action);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Не удалось модерировать отзыв";
      setModerationError(message);
      onError(message);
    } finally {
      setModeratingIds((ids) => ids.filter((id) => id !== reviewId));
    }
  };

  const canSubmit = Boolean(name.trim() && body.trim() && consent) && !submitting;

  return <main className="section-page reviews-page">
    <h1>Отзывы</h1>
    <p className="page-description">Пишут те, кто ездил с нами. Каждый отзыв читает менеджер перед публикацией.</p>
    <section className="surface-card review-form">
      <h2>Оставить отзыв</h2>
      <p>Опубликуем после проверки менеджером — обычно в течение рабочего дня.</p>
      <div className="form-grid"><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Как вас зовут" /><textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Что понравилось, что нет — по-честному" /></div>
      <div className="form-actions"><div className="rating"><span>Оценка</span>{[1, 2, 3, 4, 5].map((star) => <button key={star} aria-label={`Оценка ${star}`} onClick={() => setRating(star)} className={star <= rating ? "star active" : "star"}>★</button>)}</div><label><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /> Согласен с <button onClick={onPrivacy}>политикой обработки данных</button></label><button className="panel-button" onClick={() => void submit()} disabled={!canSubmit}>{submitting ? "Отправляем…" : "Отправить"}</button></div>
      {submitError && <p className="review-error" role="alert">{submitError} <button onClick={() => void submit()} disabled={!canSubmit}>Повторить</button></p>}
    </section>
    {submittedPending.length > 0 && <section className="pending-section"><div className="section-heading"><h2>На проверке</h2><span>{submittedPending.length}</span></div>{submittedPending.map((review) => <ReviewCard key={review.id} review={review} pending />)}</section>}
    {canModerate && <section className="pending-section moderation-queue"><div className="section-heading"><h2>Отзывы на модерации</h2><span>{pending.length}</span></div>{pendingLoading && <div className="comment-skeleton"><i /><i /></div>}{!pendingLoading && pendingError && <p className="review-error" role="alert">{pendingError} <button onClick={() => void reloadPending()}>Повторить</button></p>}{!pendingLoading && !pendingError && pending.length === 0 && <p className="review-empty">Новых отзывов на модерации нет.</p>}{!pendingLoading && !pendingError && pending.map((review) => <ReviewCard key={review.id} review={review} actions={<><button aria-label={`Одобрить отзыв ${review.author_name}`} disabled={moderatingIds.includes(review.id)} onClick={() => void decideReview(review.id, "approve")}>Одобрить</button><button aria-label={`Отклонить отзыв ${review.author_name}`} disabled={moderatingIds.includes(review.id)} onClick={() => void decideReview(review.id, "reject")}>Отклонить</button></>} />)}{moderationError && <p className="review-error" role="alert">{moderationError}</p>}</section>}
    <section className="review-list">{loading && <div className="comment-skeleton"><i /><i /></div>}{!loading && error && <p className="review-error" role="alert">{error} <button onClick={() => void reload()}>Повторить</button></p>}{!loading && !error && (value ?? []).length === 0 && <p className="review-empty">Отзывов пока нет.</p>}{!loading && !error && (value ?? []).map((review) => <ReviewCard key={review.id} review={review} />)}</section>
  </main>;
}

function ReviewCard({ review, pending = false, actions }: { review: Review; pending?: boolean; actions?: ReactNode }) { return <article className={pending ? "review-card pending-review" : "review-card"}><header><span className="avatar avatar-1" /><div><strong>{review.author_name}</strong><small>{pending ? "ожидает проверки" : "проверено агентством"}</small></div><b>{"★".repeat(review.rating)}</b></header><p>{review.body}</p>{pending && <small className="pending-label">ждёт проверки менеджером</small>}{actions && <footer className="review-moderation-actions">{actions}</footer>}</article>; }
