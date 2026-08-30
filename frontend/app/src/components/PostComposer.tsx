import { useEffect, useRef, useState } from "react";

import { apiForm } from "../api/client";
import { ResponsivePostImage } from "./ResponsivePostImage";
import { RichTextEditor } from "./RichTextEditor";

const COVER_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif,image/avif";

export type PostDraft = { title: string; type: "article"; body: string; status: "draft" | "published"; cover_url?: string | null };
export type EditablePost = PostDraft & { id: number };
type PostComposerProps = { onCreate?: (post: PostDraft) => Promise<EditablePost | undefined>; initialPost?: EditablePost; onUpdate?: (post: PostDraft) => Promise<EditablePost | undefined>; onClose?: () => void };

export function PostComposer({ onCreate, initialPost, onUpdate, onClose }: PostComposerProps) {
  const [currentPost, setCurrentPost] = useState(initialPost);
  const editing = Boolean(currentPost);
  const [title, setTitle] = useState(initialPost?.title ?? "");
  const [body, setBody] = useState(initialPost?.body ?? "<p></p>");
  const [coverUrl, setCoverUrl] = useState(initialPost?.cover_url ?? null);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [notice, setNotice] = useState("");
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentPost(initialPost);
    setTitle(initialPost?.title ?? "");
    setBody(initialPost?.body ?? "<p></p>");
    setCoverUrl(initialPost?.cover_url ?? null);
    setNotice("");
  }, [initialPost]);

  const uploadCover = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setNotice("");
    setUploadingCover(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const uploaded = await apiForm<{ url: string }>("/media", "POST", form);
      setCoverUrl(uploaded.url);
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Не удалось загрузить обложку");
    } finally {
      setUploadingCover(false);
    }
  };

  const save = async (status: PostDraft["status"]) => {
    if (!title.trim() || !body.replace(/<[^>]*>/g, "").trim()) return;
    setSaving(true);
    setNotice("");
    try {
      const draft: PostDraft = { title: title.trim(), type: "article", body, status, ...(coverUrl ? { cover_url: coverUrl } : {}) };
      if (editing) {
        const updated = await onUpdate?.(draft);
        if (updated) setCurrentPost(updated);
        setNotice(status === "published" ? "Публикация опубликована" : "Черновик сохранён");
      } else {
        const created = await onCreate?.(draft);
        if (status === "draft" && created) {
          setCurrentPost(created);
          setNotice("Черновик сохранён");
        } else {
          setTitle("");
          setBody("<p></p>");
          setNotice("Публикация опубликована");
        }
      }
      onClose?.();
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Не удалось сохранить публикацию");
    } finally {
      setSaving(false);
    }
  };

  return <section className="post-composer" aria-labelledby="post-composer-title">
    <div className="post-composer-heading"><p>Для редактора</p><h2 id="post-composer-title">{editing ? "Редактировать публикацию" : "Создать публикацию"}</h2></div>
    <label className="post-composer-title"><span>Заголовок публикации</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Заголовок" /></label>
    <div className="post-composer-cover"><input ref={coverInputRef} className="rich-editor-file-input" type="file" accept={COVER_IMAGE_ACCEPT} aria-label="Выбрать файл обложки" onChange={(event) => void uploadCover(event)} /><button type="button" className="panel-button" disabled={uploadingCover} onClick={() => coverInputRef.current?.click()}>{uploadingCover ? "Загрузка обложки…" : "Выбрать обложку"}</button>{coverUrl && <ResponsivePostImage src={coverUrl} alt="Предпросмотр обложки" loading="eager" />}</div>
    <RichTextEditor value={body} onChange={setBody} />
    <div className="post-composer-actions"><span aria-live="polite">{notice}</span><div>{editing && currentPost?.status === "published" ? <button type="button" className="primary-button" disabled={saving || !title.trim()} onClick={() => void save("published")}>Сохранить изменения</button> : <><button type="button" className="panel-button" disabled={saving || !title.trim()} onClick={() => void save("draft")}>Сохранить черновик</button><button type="button" className="primary-button" disabled={saving || !title.trim()} onClick={() => void save("published")}>Опубликовать</button></>}</div></div>
  </section>;
}
