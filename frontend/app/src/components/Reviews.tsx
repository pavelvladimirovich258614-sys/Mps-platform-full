import { useRef, useState, type ReactNode } from "react";

import { apiForm } from "../api/client";
import { type Review, useReviews } from "../hooks";

const REVIEW_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif,image/avif";
const REVIEW_BODY_LIMIT = 1000;

type ReviewsProps = { canModerate: boolean; canTrackOwn?: boolean; onError: (message: string) => void; onPrivacy: () => void };

export function Reviews({ canModerate, canTrackOwn = true, onError, onPrivacy }: ReviewsProps) {
  const { value, loading, error, reload, create, pending, pendingLoading, pendingError, reloadPending, mine, mineLoading, mineError, reloadMine, moderate } = useReviews(canModerate, canTrackOwn);
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [moderatingIds, setModeratingIds] = useState<number[]>([]);
  const [moderationError, setModerationError] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);

  const uploadPhotos = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).slice(0, 2 - photoUrls.length);
    event.target.value = "";
    if (files.length === 0) return;
    setSubmitError("");
    setUploadingPhotos(true);
    try {
      for (const file of files) {
        const form = new FormData();
        form.append("file", file);
        const uploaded = await apiForm<{ url: string }>("/media", "POST", form);
        setPhotoUrls((current) => current.length < 2 ? [...current, uploaded.url] : current);
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Не удалось загрузить фотографию";
      setSubmitError(message);
      onError(message);
    } finally {
      setUploadingPhotos(false);
    }
  };

  const submit = async () => {
    if (!name.trim() || !body.trim() || !consent || submitting || uploadingPhotos) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      await create({ author_name: name, body, rating, photo_urls: photoUrls });
      setName("");
      setBody("");
      setPhotoUrls([]);
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

  const canSubmit = Boolean(name.trim() && body.trim() && consent) && !submitting && !uploadingPhotos;

  return <main className="section-page reviews-page">
    <h1>Отзывы</h1>
    <p className="page-description">Пишут те, кто ездил с нами. Каждый отзыв читает менеджер перед публикацией.</p>
    <section className="surface-card review-form">
      <h2>Оставить отзыв</h2>
      <p>Опубликуем после проверки менеджером — обычно в течение рабочего дня.</p>
      <div className="form-grid"><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Как вас зовут" /><textarea value={body} maxLength={REVIEW_BODY_LIMIT} onChange={(event) => setBody(event.target.value)} placeholder="Что понравилось, что нет — по-честному" /></div>
      <p className="review-character-count" aria-live="polite">{body.length} / {REVIEW_BODY_LIMIT}</p>
      <div className="review-photo-picker"><input ref={photoInputRef} type="file" multiple accept={REVIEW_IMAGE_ACCEPT} aria-label="Добавить фотографии к отзыву" disabled={uploadingPhotos || photoUrls.length === 2} onChange={(event) => void uploadPhotos(event)} /><button type="button" className="panel-button" disabled={uploadingPhotos || photoUrls.length === 2} onClick={() => photoInputRef.current?.click()}>{uploadingPhotos ? "Загружаем фото…" : "Добавить фото"}</button><small>До 2 фотографий</small></div>
      {photoUrls.length > 0 && <div className="review-photo-previews">{photoUrls.map((url, index) => <figure key={url}><img src={url} alt={`Фото отзыва ${index + 1}`} /><button type="button" aria-label={`Удалить фото ${index + 1}`} onClick={() => setPhotoUrls((current) => current.filter((_, currentIndex) => currentIndex !== index))}>Удалить</button></figure>)}</div>}
      <div className="form-actions"><div className="rating"><span>Оценка</span>{[1, 2, 3, 4, 5].map((star) => <button type="button" key={star} aria-label={`Оценка ${star}`} onClick={() => setRating(star)} className={star <= rating ? "star active" : "star"}>★</button>)}</div><label><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /> Согласен с <button type="button" onClick={onPrivacy}>политикой обработки данных</button></label><button className="panel-button" onClick={() => void submit()} disabled={!canSubmit}>{submitting ? "Отправляем…" : "Отправить"}</button></div>
      {submitError && <p className="review-error" role="alert">{submitError} <button onClick={() => void submit()} disabled={!canSubmit}>Повторить</button></p>}
    </section>
    {canTrackOwn && <section className="pending-section"><div className="section-heading"><h2>Мои отзывы</h2><span>{mine.length}</span></div>{mineLoading && <div className="comment-skeleton"><i /><i /></div>}{!mineLoading && mineError && <p className="review-error" role="alert">{mineError} <button onClick={() => void reloadMine()}>Повторить</button></p>}{!mineLoading && !mineError && mine.length === 0 && <p className="review-empty">Вы ещё не оставляли отзывов.</p>}{!mineLoading && !mineError && mine.map((review) => <ReviewCard key={review.id} review={review} showStatus />)}</section>}
    {canModerate && <section className="pending-section moderation-queue"><div className="section-heading"><h2>Отзывы на модерации</h2><span>{pending.length}</span></div>{pendingLoading && <div className="comment-skeleton"><i /><i /></div>}{!pendingLoading && pendingError && <p className="review-error" role="alert">{pendingError} <button onClick={() => void reloadPending()}>Повторить</button></p>}{!pendingLoading && !pendingError && pending.length === 0 && <p className="review-empty">Новых отзывов на модерации нет.</p>}{!pendingLoading && !pendingError && pending.map((review) => <ReviewCard key={review.id} review={review} actions={<><button aria-label={`Одобрить отзыв ${review.author_name}`} disabled={moderatingIds.includes(review.id)} onClick={() => void decideReview(review.id, "approve")}>Одобрить</button><button aria-label={`Отклонить отзыв ${review.author_name}`} disabled={moderatingIds.includes(review.id)} onClick={() => void decideReview(review.id, "reject")}>Отклонить</button></>} />)}{moderationError && <p className="review-error" role="alert">{moderationError}</p>}</section>}
    <section className="review-list">{loading && <div className="comment-skeleton"><i /><i /></div>}{!loading && error && <p className="review-error" role="alert">{error} <button onClick={() => void reload()}>Повторить</button></p>}{!loading && !error && (value ?? []).length === 0 && <p className="review-empty">Отзывов пока нет.</p>}{!loading && !error && (value ?? []).map((review) => <ReviewCard key={review.id} review={review} />)}</section>
  </main>;
}

const reviewStatus = {
  pending: { label: "На модерации", detail: "Ожидает проверки менеджером" },
  approved: { label: "Одобрен", detail: "Опубликован" },
  rejected: { label: "Не опубликован", detail: "Не опубликован по результатам проверки" },
};

function ReviewCard({ review, showStatus = false, actions }: { review: Review; showStatus?: boolean; actions?: ReactNode }) {
  const status = reviewStatus[review.status];
  const pending = review.status === "pending";
  return <article className={pending ? "review-card pending-review" : "review-card"}><header><span className="avatar avatar-1" /><div><strong>{review.author_name}</strong><small>{showStatus ? status.label : pending ? "ожидает проверки" : "проверено агентством"}</small></div><b>{"★".repeat(review.rating)}</b></header><p>{review.body}</p>{review.photo_urls.map((url, index) => <img className="review-photo" key={url} src={url} alt={`Фото отзыва ${review.author_name} ${index + 1}`} />)}{showStatus && <small className="pending-label">{status.detail}</small>}{actions && <footer className="review-moderation-actions">{actions}</footer>}</article>;
}
