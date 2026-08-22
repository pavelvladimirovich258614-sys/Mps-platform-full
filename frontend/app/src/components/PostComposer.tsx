import { useState } from "react";

import { RichTextEditor } from "./RichTextEditor";

export type PostDraft = { title: string; type: "article"; body: string; status: "draft" | "published" };
type PostComposerProps = { onCreate: (post: PostDraft) => Promise<void> };

export function PostComposer({ onCreate }: PostComposerProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<PostDraft["type"]>("article");
  const [body, setBody] = useState("<p></p>");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const save = async (status: PostDraft["status"]) => {
    if (!title.trim() || !body.replace(/<[^>]*>/g, "").trim()) return;
    setSaving(true);
    setNotice("");
    try {
      await onCreate({ title: title.trim(), type, body, status });
      setTitle("");
      setBody("<p></p>");
      setNotice(status === "published" ? "Публикация опубликована" : "Черновик сохранён");
    } finally {
      setSaving(false);
    }
  };

  return <section className="post-composer" aria-labelledby="post-composer-title">
    <div className="post-composer-heading"><p>Для редактора</p><h2 id="post-composer-title">Создать публикацию</h2></div>
    <label className="post-composer-title"><span>Заголовок публикации</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Заголовок" /></label>
    <label className="post-composer-type"><span>Тип публикации</span><select value={type} onChange={(event) => setType(event.target.value as PostDraft["type"])}><option value="article">Статья</option></select></label>
    <RichTextEditor value={body} onChange={setBody} />
    <div className="post-composer-actions"><span aria-live="polite">{notice}</span><div><button type="button" className="panel-button" disabled={saving || !title.trim()} onClick={() => void save("draft")}>Сохранить черновик</button><button type="button" className="primary-button" disabled={saving || !title.trim()} onClick={() => void save("published")}>Опубликовать</button></div></div>
  </section>;
}
