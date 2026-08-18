import { useState } from "react";
import { useSubscribe } from "../hooks";

export function Subscribe({ onError }: { onError: (message: string) => void }) {
  const { subscribe } = useSubscribe(); const [email, setEmail] = useState(""); const [subscribed, setSubscribed] = useState(false);
  const submit = async () => { try { await subscribe(email); setSubscribed(true); } catch (cause) { onError(cause instanceof Error ? cause.message : "Не удалось оформить подписку"); } };
  return <main className="subscribe-page"><div className="subscribe-sun" /><h1>Одно письмо в неделю. Ничего лишнего</h1><p>Свежие фишки, новые отзывы и разбор одного направления. Без рекламы чужих отелей и без «горящих» рассылок каждый день.</p><div className="subscribe-form"><input aria-label="Ваша почта" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ваша почта" /><button onClick={submit} disabled={!email.trim()}>Подписаться</button></div>{subscribed && <div className="form-success">Проверьте почту и подтвердите подписку.</div>}<div className="telegram-reading">или читайте в Telegram<a href="https://t.me/coral_taganskaya" target="_blank" rel="noreferrer">@coral_taganskaya</a></div><section className="subscribe-cta"><h2>Нужен тур, а не чтение?</h2><p>Напишите менеджеру в Telegram — ответим в течение рабочего дня.</p><a href="https://t.me/pod_solncem_travel_bot" target="_blank" rel="noreferrer">Написать менеджеру →</a></section></main>;
}
