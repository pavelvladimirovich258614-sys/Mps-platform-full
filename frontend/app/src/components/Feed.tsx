import { useState } from "react";

import type { Post } from "../App";

type FeedProps = { posts: Post[]; onOpenArticle: (postId: number) => void };
type Filter = "all" | Post["kind"];
const filters: Array<{ id: Filter; label: string }> = [{ id: "all", label: "Все" }, { id: "article", label: "Статьи" }, { id: "tip", label: "Фишки" }, { id: "video", label: "Видеообзоры" }];

export function Feed({ posts, onOpenArticle }: FeedProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const visiblePosts = filter === "all" ? posts : posts.filter((post) => post.kind === filter);
  return <main className="feed-page"><div className="feed-wrap"><section className="journal-intro"><p>Туристическое агентство «Под солнцем»</p><h1>Журнал о путешествиях <b>без прикрас</b></h1><div className="ornament"><i />◆<i /></div><div className="intro-text">Короткие фишки, проверенные отзывы и большие разборы направлений — от менеджеров, которые сами там были.</div></section><div className="mobile-presence" aria-label="Сейчас онлайн">{[0, 1, 2, 3, 4].map((index) => <span className={`avatar avatar-${index % 4}`} key={index}><i /></span>)}</div><div className="feed-filters">{filters.map((item) => <button key={item.id} onClick={() => setFilter(item.id)} className={filter === item.id ? "current" : ""}>{item.label}</button>)}</div>{visiblePosts.map((post) => <PostCard key={post.id} post={post} onOpenArticle={onOpenArticle} />)}<section className="tour-cta"><div><h2>Подберём тур под ваш бюджет</h2><p>Ответьте на пять вопросов в боте — менеджер пришлёт три варианта с ценами.</p></div><a href="https://t.me/pod_solncem_travel_bot" target="_blank" rel="noreferrer">Подобрать тур →</a></section></div></main>;
}

function PostCard({ post, onOpenArticle }: { post: Post; onOpenArticle: (postId: number) => void }) {
  if (post.kind === "tip") return <article className="post-card tip-card"><div className="tip-mark">✦</div><div><p className="post-tag">{post.tag}</p><h2 onClick={() => onOpenArticle(post.id)}>{post.title}</h2><p>{post.text}</p><PostActions onOpen={() => onOpenArticle(post.id)} /></div></article>;
  if (post.kind === "video") return <article className="post-card video-card"><div className="video-cover"><button aria-label="Смотреть видео">▶</button><span>Под солнцем</span><b>Снято {post.videoDate}</b>{post.byRequest && <em>По запросу туриста</em>}</div><h2>{post.title}</h2><p>{post.flag} {post.country}</p><div className="video-request">Наш сотрудник на месте. Хотите свежий обзор другого отеля? <a href="#request">Оставить запрос →</a></div></article>;
  return <article className="post-card article-card"><div className="article-cover"><span>Ликийское побережье</span></div><p className="post-tag">{post.tag}</p><h2 onClick={() => onOpenArticle(post.id)}>{post.title}</h2><p>{post.text}</p><PostActions onOpen={() => onOpenArticle(post.id)} /></article>;
}
function PostActions({ onOpen }: { onOpen: () => void }) { return <div className="post-actions"><button onClick={onOpen}>Читать дальше →</button><button>♡ Полезно</button><button onClick={onOpen}>◌ Обсуждение</button></div>; }
