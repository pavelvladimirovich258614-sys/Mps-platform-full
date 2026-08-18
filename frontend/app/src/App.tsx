import { useEffect, useState } from "react";

import { About } from "./components/About";
import { ArticleComments } from "./components/ArticleComments";
import { CookieBanner } from "./components/CookieBanner";
import { Feed } from "./components/Feed";
import { Forum } from "./components/Forum";
import { Layout, type Page } from "./components/Layout";
import { Legal, type LegalKind } from "./components/Legal";
import { Notifications } from "./components/Notifications";
import { Profile } from "./components/Profile";
import { QA } from "./components/QA";
import { Reviews } from "./components/Reviews";
import { Subscribe } from "./components/Subscribe";

export type Post = { id: number; kind: "article" | "tip" | "video"; tag: string; title: string; text?: string; country?: string; flag?: string; videoDate?: string; byRequest?: boolean };
const posts: Post[] = [
  { id: 1, kind: "article", tag: "Направление · 8 мин чтения", title: "Ликийское побережье осенью: куда ехать, когда все уже уехали", text: "Сентябрь и октябрь на юге Турции — та же вода 26 градусов, но вдвое меньше людей и цены как в мае." },
  { id: 2, kind: "tip", tag: "Фишка · Турция", title: "Трансфер из Антальи дешевле брать не в аэропорту", text: "Стойки внутри терминала берут наценку до 40%. Закажите трансфер заранее — водитель встретит с табличкой." },
  { id: 3, kind: "video", tag: "Видеообзор", title: "Видеообзор отеля Rixos Bab Al Bahr", country: "ОАЭ", flag: "🇦🇪", videoDate: "12 августа 2026", byRequest: true },
];
const initialNotifications = [{ text: "Менеджер ответил на ваш вопрос", when: "12 мин назад", read: false }, { text: "Ваш комментарий одобрен", when: "вчера", read: false }, { text: "Вышел свежий видеообзор отеля Rixos", when: "3 дня назад", read: true }];
const pageNames: Page[] = ["feed", "countries", "topic", "article", "reviews", "subscribe", "about", "privacy", "terms"];

function pageFromHash(): Page {
  const candidate = window.location.hash.slice(1) as Page;
  return pageNames.includes(candidate) ? candidate : "feed";
}

export function App() {
  const [page, setPage] = useState<Page>(pageFromHash);
  const [theme, setTheme] = useState<"dark" | "light">(() => localStorage.getItem("mps-theme2") === "light" ? "light" : "dark");
  const [articleId, setArticleId] = useState<number | null>(null);
  const [overlay, setOverlay] = useState<"qa" | "profile" | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [cookiesAccepted, setCookiesAccepted] = useState(() => localStorage.getItem("mps-cookie-consent") === "accepted");

  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem("mps-theme2", theme); }, [theme]);
  const openArticle = (postId: number) => { setArticleId(postId); setPage("article"); window.scrollTo(0, 0); };
  const openPage = (nextPage: Page) => { window.location.hash = nextPage; setPage(nextPage); setNotificationsOpen(false); window.scrollTo(0, 0); };
  const openLegal = (kind: LegalKind) => openPage(kind === "privacy" ? "privacy" : "terms");
  const article = posts.find((post) => post.id === articleId) ?? posts[0];
  const acceptCookies = () => { localStorage.setItem("mps-cookie-consent", "accepted"); setCookiesAccepted(true); };

  return <Layout page={page} theme={theme} notificationsOpen={notificationsOpen} unreadCount={notifications.filter((item) => !item.read).length} onNavigate={openPage} onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")} onOpenQA={() => setOverlay("qa")} onOpenProfile={() => setOverlay("profile")} onToggleNotifications={() => setNotificationsOpen(!notificationsOpen)} onOpenPrivacy={() => openLegal("privacy")} onOpenTerms={() => openLegal("terms")}>{page === "feed" && <Feed posts={posts} onOpenArticle={openArticle} />}{(page === "countries" || page === "topic") && <Forum page={page} onNavigate={openPage} />}{page === "article" && <ArticleComments article={article} onBack={() => openPage("feed")} />}{page === "reviews" && <Reviews />}{page === "subscribe" && <Subscribe />}{page === "about" && <About />}{(page === "privacy" || page === "terms") && <Legal kind={page} onBack={() => openPage("feed")} />}{notificationsOpen && <Notifications notifications={notifications} onReadAll={() => setNotifications(notifications.map((item) => ({ ...item, read: true })))} />}{overlay === "qa" && <QA onClose={() => setOverlay(null)} />}{overlay === "profile" && <Profile onClose={() => setOverlay(null)} />}{!cookiesAccepted && <CookieBanner onAccept={acceptCookies} onPrivacy={() => openLegal("privacy")} />}</Layout>;
}
