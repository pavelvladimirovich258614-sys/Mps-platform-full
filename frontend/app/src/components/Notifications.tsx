import type { Notification, Question } from "../hooks";

type NotificationProps = {
  notifications: Notification[];
  questions: Question[];
  onOpenQuestion: (notification: Notification, questionId: number) => void;
  onReadAll: () => void;
};

const linkedQuestionId = (item: Notification) => {
  const value = item.payload.question_id;
  return typeof value === "number" && Number.isInteger(value) ? value : null;
};

const label = (item: Notification, questions: Question[]) => {
  if (item.type === "qa_answered") {
    const questionId = linkedQuestionId(item);
    const target = questions.find((question) => question.id === questionId)?.target;
    if (target === "manager") return "Менеджер ответил на ваш вопрос";
    if (target === "lawyer") return "Юрист ответил на ваш вопрос";
    return "Получен ответ на ваш вопрос";
  }
  return ({ review_approved: "Ваш отзыв одобрен", forum_message: "Новое сообщение в теме" }[item.type] ?? "Новое уведомление");
};

export function Notifications({ notifications, questions, onOpenQuestion, onReadAll }: NotificationProps) {
  return <section className="notification-popover"><header><strong>Уведомления</strong><button onClick={onReadAll}>Отметить всё прочитанным</button></header>{notifications.length ? <div>{notifications.map((notification) => {
    const questionId = notification.type === "qa_answered" ? linkedQuestionId(notification) : null;
    const content = <><i className={notification.is_read ? "read" : ""} /><div><p>{label(notification, questions)}</p><small>{new Date(notification.created_at).toLocaleString("ru-RU")}</small></div></>;
    return <article key={notification.id}>{questionId === null ? <div className="notification-item-content">{content}</div> : <button type="button" className="notification-item notification-item-content" onClick={() => onOpenQuestion(notification, questionId)}>{content}</button>}</article>;
  })}</div> : <p className="empty-notifications">Пока тихо</p>}</section>;
}
