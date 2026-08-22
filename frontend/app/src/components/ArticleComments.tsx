import { useState } from "react";

import { type Comment, type ApiPost, useComments } from "../hooks";
import { RichTextContent } from "./RichTextContent";

const emoji = ["👍", "❤️", "🔥", "😂"];
type ArticleProps = { article: ApiPost; commentsModerationEnabled?: boolean; onBack: () => void; onError: (message: string) => void; onOpenProfile: (userId: number) => void; onToggleLike?: (post: ApiPost) => void };

export function ArticleComments({ article, commentsModerationEnabled = false, onBack, onError, onOpenProfile, onToggleLike = () => undefined }: ArticleProps) {
  const { comments, loading, react, create } = useComments(article.id);
  const [body, setBody] = useState("");

  const toggleReaction = async (comment: Comment, selectedEmoji: string) => {
    try {
      await react(comment.id, selectedEmoji);
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "Не удалось поставить реакцию");
    }
  };

  const send = async () => { try { const comment = await create(body); setBody(""); if (comment.status === "pending") onError("Комментарий отправлен на проверку"); } catch (cause) { onError(cause instanceof Error ? cause.message : "Не удалось отправить комментарий"); } };

  return <main className="article-page"><button className="back-link" onClick={onBack}>← В ленту</button><div className="article-hero"><span>Под солнцем</span></div><p className="post-tag">Статья</p><h1>{article.title}</h1><p className="article-byline">Материал подготовлен менеджерами агентства «Под солнцем»</p><RichTextContent html={article.body} className="article-body" /><button className="post-like-button article-like-button" onClick={() => onToggleLike(article)} aria-label={`Нравится: ${article.likes_count}`}>♥ <span>{article.likes_count}</span></button><div className="ornament"><i />◆<i /></div><section className="comments"><h2>Обсуждение</h2>{commentsModerationEnabled && <p>Комментарии публикуются после проверки менеджером.</p>}<div className="comment-form"><span className="avatar avatar-0" /><textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Спросить у менеджера или поделиться опытом…" /><button onClick={send} disabled={!body.trim()}>Отправить</button></div>{loading && <CommentSkeleton />}{!loading && comments.length === 0 && <div className="empty-comments">Комментариев пока нет — будьте первым.</div>}{comments.map((comment) => <CommentCard key={comment.id} comment={comment} onReaction={toggleReaction} onOpenProfile={onOpenProfile} />)}</section><section className="article-cta"><h2>Хотите так же, но без планирования?</h2><p>Расскажите боту про даты и бюджет — менеджер соберёт маршрут и пришлёт цены.</p><a href="https://t.me/pod_solncem_travel_bot" target="_blank" rel="noreferrer">Подобрать тур в боте →</a></section></main>;
}

function CommentCard({ comment, onReaction, onOpenProfile }: { comment: Comment; onReaction: (comment: Comment, emoji: string) => void; onOpenProfile: (userId: number) => void }) {
  return <article className="comment-card"><div className="avatar avatar-3" /><div><div className="comment-meta"><button className="author-profile-link" onClick={() => onOpenProfile(comment.author.id)}>{comment.author.name}</button><small>только что</small><em>одобрено</em></div><p>{comment.body}</p><div className="reactions">{emoji.map((item) => <button key={item} className={comment.my_reaction === item ? "chosen" : ""} onClick={() => onReaction(comment, item)} aria-pressed={comment.my_reaction === item}>{item}{comment.reactions[item] > 0 && <span>{comment.reactions[item]}</span>}</button>)}<button className="reply-button">Ответить</button></div></div></article>;
}

function CommentSkeleton() { return <div className="comment-skeleton"><i /><i /><i /></div>; }
