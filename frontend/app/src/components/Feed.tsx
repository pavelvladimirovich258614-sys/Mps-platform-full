import { useEffect, useState } from "react";

import type { ApiPost, PostDraft } from "../hooks";
import { PostComposer, type EditablePost } from "./PostComposer";
import { RichTextContent } from "./RichTextContent";

type FeedProps = {
  mode?: "feed" | "fishki";
  posts: ApiPost[];
  loading: boolean;
  canCreate?: boolean;
  onCreatePost?: (post: PostDraft) => Promise<EditablePost | undefined>;
  onToggleLike: (post: ApiPost) => void;
  onOpenArticle: (post: ApiPost) => void;
  onOpenProfile: (userId: number) => void;
};
export function Feed({ mode = "feed", posts, loading, canCreate = false, onCreatePost, onToggleLike, onOpenArticle, onOpenProfile }: FeedProps) {
  const [composerOpen, setComposerOpen] = useState(false);
  const isFishki = mode === "fishki";
  const canOpenComposer = canCreate && !isFishki && Boolean(onCreatePost);
  const visiblePosts = isFishki ? posts.filter((post) => post.type === "fishka" || post.type === "tip") : posts;

  useEffect(() => {
    if (!composerOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setComposerOpen(false); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [composerOpen]);

  return <main className="feed-page"><div className="feed-wrap">
    {isFishki ? <section className="journal-intro"><p>Туристическое агентство «Под солнцем»</p><h1>Фишки</h1><div className="ornament"><i />◆<i /></div><div className="intro-text">Короткие советы от менеджеров, которые сами были в путешествии.</div></section> : <section className="journal-intro"><p>Туристическое агентство «Под солнцем»</p><h1>Журнал о путешествиях <b>без прикрас</b></h1><div className="ornament"><i />◆<i /></div><div className="intro-text">Реальные истории, честные отзывы и разборы направлений — живые впечатления от путешествий</div></section>}
    {canOpenComposer && <button type="button" className="create-post-button" aria-label="Создать публикацию" onClick={() => setComposerOpen(true)}>✦ Создать публикацию</button>}
    {composerOpen && onCreatePost && <ComposerModal onClose={() => setComposerOpen(false)} onCreate={onCreatePost} />}
    {!isFishki && <div className="feed-filters"><h2>Статьи</h2></div>}
    {loading && <div className="comment-skeleton"><i /><i /><i /></div>}
    {visiblePosts.map((post) => <PostCard key={post.id} post={post} onLike={() => onToggleLike(post)} onOpen={() => onOpenArticle(post)} onOpenProfile={() => onOpenProfile(post.author.id)} />)}
    {!loading && !visiblePosts.length && <div className="empty-comments">Публикаций в этом разделе пока нет.</div>}
    <section className="tour-cta"><div><h2>Подберём тур под ваш бюджет</h2><p>Ответьте на пять вопросов в боте — менеджер пришлёт три варианта с ценами.</p></div><a href="https://t.me/pod_solncem_travel_bot" target="_blank" rel="noreferrer">Подобрать тур →</a></section>
  </div></main>;
}

function ComposerModal({ onClose, onCreate }: { onClose: () => void; onCreate: (post: PostDraft) => Promise<EditablePost | undefined> }) {
  return <div className="modal-backdrop composer-modal-backdrop" role="dialog" aria-modal="true" aria-label="Создание публикации" onMouseDown={onClose}>
    <button type="button" className="composer-backdrop" aria-label="Закрыть создание публикации" />
    <section className="composer-modal" onMouseDown={(event) => event.stopPropagation()}>
      <button type="button" className="round-close" aria-label="Закрыть" onClick={onClose}>×</button>
      <PostComposer onCreate={onCreate} onClose={onClose} />
    </section>
  </div>;
}

function PostCard({ post, onLike, onOpen, onOpenProfile }: { post: ApiPost; onLike: () => void; onOpen: () => void; onOpenProfile: () => void }) {
  const kind = post.type === "video_review" ? "video" : post.type;
  if (kind === "fishka" || kind === "tip") return <article className="post-card tip-card"><div className="tip-mark">✦</div><div><p className="post-tag">Фишка</p><h2 onClick={onOpen}>{post.title}</h2><AuthorLink post={post} onOpenProfile={onOpenProfile} /><RichTextContent html={post.body} className="post-body-excerpt" /><PostActions likesCount={post.likes_count} onLike={onLike} onOpen={onOpen} /></div></article>;
  if (kind === "video") return <article className="post-card video-card"><div className="video-cover"><button aria-label="Смотреть видео">▶</button><span>Под солнцем</span>{post.shot_at && <b>Снято {new Date(post.shot_at).toLocaleDateString("ru-RU")}</b>}</div><h2 onClick={onOpen}>{post.title}</h2><AuthorLink post={post} onOpenProfile={onOpenProfile} /><RichTextContent html={post.body} className="post-body-excerpt" /><PostActions likesCount={post.likes_count} onLike={onLike} onOpen={onOpen} /></article>;
  const coverUrl = post.cover_url?.trim();
  return <article className="post-card article-card">{coverUrl ? <img className="article-cover-image" src={coverUrl} alt={`Обложка: ${post.title}`} /> : <div className="article-cover"><span>Под солнцем</span></div>}<p className="post-tag">Статья · {post.views} просмотров</p><h2 onClick={onOpen}>{post.title}</h2><AuthorLink post={post} onOpenProfile={onOpenProfile} /><RichTextContent html={post.body} className="post-body-excerpt" /><PostActions likesCount={post.likes_count} onLike={onLike} onOpen={onOpen} /></article>;
}

function AuthorLink({ post, onOpenProfile }: { post: ApiPost; onOpenProfile: () => void }) { return <button className="author-profile-link" onClick={onOpenProfile}>Автор: {post.author.name}</button>; }
function PostActions({ likesCount, onLike, onOpen }: { likesCount: number; onLike: () => void; onOpen: () => void }) { return <div className="post-actions"><button className="post-like-button" onClick={onLike} aria-label={`Нравится: ${likesCount}`}>♥ <span>{likesCount}</span></button><button onClick={onOpen}>Читать дальше →</button><button onClick={onOpen}>◌ Обсуждение</button></div>; }
