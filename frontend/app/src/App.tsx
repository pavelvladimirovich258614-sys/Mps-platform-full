import { useCallback, useEffect, useState } from "react";

import { About } from "./components/About";
import { ArticleComments } from "./components/ArticleComments";
import { CookieBanner } from "./components/CookieBanner";
import { Feed } from "./components/Feed";
import { Forum } from "./components/Forum";
import { Layout, type Page } from "./components/Layout";
import { Legal, type LegalKind } from "./components/Legal";
import { Notifications } from "./components/Notifications";
import { Profile } from "./components/Profile";
import { PublicProfile } from "./components/PublicProfile";
import { QA } from "./components/QA";
import { Reviews } from "./components/Reviews";
import { Subscribe } from "./components/Subscribe";
import { type ApiPost, useAuthorPosts, useAuth, useLikedPosts, useNotifications, useOnline, usePost, usePosts, usePublicProfile, usePublicSettings } from "./hooks";
import { pathForRoute, type PathRoute, routeFromPath } from "./router";

function routeForPage(page: Page): PathRoute {
  if (page === "countries") return { page: "countries" };
  if (page === "reviews" || page === "subscribe" || page === "about" || page === "privacy" || page === "terms") {
    return { page };
  }
  return { page: "feed" };
}

export function App() {
  const [route, setRoute] = useState<PathRoute>(() => routeFromPath(window.location.pathname));
  const [topicOpen, setTopicOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(
    () => localStorage.getItem("mps-theme2") === "light" ? "light" : "dark",
  );
  const [overlay, setOverlay] = useState<"qa" | "profile" | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [cookiesAccepted, setCookiesAccepted] = useState(
    () => localStorage.getItem("mps-cookie-consent") === "accepted",
  );
  const [toast, setToast] = useState("");
  const [devRole, setDevRole] = useState<string | null>(null);

  const auth = useAuth();
  const posts = usePosts();
  const notifications = useNotifications();
  const online = useOnline();
  const publicSettings = usePublicSettings();
  const article = usePost(route.page === "article" ? route.slug : undefined);
  const publicProfile = usePublicProfile(route.page === "profile" ? route.userId : undefined);
  const authorPosts = useAuthorPosts(route.page === "profile" ? route.userId : undefined);
  const likedPosts = useLikedPosts(route.page === "profile" ? route.userId : undefined);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("mps-theme2", theme);
  }, [theme]);

  useEffect(() => {
    const onPopState = () => {
      setRoute(routeFromPath(window.location.pathname));
      setTopicOpen(false);
      setNotificationsOpen(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showError = useCallback((message: string) => setToast(message), []);

  useEffect(() => {
    if (article.error) showError(article.error);
  }, [article.error, showError]);

  const navigate = useCallback((next: PathRoute) => {
    const pathname = pathForRoute(next);
    if (window.location.pathname !== pathname || window.location.hash) {
      window.history.pushState({}, "", pathname);
    }
    setRoute(next);
    setTopicOpen(false);
    setNotificationsOpen(false);
    window.scrollTo(0, 0);
  }, []);

  const openPage = (next: Page) => {
    if (next === "topic") {
      setTopicOpen(true);
      setNotificationsOpen(false);
      window.scrollTo(0, 0);
      return;
    }
    navigate(routeForPage(next));
  };

  const openArticle = (post: ApiPost) => navigate({ page: "article", slug: post.slug });
  const page: Page = route.page === "countries" && topicOpen ? "topic" : route.page;
  const role = devRole ?? auth.user?.role;

  let content = null;
  if (page === "feed") content = <Feed posts={posts.value ?? []} loading={posts.loading} onOpenArticle={openArticle} onOpenProfile={(userId) => navigate({ page: "profile", userId })} />;
  if (page === "countries" || page === "topic") {
    content = (
      <Forum
        page={page}
        initialCountryId={route.page === "countries" ? route.countryId : undefined}
        onNavigate={openPage}
        onCountryNavigate={(countryId) => navigate({ page: "countries", countryId })}
        onError={showError}
      />
    );
  }
  if (page === "article" && article.loading) {
    content = <main className="article-page"><div className="comment-skeleton"><i /><i /><i /></div></main>;
  }
  if (page === "article" && article.value) {
    content = <ArticleComments article={article.value} onBack={() => navigate({ page: "feed" })} onError={showError} onOpenProfile={(userId) => navigate({ page: "profile", userId })} />;
  }
  if (page === "article" && article.notFound) {
    content = (
      <main className="article-page">
        <section className="surface-card">
          <h1>Публикация не найдена</h1>
          <p>Возможно, ссылка устарела или публикация была снята с сайта.</p>
          <button className="primary-button" onClick={() => navigate({ page: "feed" })}>Вернуться в ленту</button>
        </section>
      </main>
    );
  }
  if (page === "article" && article.error) {
    content = (
      <main className="article-page">
        <button className="back-link" onClick={() => navigate({ page: "feed" })}>← В ленту</button>
        <button className="panel-button" onClick={() => void article.reload()}>Повторить загрузку</button>
      </main>
    );
  }
  if (page === "profile" && publicProfile.loading) {
    content = <main className="public-profile-page"><div className="comment-skeleton"><i /><i /><i /></div></main>;
  }
  if (page === "profile" && publicProfile.value) {
    content = (
      <PublicProfile
        profile={publicProfile.value}
        posts={authorPosts.value ?? []}
        likes={likedPosts.value ?? []}
        loading={authorPosts.loading}
        likesLoading={likedPosts.loading}
        viewerId={auth.user?.id ?? null}
        onOpenPost={openArticle}
        onToggleFollow={async () => {
          try {
            await publicProfile.toggleFollow();
          } catch (cause) {
            showError(cause instanceof Error ? cause.message : "Не удалось изменить подписку");
          }
        }}
      />
    );
  }
  if (page === "profile" && publicProfile.error) {
    content = (
      <main className="public-profile-page">
        <section className="public-profile-empty">
          <h1>Профиль не найден</h1>
          <p>Возможно, пользователь скрыл профиль или ссылка устарела.</p>
          <button className="primary-button" onClick={() => navigate({ page: "feed" })}>Вернуться в ленту</button>
        </section>
      </main>
    );
  }
  if (page === "reviews") content = <Reviews onError={showError} onPrivacy={() => openPage("privacy")} />;
  if (page === "subscribe") content = <Subscribe onError={showError} onPrivacy={() => openPage("privacy")} />;
  if (page === "about") content = <About publicSettings={publicSettings.value} />;
  if (page === "privacy" || page === "terms") {
    content = <Legal kind={page as LegalKind} onBack={() => navigate({ page: "feed" })} publicSettings={publicSettings.value} />;
  }

  return (
    <>
      <Layout
        page={page}
        theme={theme}
        notificationsOpen={notificationsOpen}
        unreadCount={notifications.items.filter((item) => !item.is_read).length}
        userName={auth.user ? `${auth.user.name || "Читатель"} · ${role}` : "Войти"}
        online={online.value ?? []}
        publicSettings={publicSettings.value}
        onNavigate={openPage}
        onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
        onOpenQA={() => setOverlay("qa")}
        onOpenProfile={() => setOverlay("profile")}
        onToggleNotifications={() => setNotificationsOpen(!notificationsOpen)}
        onOpenPrivacy={() => openPage("privacy")}
        onOpenTerms={() => openPage("terms")}
      >
        {content}
        {notificationsOpen && (
          <Notifications
            notifications={notifications.items}
            onReadAll={() => {
              void notifications.read().catch((cause) => showError(
                cause instanceof Error ? cause.message : "Не удалось обновить уведомления",
              ));
            }}
          />
        )}
        {overlay === "qa" && <QA onClose={() => setOverlay(null)} onError={showError} onPrivacy={() => { setOverlay(null); openPage("privacy"); }} />}
        {overlay === "profile" && (
          <Profile
            user={auth.user}
            onClose={() => setOverlay(null)}
            onRequestCode={auth.requestCode}
            onVerifyCode={auth.verifyCode}
            onTelegramLogin={auth.loginTelegram}
            onUpdate={auth.update}
            onUploadAvatar={auth.uploadAvatar}
            onLogout={auth.logout}
            onError={showError}
          />
        )}
        {!cookiesAccepted && (
          <CookieBanner
            onAccept={() => {
              localStorage.setItem("mps-cookie-consent", "accepted");
              setCookiesAccepted(true);
            }}
            onPrivacy={() => openPage("privacy")}
          />
        )}
        {toast && <div className="toast" role="alert">{toast}</div>}
      </Layout>
      {import.meta.env.DEV && auth.user && (
        <label className="dev-role-switch">
          Dev-роль
          <select value={devRole ?? auth.user.role} onChange={(event) => setDevRole(event.target.value)}>
            <option value="reader">reader</option>
            <option value="editor">editor</option>
            <option value="admin">admin</option>
          </select>
        </label>
      )}
    </>
  );
}
