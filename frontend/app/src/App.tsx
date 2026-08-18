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
import { type ApiPost, useAuth, useNotifications, useOnline, usePosts } from "./hooks";

const pages: Page[] = ["feed", "countries", "topic", "article", "reviews", "subscribe", "about", "privacy", "terms"];
const pageFromHash = () => pages.includes(window.location.hash.slice(1) as Page) ? window.location.hash.slice(1) as Page : "feed";
export function App() {
  const [page, setPage] = useState<Page>(pageFromHash); const [theme, setTheme] = useState<"dark" | "light">(() => localStorage.getItem("mps-theme2") === "light" ? "light" : "dark"); const [article, setArticle] = useState<ApiPost | null>(null); const [overlay, setOverlay] = useState<"qa" | "profile" | null>(null); const [notificationsOpen, setNotificationsOpen] = useState(false); const [cookiesAccepted, setCookiesAccepted] = useState(() => localStorage.getItem("mps-cookie-consent") === "accepted"); const [toast, setToast] = useState("");
  const auth = useAuth(); const posts = usePosts(); const notifications = useNotifications(); const online = useOnline(); const [devRole, setDevRole] = useState<string | null>(null);
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem("mps-theme2", theme); }, [theme]);
  const openPage = (next: Page) => { window.location.hash = next; setPage(next); setNotificationsOpen(false); window.scrollTo(0, 0); };
  const openArticle = (post: ApiPost) => { setArticle(post); openPage("article"); };
  const showError = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 4500); };
  const role = devRole ?? auth.user?.role;
  return <><Layout page={page} theme={theme} notificationsOpen={notificationsOpen} unreadCount={notifications.items.filter((item) => !item.is_read).length} userName={auth.user ? `${auth.user.name || "Читатель"} · ${role}` : "Войти"} online={online.value ?? []} onNavigate={openPage} onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")} onOpenQA={() => setOverlay("qa")} onOpenProfile={() => setOverlay("profile")} onToggleNotifications={() => setNotificationsOpen(!notificationsOpen)} onOpenPrivacy={() => openPage("privacy")} onOpenTerms={() => openPage("terms")}>{page === "feed" && <Feed posts={posts.value ?? []} loading={posts.loading} onOpenArticle={openArticle} />}{(page === "countries" || page === "topic") && <Forum page={page} onNavigate={openPage} onError={showError} />}{page === "article" && article && <ArticleComments article={article} onBack={() => openPage("feed")} onError={showError} />}{page === "reviews" && <Reviews onError={showError} />}{page === "subscribe" && <Subscribe onError={showError} />}{page === "about" && <About />}{(page === "privacy" || page === "terms") && <Legal kind={page as LegalKind} onBack={() => openPage("feed")} />}{notificationsOpen && <Notifications notifications={notifications.items} onReadAll={() => { void notifications.read().catch((cause) => showError(cause instanceof Error ? cause.message : "Не удалось обновить уведомления")); }} />}{overlay === "qa" && <QA onClose={() => setOverlay(null)} onError={showError} />}{overlay === "profile" && <Profile user={auth.user} onClose={() => setOverlay(null)} onRequestCode={auth.requestCode} onVerifyCode={auth.verifyCode} onUpdate={auth.update} onError={showError} />}{!cookiesAccepted && <CookieBanner onAccept={() => { localStorage.setItem("mps-cookie-consent", "accepted"); setCookiesAccepted(true); }} onPrivacy={() => openPage("privacy")} />}{toast && <div className="toast" role="alert">{toast}</div>}</Layout>{import.meta.env.DEV && auth.user && <label className="dev-role-switch">Dev-роль <select value={devRole ?? auth.user.role} onChange={(event) => setDevRole(event.target.value)}><option value="reader">reader</option><option value="editor">editor</option><option value="admin">admin</option></select></label>}</>;
}
