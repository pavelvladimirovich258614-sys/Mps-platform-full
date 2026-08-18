import { useState } from "react";

import { type Country, type Topic, useForum } from "../hooks";
import { countryFlag } from "../utils/countryFlags";
import type { Page } from "./Layout";

type ForumProps = { page: Page; onNavigate: (page: Page) => void; onError: (message: string) => void };

export function Forum({ page, onNavigate, onError }: ForumProps) {
  const [country, setCountry] = useState<Country | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const forum = useForum(country?.id, topic?.id);
  if (page === "topic" && topic && country) return <TopicView country={country} topic={topic} forum={forum} onBack={() => { setTopic(null); onNavigate("countries"); }} onError={onError} />;
  return <main className="forum-page"><div className="forum-wrap"><p className="forum-kicker">Обсуждения</p><h1>Страны</h1><p className="forum-description">Спросите тех, кто был там неделю назад. Менеджеры и Иришка помогут с ответом.</p>{forum.countries.loading ? <div className="comment-skeleton"><i /><i /><i /></div> : <div className="country-grid">{(forum.countries.value ?? []).map((item) => <button className="country-card" key={item.id} onClick={() => { setCountry(item); setTopic(null); }}><span>{countryFlag(item.name)}</span><strong>{item.name}</strong><small>{item.topics_count} тем</small><em>{country?.id === item.id ? "Выберите тему ниже" : "Открыть обсуждения"}</em></button>)}</div>}{forum.countries.error && <p className="form-success">{forum.countries.error}</p>}{country && <Topics country={country} forum={forum} onSelect={(selected) => { setTopic(selected); onNavigate("topic"); }} onError={onError} />}</div></main>;
}

function Topics({ country, forum, onSelect, onError }: { country: Country; forum: ReturnType<typeof useForum>; onSelect: (topic: Topic) => void; onError: (message: string) => void }) {
  const [title, setTitle] = useState("");
  const create = async () => { try { const topic = await forum.createTopic(title); setTitle(""); await forum.topics.reload(); onSelect(topic); } catch (cause) { onError(cause instanceof Error ? cause.message : "Не удалось создать тему"); } };
  return <section className="pending-section"><div className="section-heading"><h2>{countryFlag(country.name)} Темы: {country.name}</h2></div>{forum.topics.loading ? <div className="comment-skeleton"><i /><i /></div> : (forum.topics.value ?? []).map((item) => <button className="country-card" key={item.id} onClick={() => onSelect(item)}><strong>{item.title}</strong><small>{item.messages_count} сообщений</small></button>)}<div className="topic-reply"><textarea value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Новая тема" /><button onClick={create} disabled={!title.trim()}>Создать</button></div></section>;
}

function TopicView({ country, topic, forum, onBack, onError }: { country: Country; topic: Topic; forum: ReturnType<typeof useForum>; onBack: () => void; onError: (message: string) => void }) {
  const [body, setBody] = useState("");
  const send = async () => { try { await forum.createMessage(body); setBody(""); await forum.messages.reload(); } catch (cause) { onError(cause instanceof Error ? cause.message : "Не удалось отправить сообщение"); } };
  return <main className="forum-page"><div className="topic-wrap"><button className="back-link" onClick={onBack}>← Страны</button><p className="forum-kicker">{countryFlag(country.name)} {country.name} · Обсуждение</p><h1>{topic.title}</h1>{forum.messages.loading && <div className="comment-skeleton"><i /><i /><i /></div>}{(forum.messages.value ?? []).map((message) => <section className={message.is_ai ? "forum-message irishka" : "forum-message"} key={message.id}><div className={message.is_ai ? "irishka-avatar" : "avatar avatar-2"}>{message.is_ai && "✦"}</div><div><strong>{message.author.name}{message.is_ai && <small>ИИ-помощник</small>}</strong><small>сообщение в теме</small><p>{message.body}</p></div></section>)}<div className="topic-reply"><textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Спросить Иришку или поделиться опытом…" /><button onClick={send} disabled={!body.trim()}>Отправить</button></div></div></main>;
}
