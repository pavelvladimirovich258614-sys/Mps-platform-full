import { type ReactNode, useEffect, useState } from "react";

import { type Country, type ForumMessage, type Topic, type User, useForum } from "../hooks";
import { countryFlag } from "../utils/countryFlags";
import type { Page } from "./Layout";

type ForumProps = {
  page: Page;
  initialCountryId?: number;
  initialTopicId?: number;
  onNavigate: (page: Page) => void;
  onCountryNavigate: (countryId: number) => void;
  onError: (message: string) => void;
  viewer?: User | null;
  irishkaAdminControls?: ReactNode;
};

const canDeleteTopic = (viewer: User | null | undefined, topic: Topic) => viewer?.id === topic.author_id || viewer?.role === "admin";
const canDeleteMessage = (viewer: User | null | undefined, message: ForumMessage) => viewer?.id === message.author.id || viewer?.role === "admin";

function DeleteConfirmation({ label, onCancel, onConfirm }: { label: "тему" | "сообщение"; onCancel: () => void; onConfirm: () => void }) {
  const title = label === "тему" ? "Удалить тему?" : "Удалить сообщение?";
  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title.slice(0, -1)}><section className="delete-confirmation"><h2>{title}</h2><p>Это действие нельзя отменить</p><div><button type="button" className="panel-button" onClick={onCancel}>Отмена</button><button type="button" className="danger-button" onClick={onConfirm}>Подтвердить удаление</button></div></section></div>;
}

export function Forum({ page, initialCountryId, initialTopicId, onNavigate, onCountryNavigate, onError, viewer = null, irishkaAdminControls }: ForumProps) {
  const [country, setCountry] = useState<Country | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const forum = useForum(country?.id, topic?.id);
  useEffect(() => {
    if (initialCountryId === undefined) {
      setCountry(null);
      setTopic(null);
      return;
    }
    const selected = forum.countries.value?.find((item) => item.id === initialCountryId);
    if (selected && selected.id !== country?.id) {
      setCountry(selected);
      setTopic(null);
    }
  }, [country?.id, forum.countries.value, initialCountryId]);
  useEffect(() => {
    if (initialTopicId === undefined || country?.id !== initialCountryId) return;
    const selected = forum.topics.items.find((item) => item.id === initialTopicId);
    if (selected && selected.id !== topic?.id) setTopic(selected);
  }, [country?.id, forum.topics.items, initialCountryId, initialTopicId, topic?.id]);
  if (page === "topic" && topic && country) return <TopicView country={country} topic={topic} forum={forum} viewer={viewer} onBack={() => { setTopic(null); onNavigate("countries"); }} onError={onError} />;
  return <main className="forum-page"><div className="forum-wrap"><p className="forum-kicker">Обсуждения</p><h1>Страны — Форум</h1><p className="forum-description">Спросите тех, кто был там неделю назад. Менеджеры и Иришка помогут с ответом.</p>{irishkaAdminControls}{forum.countries.loading ? <div className="comment-skeleton"><i /><i /><i /></div> : <div className="country-grid">{(forum.countries.value ?? []).map((item) => <button className="country-card" key={item.id} onClick={() => { setCountry(item); setTopic(null); onCountryNavigate(item.id); }}><span>{countryFlag(item.name)}</span><strong>{item.name}</strong><small>{item.topics_count} тем</small><em>{country?.id === item.id ? "Выберите тему ниже" : "Открыть обсуждения"}</em></button>)}</div>}{forum.countries.error && <p className="form-success">{forum.countries.error}</p>}{country && <Topics country={country} forum={forum} viewer={viewer} onSelect={(selected) => { setTopic(selected); onNavigate("topic"); }} onError={onError} />}</div></main>;
}

function Topics({ country, forum, viewer, onSelect, onError }: { country: Country; forum: ReturnType<typeof useForum>; viewer: User | null; onSelect: (topic: Topic) => void; onError: (message: string) => void }) {
  const [title, setTitle] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<Topic | null>(null);
  const create = async () => { try { const topic = await forum.createTopic(title); setTitle(""); await forum.topics.reload(); onSelect(topic); } catch (cause) { onError(cause instanceof Error ? cause.message : "Не удалось создать тему"); } };
  const loadMore = async () => { try { await forum.topics.loadMore(); } catch (cause) { onError(cause instanceof Error ? cause.message : "Не удалось загрузить темы"); } };
  const remove = async () => { if (!deleteConfirm) return; try { await forum.removeTopic(deleteConfirm.id); setDeleteConfirm(null); } catch (cause) { onError(cause instanceof Error ? cause.message : "Не удалось удалить тему"); } };
  return <section className="pending-section"><div className="section-heading"><h2>{countryFlag(country.name)} Темы: {country.name}</h2></div>{forum.topics.loading ? <div className="comment-skeleton"><i /><i /></div> : forum.topics.items.map((item) => <article className="forum-topic-card" key={item.id}><button className="country-card" onClick={() => onSelect(item)}><strong>{item.title}</strong><small>{item.messages_count} сообщений</small></button>{canDeleteTopic(viewer, item) && <button type="button" className="danger-button" aria-label={`Удалить тему: ${item.title}`} onClick={() => setDeleteConfirm(item)}>Удалить</button>}</article>)}{forum.topics.hasMore && <button onClick={loadMore} disabled={forum.topics.loadingMore}>{forum.topics.loadingMore ? "Загружаем…" : "Показать ещё"}</button>}<div className="topic-reply"><textarea value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Новая тема" /><button onClick={create} disabled={!title.trim()}>Создать</button></div>{deleteConfirm && <DeleteConfirmation label="тему" onCancel={() => setDeleteConfirm(null)} onConfirm={() => void remove()} />}</section>;
}

function TopicView({ country, topic, forum, viewer, onBack, onError }: { country: Country; topic: Topic; forum: ReturnType<typeof useForum>; viewer: User | null; onBack: () => void; onError: (message: string) => void }) {
  const [body, setBody] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<ForumMessage | null>(null);
  const send = async () => { try { await forum.createMessage(body); setBody(""); await forum.messages.reload(); } catch (cause) { onError(cause instanceof Error ? cause.message : "Не удалось отправить сообщение"); } };
  const loadMore = async () => { try { await forum.messages.loadMore(); } catch (cause) { onError(cause instanceof Error ? cause.message : "Не удалось загрузить сообщения"); } };
  const remove = async () => { if (!deleteConfirm) return; try { await forum.removeMessage(deleteConfirm.id); setDeleteConfirm(null); } catch (cause) { onError(cause instanceof Error ? cause.message : "Не удалось удалить сообщение"); } };
  return <main className="forum-page"><div className="topic-wrap"><button className="back-link" onClick={onBack}>← Форум стран</button><p className="forum-kicker">{countryFlag(country.name)} {country.name} · Обсуждение</p><h1>{topic.title}</h1>{forum.messages.loading && <div className="comment-skeleton"><i /><i /><i /></div>}{forum.messages.items.map((message) => <section className={message.is_ai ? "forum-message irishka" : "forum-message"} key={message.id}><div className={message.is_ai ? "irishka-avatar" : "avatar avatar-2"}>{message.is_ai && "✦"}</div><div><strong>{message.author.name}{message.is_ai && <small>ИИ-помощник</small>}</strong><small>сообщение в теме</small><p>{message.body}</p>{canDeleteMessage(viewer, message) && <button type="button" className="danger-button" aria-label={`Удалить сообщение: ${message.body}`} onClick={() => setDeleteConfirm(message)}>Удалить</button>}</div></section>)}{forum.messages.hasMore && <button onClick={loadMore} disabled={forum.messages.loadingMore}>{forum.messages.loadingMore ? "Загружаем…" : "Показать ещё"}</button>}<div className="topic-reply"><textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Спросить Иришку или поделиться опытом…" /><button onClick={send} disabled={!body.trim()}>Отправить</button></div>{deleteConfirm && <DeleteConfirmation label="сообщение" onCancel={() => setDeleteConfirm(null)} onConfirm={() => void remove()} />}</div></main>;
}
