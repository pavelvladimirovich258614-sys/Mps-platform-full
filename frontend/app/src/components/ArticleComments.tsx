import { useState } from "react";

import { type Comment, type ApiPost, useComments } from "../hooks";

const emoji = ["👍", "❤️", "🔥", "😂"];
type ArticleProps = { article: ApiPost; onBack: () => void; onError: (message: string) => void };

export function ArticleComments({ article, onBack, onError }: ArticleProps) {
  const { comments, loading, react, create } = useComments(article.id);
  const [body, setBody] = useState("");

  const toggleReaction = async (comment: Comment, selectedEmoji: string) => {
    try {
      await react(comment.id, selectedEmoji);
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "Не удалось поставить реакцию");
    }
  };

  const send = async () => { try { await create(body); setBody(""); } catch (cause) { onError(cause instanceof Error ? cause.message : "Не удалось отправить комментарий"); } };

  return <main className="article-page"><button className="back-link" onClick={onBack}>← В ленту</button><div className="article-hero"><span>Под солнцем</span></div><p className="post-tag">Статья</p><h1>{article.title}</h1><p className="article-byline">Материал подготовлен менеджерами агентства «Под солнцем»</p><p className="article-body"><span>{article.body.slice(0, 1)}</span>{article.body.slice(1)}</p><div className="ornament"><i />◆<i /></div><section className="article-cta"><h2>Хотите так же, но без планирования?</h2><p>Расскажите боту про даты и бюджет — менеджер соберёт маршрут и пришлёт цены.</p><a href="https://t.me/pod_solncem_travel_bot" target="_blank" rel="noreferrer">Подобрать тур в боте →</a></section><section className="comments"><h2>Обсуждение</h2><p>Комментарии публикуются после проверки менеджером.</p><div className="comment-form"><span className="avatar avatar-0" /><textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Спросить у менеджера или поделиться опытом…" /><button onClick={send} disabled={!body.trim()}>Отправить</button></div>{loading && <CommentSkeleton />}{!loading && comments.length === 0 && <div className="empty-comments">Комментариев пока нет — будьте первым.</div>}{comments.map((comment) => <CommentCard key={comment.id} comment={comment} onReaction={toggleReaction} />)}</section></main>;
}

function CommentCard({ comment, onReaction }: { comment: Comment; onReaction: (comment: Comment, emoji: string) => void }) {
  return <article className="comment-card"><div className="avatar avatar-3" /><div><div className="comment-meta"><strong>{comment.author.name}</strong><small>только что</small><em>одобрено</em></div><p>{comment.body}</p><div className="reactions">{emoji.map((item) => <button key={item} className={comment.my_reaction === item ? "chosen" : ""} onClick={() => onReaction(comment, item)} aria-pressed={comment.my_reaction === item}>{item}{comment.reactions[item] > 0 && <span>{comment.reactions[item]}</span>}</button>)}<button className="reply-button">Ответить</button></div></div></article>;
}

function CommentSkeleton() { return <div className="comment-skeleton"><i /><i /><i /></div>; }
