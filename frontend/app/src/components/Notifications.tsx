type Notification = { text: string; when: string; read: boolean };
type NotificationProps = { notifications: Notification[]; onReadAll: () => void };

export function Notifications({ notifications, onReadAll }: NotificationProps) {
  return <section className="notification-popover"><header><strong>Уведомления</strong><button onClick={onReadAll}>Отметить всё прочитанным</button></header>{notifications.length ? <div>{notifications.map((notification) => <article key={`${notification.text}-${notification.when}`}><i className={notification.read ? "read" : ""} /><div><p>{notification.text}</p><small>{notification.when}</small></div></article>)}</div> : <p className="empty-notifications">Пока тихо</p>}</section>;
}
