import { SunLogo } from "./Layout";
import type { PublicSettings } from "../hooks";

const perks = [["✈", "Бываем сами", "Проверяем направления, отели и трансферы не по буклетам."], ["◈", "Говорим честно", "Предупреждаем о стройках, очередях и сезоне дождей."], ["💬", "На связи весь тур", "Менеджер и юрист доступны в разделе «Вопрос-ответ»."], ["✦", "Собираем под вас", "Не продаём готовый пакет, если он вам не подходит."]];

export function About({ publicSettings }: { publicSettings: PublicSettings | null }) {
  const contactDetails = [
    ["Адрес", publicSettings?.contact_address || "г. Москва, ул. Марксистская, 5К1"],
    ["Телефон", publicSettings?.contact_phone || "+7 (495) 21-21-421"],
    ["Email", publicSettings?.contact_email || "coralclub47@mail.ru"],
  ];
  return <main className="section-page about-page"><header className="about-heading"><SunLogo /><h1>Официальный партнёр крупнейших туроператоров России</h1><p>Coral Travel, Coral Travel Elite Service, Anex Tour, TUI — мы работаем напрямую, без посредников и наценок «за передачу».</p></header><div className="about-text"><p>Турагентство «Под солнцем» работает на рынке с 2003 года и является официальным уполномоченным агентом туроператоров Coral Travel, Coral Travel Elite Service, Anex Tour и TUI.</p><p>За более чем двадцать лет мы прошли путь от небольшого агентства до команды, которой доверяют семьи, пары и корпоративные клиенты. В нашем портфеле — пляжный отдых, экзотические направления, горнолыжные туры, круизы, путешествия по России и организация выездных мероприятий.</p><p>Отдельное направление, которым мы гордимся особенно, — сопровождение спортивных сборов и турниров: большой теннис, футбол, баскетбол, волейбол, плавание, хоккей, йога, гольф. Это требует не только туристической, но и организационной экспертизы — и мы наработали её за годы практики.</p><p>Мы находимся в Москве, у метро Таганская, и всегда на связи — по телефону, почте или в Telegram.</p></div><div className="perk-grid">{perks.map(([icon, title, text]) => <article className="surface-card" key={title}><span>{icon}</span><h2>{title}</h2><p>{text}</p></article>)}</div><section className="about-contacts"><h2>Контакты</h2><p>{contactDetails.map(([label, value], index) => <span key={label}>{index > 0 && <br />}{label}: <span>{value}</span></span>)}</p><a href="https://t.me/pod_solncem_travel_bot" target="_blank" rel="noreferrer">Написать менеджеру →</a></section></main>;
}
