import { useEffect, useState, type ReactNode } from "react";

import type { ApiPost, FishkaDraft, PostDraft } from "../hooks";
import { pathForRoute } from "../router";
import { FishkaComposer } from "./FishkaComposer";
import { PostComposer, type EditablePost } from "./PostComposer";
import { RichTextContent } from "./RichTextContent";

type FeedProps = {
  mode?: "feed" | "fishki";
  posts: ApiPost[];
  loading: boolean;
  canCreate?: boolean;
  onCreatePost?: (post: PostDraft) => Promise<EditablePost | undefined>;
  createPostRequested?: boolean;
  onCreatePostRequestHandled?: () => void;
  canCreateFishka?: boolean;
  fishkaPublishesImmediately?: boolean;
  fishkaAdminControls?: ReactNode;
  fishkaCategories?: string[];
  fishkaCategory?: string;
  onFishkaCategoryChange?: (category: string) => void;
  onCreateFishka?: (post: FishkaDraft) => Promise<void>;
  onToggleLike: (post: ApiPost) => void;
  onOpenArticle: (post: ApiPost) => void;
  onOpenProfile: (userId: number) => void;
  onNotice?: (message: string) => void;
};
export function Feed({ mode = "feed", posts, loading, canCreate = false, onCreatePost, createPostRequested = false, onCreatePostRequestHandled, canCreateFishka = false, fishkaPublishesImmediately = false, fishkaAdminControls, fishkaCategories = [], fishkaCategory = "", onFishkaCategoryChange, onCreateFishka, onToggleLike, onOpenArticle, onOpenProfile, onNotice }: FeedProps) {
  const [composerOpen, setComposerOpen] = useState(false);
  const [fishkaComposerOpen, setFishkaComposerOpen] = useState(false);
  const isFishki = mode === "fishki";
  const canOpenComposer = canCreate && !isFishki && Boolean(onCreatePost);
  const visiblePosts = isFishki ? posts.filter((post) => post.type === "fishka") : posts.filter((post) => post.type !== "fishka");

  useEffect(() => {
    if (!createPostRequested || !canOpenComposer) return;
    setComposerOpen(true);
    onCreatePostRequestHandled?.();
  }, [canOpenComposer, createPostRequested, onCreatePostRequestHandled]);

  useEffect(() => {
    if (!composerOpen && !fishkaComposerOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") { setComposerOpen(false); setFishkaComposerOpen(false); } };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [composerOpen, fishkaComposerOpen]);

  return <main className="feed-page"><div className="feed-wrap">
    {isFishki ? <section className="journal-intro"><p>Туристическое агентство «Под солнцем»</p><h1>Фишки</h1><div className="ornament"><i />◆<i /></div><div className="intro-text">Секреты удачных поездок — от тех, кто уже там побывал</div></section> : <section className="journal-intro"><p>Туристическое агентство «Под солнцем»</p><h1>Журнал о путешествиях <b>без прикрас</b></h1><div className="ornament"><i />◆<i /></div><div className="intro-text">Реальные истории, честные отзывы и разборы направлений — живые впечатления от путешествий</div></section>}
    {isFishki && fishkaAdminControls}
    {canOpenComposer && <button type="button" className="create-post-button" aria-label="Создать публикацию" onClick={() => setComposerOpen(true)}>✦ Создать публикацию</button>}
    {isFishki && canCreateFishka && onCreateFishka && <button type="button" className="create-post-button" aria-label="Добавить фишку" onClick={() => setFishkaComposerOpen(true)}>✦ Добавить фишку</button>}
    {isFishki && onFishkaCategoryChange && <label className="fishka-category-filter"><span>Тема</span><select aria-label="Тема" value={fishkaCategory} onChange={(event) => onFishkaCategoryChange(event.target.value)}><option value="">Все темы</option>{fishkaCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>}
    {composerOpen && onCreatePost && <ComposerModal onClose={() => setComposerOpen(false)} onCreate={onCreatePost} />}
    {fishkaComposerOpen && onCreateFishka && <FishkaComposerModal onClose={() => setFishkaComposerOpen(false)} publishesImmediately={fishkaPublishesImmediately} onCreate={onCreateFishka} />}
    {!isFishki && <div className="feed-filters"><h2>Статьи</h2></div>}
    {loading && <div className="comment-skeleton"><i /><i /><i /></div>}
    {visiblePosts.map((post) => <PostCard key={post.id} post={post} onLike={() => onToggleLike(post)} onOpen={() => onOpenArticle(post)} onOpenProfile={() => onOpenProfile(post.author.id)} onNotice={onNotice} />)}
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

function FishkaComposerModal({ onClose, publishesImmediately, onCreate }: { onClose: () => void; publishesImmediately: boolean; onCreate: (post: FishkaDraft) => Promise<void> }) {
  return <div className="modal-backdrop composer-modal-backdrop" role="dialog" aria-modal="true" aria-label="Создание фишки" onMouseDown={onClose}>
    <button type="button" className="composer-backdrop" aria-label="Закрыть создание фишки" />
    <section className="composer-modal fishka-composer-modal" onMouseDown={(event) => event.stopPropagation()}>
      <button type="button" className="round-close" aria-label="Закрыть" onClick={onClose}>×</button>
      <FishkaComposer publishesImmediately={publishesImmediately} onCreate={onCreate} onClose={onClose} />
    </section>
  </div>;
}

function PostCard({ post, onLike, onOpen, onOpenProfile, onNotice }: { post: ApiPost; onLike: () => void; onOpen: () => void; onOpenProfile: () => void; onNotice?: (message: string) => void }) {
  const kind = post.type === "video_review" ? "video" : post.type;
  const share = async () => {
    const url = new URL(pathForRoute({ page: "article", slug: post.slug }), window.location.origin).toString();
    const copied = await copyText(url);
    onNotice?.(copied ? "Ссылка на публикацию скопирована" : "Не удалось скопировать ссылку");
  };
  if (kind === "fishka") return <article className="post-card tip-card"><div className="tip-mark">{post.emoji ?? "✦"}</div><div><p className="post-tag">Фишка</p><h2 onClick={onOpen}>{post.title}</h2><AuthorLink post={post} onOpenProfile={onOpenProfile} /><RichTextContent html={post.body} className="post-body-excerpt" preview /><PostActions likesCount={post.likes_count} onLike={onLike} onOpen={onOpen} onShare={share} /></div></article>;
  if (kind === "video") return <article className="post-card video-card"><div className="video-cover"><button aria-label="Смотреть видео">▶</button><span>Под солнцем</span>{post.shot_at && <b>Снято {new Date(post.shot_at).toLocaleDateString("ru-RU")}</b>}</div><h2 onClick={onOpen}>{post.title}</h2><AuthorLink post={post} onOpenProfile={onOpenProfile} /><RichTextContent html={post.body} className="post-body-excerpt" preview /><PostActions likesCount={post.likes_count} onLike={onLike} onOpen={onOpen} onShare={share} /></article>;
  const coverUrl = post.cover_url?.trim();
  return <article className="post-card article-card">{coverUrl && <img className="article-cover-image" src={coverUrl} alt={`Обложка: ${post.title}`} />}<p className="post-tag">Статья · {post.views} просмотров</p><h2 onClick={onOpen}>{post.title}</h2><AuthorLink post={post} onOpenProfile={onOpenProfile} /><RichTextContent html={post.body} className="post-body-excerpt" preview collapseCarouselInPreview={Boolean(coverUrl)} /><PostActions likesCount={post.likes_count} onLike={onLike} onOpen={onOpen} onShare={share} /></article>;
}

function AuthorLink({ post, onOpenProfile }: { post: ApiPost; onOpenProfile: () => void }) { return <button className="author-profile-link" onClick={onOpenProfile}>Автор: {post.author.name}</button>; }
function PostActions({ likesCount, onLike, onOpen, onShare }: { likesCount: number; onLike: () => void; onOpen: () => void; onShare: () => Promise<void> }) { return <div className="post-actions"><button className="post-like-button" onClick={onLike} aria-label={`Нравится: ${likesCount}`}>♥ <span>{likesCount}</span></button><button onClick={onOpen}>Читать дальше →</button><button onClick={onOpen}>◌ Обсуждение</button><button onClick={() => void onShare()}>Поделиться</button></div>; }

async function copyText(value: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Continue with the compatibility path below.
    }
  }
  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.append(field);
  field.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    field.remove();
  }
}
