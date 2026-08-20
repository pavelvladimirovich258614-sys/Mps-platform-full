export type LegalKind = "privacy" | "terms";

const legal = {
  privacy: { title: "Политика обработки персональных данных", body: "1. Сбор данных\nМы собираем имя, контактные данные и содержание обращений, которые пользователь передаёт добровольно.\n\n2. Цели обработки\nДанные используются для подбора туров, обратной связи и модерации отзывов и обсуждений.\n\n3. Хранение\nДанные хранятся не дольше, чем это необходимо для указанных целей.\n\n4. Права пользователя\nВы можете запросить удаление своих данных, написав менеджеру в разделе «Вопрос-ответ»." },
  terms: { title: "Пользовательское соглашение", body: "1. Общие положения\nНастоящее соглашение регулирует порядок использования сайта и сервисов «Под солнцем».\n\n2. Права и обязанности сторон\nПользователь обязуется предоставлять достоверную информацию при создании обращений и отзывов.\n\n3. Модерация контента\nОтзывы и комментарии публикуются после проверки. Агентство вправе отклонить материал, нарушающий правила площадки.\n\n4. Ответственность\nАгентство не несёт ответственности за содержание пользовательских публикаций до момента их одобрения." },
};

export function Legal({ kind, onBack, publicSettings }: { kind: LegalKind; onBack: () => void; publicSettings: PublicSettings | null }) { const page = legal[kind]; const operator = [publicSettings?.legal_name, publicSettings?.contact_address].filter(Boolean); return <main className="legal-page"><button className="back-link" onClick={onBack}>← В ленту</button><h1>{page.title}</h1>{kind === "privacy" && operator.length > 0 && <section className="surface-card"><h2>Оператор персональных данных</h2><p>{operator.join("\n")}</p></section>}<p>{page.body}</p></main>; }
import type { PublicSettings } from "../hooks";
