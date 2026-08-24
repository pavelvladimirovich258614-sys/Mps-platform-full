import { useEffect, useState } from "react";

import { RichTextEditor } from "./RichTextEditor";

export type PostDraft = { title: string; type: "article"; body: string; status: "draft" | "published" };
export type EditablePost = PostDraft & { id: number };
type PostComposerProps = { onCreate?: (post: PostDraft) => Promise<EditablePost | undefined>; initialPost?: EditablePost; onUpdate?: (post: PostDraft) => Promise<EditablePost | undefined> };

export function PostComposer({ onCreate, initialPost, onUpdate }: PostComposerProps) {
  const [currentPost, setCurrentPost] = useState(initialPost);
  const editing = Boolean(currentPost);
  const [title, setTitle] = useState(initialPost?.title ?? "");
  const [body, setBody] = useState(initialPost?.body ?? "<p></p>");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setCurrentPost(initialPost);
    setTitle(initialPost?.title ?? "");
    setBody(initialPost?.body ?? "<p></p>");
    setNotice("");
  }, [initialPost]);

  const save = async (status: PostDraft["status"]) => {
    if (!title.trim() || !body.replace(/<[^>]*>/g, "").trim()) return;
    setSaving(true);
    setNotice("");
    try {
      const draft: PostDraft = { title: title.trim(), type: "article", body, status };
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
    } finally {
      setSaving(false);
    }
  };

  return <section className="post-composer" aria-labelledby="post-composer-title">
    <div className="post-composer-heading"><p>Для редактора</p><h2 id="post-composer-title">{editing ? "Редактировать публикацию" : "Создать публикацию"}</h2></div>
    <label className="post-composer-title"><span>Заголовок публикации</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Заголовок" /></label>
    <RichTextEditor value={body} onChange={setBody} />
    <div className="post-composer-actions"><span aria-live="polite">{notice}</span><div>{editing && currentPost?.status === "published" ? <button type="button" className="primary-button" disabled={saving || !title.trim()} onClick={() => void save("published")}>Сохранить изменения</button> : <><button type="button" className="panel-button" disabled={saving || !title.trim()} onClick={() => void save("draft")}>Сохранить черновик</button><button type="button" className="primary-button" disabled={saving || !title.trim()} onClick={() => void save("published")}>Опубликовать</button></>}</div></div>
  </section>;
}
