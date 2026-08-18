import { useState } from "react";

type QATarget = "manager" | "lawyer";
type QAProps = { onClose: () => void };

const initialMessages = {
  manager: [{ from: "agency", text: "Здравствуйте! Расскажите, куда хотите поехать и какие у вас даты.", name: "Менеджер", when: "сегодня" }],
  lawyer: [{ from: "agency", text: "Здравствуйте! Опишите вопрос по договору или документам — разберём и ответим.", name: "Юрист", when: "сегодня" }],
};

export function QA({ onClose }: QAProps) {
  const [target, setTarget] = useState<QATarget>("manager");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState(initialMessages);
  const send = () => { if (!draft.trim()) return; setMessages({ ...messages, [target]: [...messages[target], { from: "user", text: draft, name: "Вы", when: "сейчас" }] }); setDraft(""); };
  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Вопрос-ответ" onMouseDown={onClose}><section className="qa-modal" onMouseDown={(event) => event.stopPropagation()}><header><div><h2>Вопрос-ответ</h2><p>переписка с агентством</p></div><button className="round-close" aria-label="Закрыть" onClick={onClose}>×</button></header><div className="qa-tabs"><button className={target === "manager" ? "current" : ""} onClick={() => setTarget("manager")}>Менеджер</button><button className={target === "lawyer" ? "current" : ""} onClick={() => setTarget("lawyer")}>Юрист</button></div><div className="qa-messages">{messages[target].map((message, index) => <div className={message.from === "user" ? "qa-message mine" : "qa-message"} key={`${message.text}-${index}`}><p>{message.text}</p><small>{message.name} · {message.when}</small></div>)}</div><footer><textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={target === "manager" ? "Спросить менеджера…" : "Задать вопрос юристу…"} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} /><button onClick={send}>Отпр.</button></footer></section></div>;
}
