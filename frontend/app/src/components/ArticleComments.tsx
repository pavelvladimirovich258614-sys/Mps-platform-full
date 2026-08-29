import { useState } from "react";

import { type Comment, type ApiPost, useComments } from "../hooks";
import { RichTextContent } from "./RichTextContent";

const emoji = ["👍", "❤️", "🔥", "😂"];
type ArticleProps = { article: ApiPost; commentsModerationEnabled?: boolean; onBack: () => void; onError: (message: string) => void; onOpenProfile: (userId: number) => void; onToggleLike?: (post: ApiPost) => void; canManage?: boolean; onEdit?: (post: ApiPost) => void; onDelete?: (post: ApiPost) => Promise<void> };

export function ArticleComments({ article, commentsModerationEnabled = false, onBack, onError, onOpenProfile, onToggleLike = () => undefined, canManage = false, onEdit = () => undefined, onDelete = async () => undefined }: ArticleProps) {
  const { comments, loading, react, create } = useComments(article.id);
  const [body, setBody] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const coverUrl = article.cover_url?.trim();

  const toggleReaction = async (comment: Comment, selectedEmoji: string) => {
    try {
      await react(comment.id, selectedEmoji);
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "Не удалось поставить реакцию");
    }
  };

  const send = async () => { try { const comment = await create(body); setBody(""); if (comment.status === "pending") onError("Комментарий отправлен на проверку"); } catch (cause) { onError(cause instanceof Error ? cause.message : "Не удалось отправить комментарий"); } };
  const sendReply = async () => {
    if (!replyTo) return;
    try {
      const comment = await create(replyBody, replyTo.id);
      setReplyBody("");
      setReplyTo(null);
      if (comment.status === "pending") onError("Комментарий отправлен на проверку");
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "Не удалось отправить ответ");
    }
  };
  const commentIds = new Set(comments.map((comment) => comment.id));
  const rootComments = comments.filter((comment) => comment.parent_id === null || !commentIds.has(comment.parent_id));
  const repliesFor = (parentId: number) => comments.filter((comment) => comment.parent_id === parentId);

  return <main className="article-page"><button className="back-link" onClick={onBack}>← В ленту</button>{coverUrl && <img className="article-hero-image" src={coverUrl} alt={`Обложка: ${article.title}`} />}<p className="post-tag">Статья</p><h1>{article.title}</h1><p className="article-byline">Материал подготовлен менеджерами агентства «Под солнцем»</p>{canManage && <div className="article-management-actions"><button type="button" className="panel-button" onClick={() => onEdit(article)}>Редактировать</button><button type="button" className="danger-button" onClick={() => setDeleteConfirmOpen(true)}>Удалить</button></div>}<RichTextContent html={article.body} className="article-body" /><button className="post-like-button article-like-button" onClick={() => onToggleLike(article)} aria-label={`Нравится: ${article.likes_count}`}>♥ <span>{article.likes_count}</span></button><div className="ornament"><i />◆<i /></div><section className="comments"><h2>Обсуждение</h2>{commentsModerationEnabled && <p>Комментарии публикуются после проверки менеджером.</p>}<div className="comment-form"><span className="avatar avatar-0" /><textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Спросить у менеджера или поделиться опытом…" /><button onClick={send} disabled={!body.trim()}>Отправить</button></div>{loading && <CommentSkeleton />}{!loading && comments.length === 0 && <div className="empty-comments">Комментариев пока нет — будьте первым.</div>}{rootComments.map((comment) => <div className="comment-thread" key={comment.id}><CommentCard comment={comment} onReaction={toggleReaction} onOpenProfile={onOpenProfile} onReply={(selected) => { setReplyTo(selected); setReplyBody(""); }} />{replyTo?.id === comment.id && <ReplyComposer comment={comment} body={replyBody} onBodyChange={setReplyBody} onCancel={() => { setReplyTo(null); setReplyBody(""); }} onSend={sendReply} />}{repliesFor(comment.id).length > 0 && <div className="comment-replies">{repliesFor(comment.id).map((reply) => <CommentCard key={reply.id} comment={reply} onReaction={toggleReaction} onOpenProfile={onOpenProfile} />)}</div>}</div>)}</section><button type="button" className="back-link article-bottom-back-link" onClick={onBack}>← В ленту</button><section className="article-cta"><h2>Хотите так же, но без планирования?</h2><p>Расскажите боту про даты и бюджет — менеджер соберёт маршрут и пришлёт цены.</p><a href="https://t.me/pod_solncem_travel_bot" target="_blank" rel="noreferrer">Подобрать тур в боте →</a></section>{deleteConfirmOpen && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Удалить публикацию"><section className="delete-confirmation"><h2>Удалить публикацию?</h2><p>Это действие нельзя отменить</p><div><button type="button" className="panel-button" onClick={() => setDeleteConfirmOpen(false)}>Отмена</button><button type="button" className="danger-button" onClick={() => void onDelete(article)}>Подтвердить удаление</button></div></section></div>}</main>;
}

function CommentCard({ comment, onReaction, onOpenProfile, onReply }: { comment: Comment; onReaction: (comment: Comment, emoji: string) => void; onOpenProfile: (userId: number) => void; onReply?: (comment: Comment) => void }) {
  return <article className="comment-card"><div className="avatar avatar-3" /><div><div className="comment-meta"><button className="author-profile-link" onClick={() => onOpenProfile(comment.author.id)}>{comment.author.name}</button><small>только что</small><em>одобрено</em></div><p>{comment.body}</p><div className="reactions">{emoji.map((item) => <button key={item} className={comment.my_reaction === item ? "chosen" : ""} onClick={() => onReaction(comment, item)} aria-pressed={comment.my_reaction === item}>{item}{comment.reactions[item] > 0 && <span>{comment.reactions[item]}</span>}</button>)}{onReply && <button className="reply-button" onClick={() => onReply(comment)}>Ответить</button>}</div></div></article>;
}

function ReplyComposer({ comment, body, onBodyChange, onCancel, onSend }: { comment: Comment; body: string; onBodyChange: (body: string) => void; onCancel: () => void; onSend: () => Promise<void> }) {
  return <form className="reply-composer" onSubmit={(event) => { event.preventDefault(); void onSend(); }}><label><span>Ответ для {comment.author.name}</span><textarea aria-label={`Ответ для ${comment.author.name}`} value={body} onChange={(event) => onBodyChange(event.target.value)} placeholder="Напишите ответ…" /></label><div><button type="button" onClick={onCancel}>Отмена</button><button type="submit" disabled={!body.trim()}>Отправить ответ</button></div></form>;
}

function CommentSkeleton() { return <div className="comment-skeleton"><i /><i /><i /></div>; }
