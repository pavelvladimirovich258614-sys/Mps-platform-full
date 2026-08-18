import { useState } from "react";

type Review = { name: string; place: string; text: string; rating: number };

const approvedReviews: Review[] = [
  { name: "Анна В.", place: "ОАЭ · апрель 2026", rating: 5, text: "С нами было спокойно: подобрали отель без скрытых нюансов, на месте всё совпало с ожиданиями. Особенно помогли с трансфером." },
  { name: "Семья Ковалёвых", place: "Турция · май 2026", rating: 5, text: "Менеджер честно рассказал, где будет шумно, и предложил другой вариант. Дети были в восторге, а мы — без сюрпризов." },
];

export function Reviews() {
  const [rating, setRating] = useState(5);
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [place, setPlace] = useState("");
  const [body, setBody] = useState("");
  const [pending, setPending] = useState<Review[]>([]);

  const submit = () => {
    if (!name.trim() || !place.trim() || !body.trim()) return;
    setPending([{ name, place, text: body, rating }, ...pending]);
    setName(""); setPlace(""); setBody(""); setSent(true);
  };

  return <main className="section-page reviews-page"><h1>Отзывы</h1><p className="page-description">Пишут те, кто ездил с нами. Каждый отзыв читает менеджер перед публикацией.</p>
    <section className="surface-card review-form"><h2>Оставить отзыв</h2><p>Опубликуем после проверки менеджером — обычно в течение рабочего дня.</p><div className="form-grid two-columns"><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Как вас зовут" /><input value={place} onChange={(event) => setPlace(event.target.value)} placeholder="Направление и месяц поездки" /></div><textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Что понравилось, что нет — по-честному" /><div className="form-actions"><div className="rating"><span>Оценка</span>{[1, 2, 3, 4, 5].map((star) => <button key={star} aria-label={`Оценка ${star}`} onClick={() => setRating(star)} className={star <= rating ? "star active" : "star"}>★</button>)}</div><div>{sent && <span className="form-success">Спасибо — отзыв ушёл на проверку</span>}<button className="panel-button" onClick={submit}>Отправить</button></div></div></section>
    {pending.length > 0 && <section className="pending-section"><div className="section-heading"><h2>На проверке</h2><span>{pending.length}</span></div><p>Видно только вам и менеджеру до одобрения.</p>{pending.map((review) => <ReviewCard key={`${review.name}-${review.text}`} review={review} pending />)}</section>}
    <section className="review-list">{approvedReviews.map((review) => <ReviewCard key={review.name} review={review} />)}</section>
  </main>;
}

function ReviewCard({ review, pending = false }: { review: Review; pending?: boolean }) {
  return <article className={pending ? "review-card pending-review" : "review-card"}><header><span className="avatar avatar-1" /><div><strong>{review.name}</strong><small>{review.place}</small></div><b>{"★".repeat(review.rating)}</b></header><p>{review.text}</p>{pending ? <small className="pending-label">ждёт проверки менеджером</small> : <footer><span>✓</span> проверено агентством</footer>}</article>;
}
