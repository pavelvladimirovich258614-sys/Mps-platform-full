import { useState } from "react";

import type { FishkaDraft } from "../hooks";

export const FISHKA_EMOJIS = ["✈️", "🧳", "🗺️", "🏖️", "🏔️", "🏨", "🍽️", "🚕", "📱", "💡", "☀️", "🛡️", "🚖", "🛂", "💰", "🎒", "🌐", "👶", "📅", "🍽", "🔒", "🗺", "🎯"] as const;

type FishkaComposerProps = {
  publishesImmediately: boolean;
  onCreate: (draft: FishkaDraft) => Promise<void>;
  onClose: () => void;
};

function asFishkaHtml(value: string) {
  return value.trim().split(/\n\s*\n/).map((paragraph) => `<p>${paragraph.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")}</p>`).join("");
}

export function FishkaComposer({ publishesImmediately, onCreate, onClose }: FishkaComposerProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [emoji, setEmoji] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const action = publishesImmediately ? "Опубликовать" : "Отправить на модерацию";

  const submit = async () => {
    if (!title.trim() || !body.trim()) {
      setNotice("Заполните заголовок и текст фишки");
      return;
    }
    if (!emoji) {
      setNotice("Выберите эмодзи для фишки");
      return;
    }
    setSaving(true);
    setNotice("");
    try {
      await onCreate({ title: title.trim(), type: "fishka", body: asFishkaHtml(body), emoji, status: publishesImmediately ? "published" : "pending" });
      onClose();
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Не удалось отправить фишку");
    } finally {
      setSaving(false);
    }
  };

  return <section className="fishka-composer" aria-labelledby="fishka-composer-title">
    <div className="post-composer-heading"><p>{publishesImmediately ? "Для редактора" : "Совет путешественника"}</p><h2 id="fishka-composer-title">Добавить фишку</h2></div>
    <label className="post-composer-title"><span>Заголовок фишки</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Например, проверьте срок паспорта" /></label>
    <label className="fishka-text"><span>Текст фишки</span><textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Короткий полезный совет" /></label>
    <fieldset className="fishka-emoji-picker"><legend>Выберите эмодзи</legend><div>{FISHKA_EMOJIS.map((item) => <button type="button" key={item} aria-label={`Выбрать emoji ${item}`} aria-pressed={emoji === item} className={emoji === item ? "chosen" : ""} onClick={() => setEmoji(item)}>{item}</button>)}</div></fieldset>
    <div className="post-composer-actions"><span aria-live="polite">{notice}</span><button type="button" className="primary-button" disabled={saving} onClick={() => void submit()}>{action}</button></div>
  </section>;
}
