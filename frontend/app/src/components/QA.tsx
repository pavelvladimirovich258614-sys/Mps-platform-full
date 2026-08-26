import { useState } from "react";
import { useQA } from "../hooks";
type QATarget = "manager" | "lawyer" | "irishka";
type IrishkaExchange = { question: string; answer: string };

export function QA({ onClose, onError, onPrivacy }: { onClose: () => void; onError: (message: string) => void; onPrivacy: () => void }) {
  const [target, setTarget] = useState<QATarget>("manager");
  const [draft, setDraft] = useState("");
  const [consent, setConsent] = useState(false);
  const [irishkaLoading, setIrishkaLoading] = useState(false);
  const [irishkaExchange, setIrishkaExchange] = useState<IrishkaExchange | null>(null);
  const { value, loading, create, askIrishka } = useQA();
  const send = async () => {
    if (!consent) return;
    try {
      if (target === "irishka") {
        const question = draft.trim();
        setIrishkaLoading(true);
        const { answer } = await askIrishka(question);
        setIrishkaExchange({ question, answer });
        setDraft("");
      } else {
        await create(target, draft);
        setDraft("");
      }
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : "Не удалось отправить вопрос");
    } finally {
      setIrishkaLoading(false);
    }
  };
  const messages = target === "irishka" ? [] : (value ?? []).filter((item) => item.target === target);
  const placeholder = target === "manager" ? "Спросить менеджера…" : target === "lawyer" ? "Задать вопрос юристу…" : "Спросить Иришку…";
  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Вопрос-ответ" onMouseDown={onClose}><section className="qa-modal" onMouseDown={(event) => event.stopPropagation()}><header><div><h2>Вопрос-ответ</h2><p>переписка с агентством</p></div><button className="round-close" aria-label="Закрыть" onClick={onClose}>×</button></header><div className="qa-tabs"><button className={target === "manager" ? "current" : ""} onClick={() => setTarget("manager")}>Менеджер</button><button className={target === "lawyer" ? "current" : ""} onClick={() => setTarget("lawyer")}>Юрист</button><button className={target === "irishka" ? "current" : ""} onClick={() => setTarget("irishka")}>Иришка ИИ</button></div><div className="qa-messages">{target !== "irishka" && loading && <div className="comment-skeleton"><i /><i /></div>}{messages.map((message) => <div className="qa-message mine" key={message.id}><p>{message.body}</p><small>Вы · {message.status}</small>{message.answer && <div className="qa-message"><p>{message.answer}</p></div>}</div>)}{target === "irishka" && irishkaLoading && <div className="qa-thinking" role="status">Иришка думает…</div>}{target === "irishka" && irishkaExchange && <><div className="qa-message mine"><p>{irishkaExchange.question}</p><small>Вы</small></div><div className="qa-message qa-irishka-answer"><p>{irishkaExchange.answer}</p><small>Иришка ИИ</small></div></>}</div><footer><textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={placeholder} /><label><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /> Согласен с <button onClick={onPrivacy}>политикой обработки данных</button></label><button onClick={send} disabled={!draft.trim() || !consent || irishkaLoading}>{target === "irishka" ? "Спросить" : "Отпр."}</button></footer></section></div>;
}
