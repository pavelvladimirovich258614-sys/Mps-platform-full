import { SunLogo } from "./Layout";
import type { PublicSettings } from "../hooks";

const perks = [["✈", "Бываем сами", "Проверяем направления, отели и трансферы не по буклетам."], ["◈", "Говорим честно", "Предупреждаем о стройках, очередях и сезоне дождей."], ["💬", "На связи весь тур", "Менеджер и юрист доступны в разделе «Вопрос-ответ»."], ["✦", "Собираем под вас", "Не продаём готовый пакет, если он вам не подходит."]];

export function About({ publicSettings }: { publicSettings: PublicSettings | null }) {
  const contactDetails = [publicSettings?.contact_phone, publicSettings?.contact_email, publicSettings?.contact_address].filter(Boolean);
  return <main className="section-page about-page"><header className="about-heading"><SunLogo /><h1>Мы — «Под солнцем»</h1><p>агентство, которое ездит само</p></header><div className="about-text"><p>Мы туристическое агентство полного цикла: подбираем туры, ведём документы и остаёмся на связи всё путешествие. Половина команды — бывшие гиды и авиаперевозчики, поэтому знаем закулисье индустрии.</p><p>Этот журнал — способ делиться тем, что обычно узнаёшь только в поездке: как не переплатить за трансфер, где на самом деле тихо, а где будет стройка. Пишем честно, даже когда это невыгодно нам.</p></div><div className="perk-grid">{perks.map(([icon, title, text]) => <article className="surface-card" key={title}><span>{icon}</span><h2>{title}</h2><p>{text}</p></article>)}</div>{contactDetails.length > 0 && <section className="about-contacts"><h2>Контакты</h2><p>{contactDetails.map((value, index) => <span key={value}>{index > 0 && <br />}{value}</span>)}</p><a href="https://t.me/pod_solncem_travel_bot" target="_blank" rel="noreferrer">Написать менеджеру →</a></section>}</main>;
}
