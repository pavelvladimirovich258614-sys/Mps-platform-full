import { useEffect, useState } from "react";

import type { Post } from "../App";
import { type Comment, getComments, reactToComment } from "../api/comments";

const emoji = ["👍", "❤️", "🔥", "😂"];
type ArticleProps = { article: Post; onBack: () => void };

export function ArticleComments({ article, onBack }: ArticleProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getComments(article.id)
      .then((value) => { if (active) setComments(value); })
      .catch(() => { if (active) setComments([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [article.id]);

  const toggleReaction = async (comment: Comment, selectedEmoji: string) => {
    try {
      const result = await reactToComment(comment.id, selectedEmoji);
      setComments((current) => current.map((item) => item.id === comment.id ? { ...item, ...result } : item));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось поставить реакцию");
    }
  };

  return <main className="article-page"><button className="back-link" onClick={onBack}>← В ленту</button><div className="article-hero"><span>Ликийское побережье</span></div><p className="post-tag">{article.tag}</p><h1>{article.title}</h1><p className="article-byline">Материал подготовлен менеджерами агентства «Под солнцем»</p><p className="article-body"><span>{(article.text ?? "Л").slice(0, 1)}</span>{(article.text ?? "").slice(1)} Это время для спокойного моря, длинных прогулок и небольших бухт, которые летом невозможно увидеть без толпы.</p><div className="ornament"><i />◆<i /></div><blockquote>«Сезон на юге Турции не заканчивается в августе — он просто перестаёт быть многолюдным»</blockquote><section className="article-cta"><h2>Хотите так же, но без планирования?</h2><p>Расскажите боту про даты и бюджет — менеджер соберёт маршрут и пришлёт цены.</p><a href="https://t.me/pod_solncem_travel_bot" target="_blank" rel="noreferrer">Подобрать тур в боте →</a></section><section className="comments"><h2>Обсуждение</h2><p>Комментарии публикуются после проверки менеджером.</p><div className="comment-form"><span className="avatar avatar-0" /><textarea placeholder="Спросить у менеджера или поделиться опытом…" /><button>Отправить</button></div>{loading && <CommentSkeleton />}{!loading && comments.length === 0 && <div className="empty-comments">Комментариев пока нет — будьте первым.</div>}{comments.map((comment) => <CommentCard key={comment.id} comment={comment} onReaction={toggleReaction} />)}</section>{error && <div className="toast" role="alert">{error}</div>}</main>;
}

function CommentCard({ comment, onReaction }: { comment: Comment; onReaction: (comment: Comment, emoji: string) => void }) {
  return <article className="comment-card"><div className="avatar avatar-3" /><div><div className="comment-meta"><strong>{comment.author.name}</strong><small>только что</small><em>одобрено</em></div><p>{comment.body}</p><div className="reactions">{emoji.map((item) => <button key={item} className={comment.my_reaction === item ? "chosen" : ""} onClick={() => onReaction(comment, item)} aria-pressed={comment.my_reaction === item}>{item}{comment.reactions[item] > 0 && <span>{comment.reactions[item]}</span>}</button>)}<button className="reply-button">Ответить</button></div></div></article>;
}

function CommentSkeleton() { return <div className="comment-skeleton"><i /><i /><i /></div>; }
