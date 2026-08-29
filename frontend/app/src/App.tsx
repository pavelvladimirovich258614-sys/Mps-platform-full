import { useCallback, useEffect, useState } from "react";

import { About } from "./components/About";
import { ArticleComments } from "./components/ArticleComments";
import { CookieBanner } from "./components/CookieBanner";
import { Drafts } from "./components/Drafts";
import { Feed } from "./components/Feed";
import { FishkaAdminSettings } from "./components/FishkaAdminSettings";
import { Forum } from "./components/Forum";
import { IrishkaAdminSettings } from "./components/IrishkaAdminSettings";
import { Layout, type Page } from "./components/Layout";
import { Legal, type LegalKind } from "./components/Legal";
import { Notifications } from "./components/Notifications";
import { PageCard } from "./components/PageCard";
import { Profile } from "./components/Profile";
import { PostComposer, type EditablePost } from "./components/PostComposer";
import { PublicProfile } from "./components/PublicProfile";
import { QA } from "./components/QA";
import { Reviews } from "./components/Reviews";
import { Subscribe } from "./components/Subscribe";
import { getDraft, getLikedPosts, type ApiPost, type FishkaDraft, useAuthorPosts, useAuth, useDrafts, useFishkaAdminSettings, useFishkaCategories, useFishkaPermission, useIrishkaAdminSettings, useLikedPosts, useNotifications, useOnline, usePost, usePostCreator, usePostEditor, usePostLike, usePosts, useProfileActivity, useProfileComments, useProfileFollowers, useProfileFollowing, usePublicProfile, usePublicSettings, useQAQuestions, useUserFollow } from "./hooks";
import { pathForRoute, type PathRoute, routeFromPath } from "./router";

type Theme = "dark" | "light";

const THEME_COLORS: Record<Theme, string> = {
  dark: "#0a0e18",
  light: "#efece4",
};

function initialTheme(): Theme {
  const savedTheme = localStorage.getItem("mps-theme2");
  return savedTheme === "dark" || savedTheme === "light" ? savedTheme : "light";
}

function routeForPage(page: Page): PathRoute {
  if (page === "countries") return { page: "countries" };
  if (page === "fishki") return { page: "fishki" };
  if (page === "drafts") return { page: "drafts" };
  if (page === "reviews" || page === "subscribe" || page === "about" || page === "privacy" || page === "terms") {
    return { page };
  }
  return { page: "feed" };
}

export function App() {
  const [route, setRoute] = useState<PathRoute>(() => routeFromPath(window.location.pathname));
  const [topicOpen, setTopicOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [overlay, setOverlay] = useState<"qa" | "profile" | null>(null);
  const [qaQuestionId, setQaQuestionId] = useState<number | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [cookiesAccepted, setCookiesAccepted] = useState(
    () => localStorage.getItem("mps-cookie-consent") === "accepted",
  );
  const [toast, setToast] = useState("");
  const [devRole, setDevRole] = useState<string | null>(null);
  const [likesByPostId, setLikesByPostId] = useState<Record<number, number>>({});
  const [likedPostsByUserId, setLikedPostsByUserId] = useState<Record<number, ApiPost[]>>({});
  const [editingPost, setEditingPost] = useState<EditablePost | null>(null);
  const [fishkaCategory, setFishkaCategory] = useState("");
  const [createPostRequested, setCreatePostRequested] = useState(false);

  const auth = useAuth();
  const canManagePosts = auth.user?.role === "editor" || auth.user?.role === "admin";
  const isAdmin = auth.user?.role === "admin";
  const fishkiPage = route.page === "fishki";
  const posts = usePosts(fishkiPage ? "fishka" : undefined, fishkiPage ? fishkaCategory || undefined : undefined);
  const drafts = useDrafts(route.page === "drafts" && canManagePosts);
  const fishkaCategories = useFishkaCategories(fishkiPage);
  const fishkaPermission = useFishkaPermission(route.page === "fishki" && Boolean(auth.user) && !canManagePosts);
  const fishkaAdminSettings = useFishkaAdminSettings(route.page === "fishki" && isAdmin);
  const irishkaAdminSettings = useIrishkaAdminSettings(route.page === "countries" && route.countryId === undefined && isAdmin);
  const postCreator = usePostCreator();
  const postEditor = usePostEditor();
  const postLike = usePostLike();
  const notifications = useNotifications();
  const notificationQuestions = useQAQuestions(notificationsOpen);
  const online = useOnline(auth.user?.id);
  const publicSettings = usePublicSettings();
  const article = usePost(route.page === "article" ? route.slug : undefined);
  const publicProfile = usePublicProfile(route.page === "profile" ? route.userId : undefined);
  const authorPosts = useAuthorPosts(route.page === "profile" ? route.userId : undefined);
  const likedPosts = useLikedPosts(route.page === "profile" ? route.userId : undefined);
  const profileActivity = useProfileActivity(route.page === "profile" ? route.userId : undefined);
  const profileComments = useProfileComments(route.page === "profile" ? route.userId : undefined);
  const profileFollowers = useProfileFollowers(route.page === "profile" ? route.userId : undefined);
  const profileFollowing = useProfileFollowing(route.page === "profile" ? route.userId : undefined);
  const railSubscriptions = useProfileFollowing(auth.user?.id);
  const userFollow = useUserFollow();

  useEffect(() => {
    if (route.page !== "profile" || likedPosts.loading || likedPosts.value === null) return;
    setLikedPostsByUserId((current) => current[route.userId] === undefined ? { ...current, [route.userId]: likedPosts.value ?? [] } : current);
  }, [likedPosts.loading, likedPosts.value, route]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("mps-theme2", theme);
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
      ?.setAttribute("content", THEME_COLORS[theme]);
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
  const withLikesCount = (post: ApiPost): ApiPost => ({ ...post, likes_count: likesByPostId[post.id] ?? post.likes_count });
  const toggleLike = async (post: ApiPost) => {
    if (!auth.user) {
      setOverlay("profile");
      return;
    }
    const currentUser = auth.user;
    try {
      const result = await postLike.toggle(post.id);
      setLikesByPostId((current) => ({ ...current, [post.id]: result.likes_count }));
      const refreshedLikes = await getLikedPosts(currentUser.id);
      setLikedPostsByUserId((current) => ({ ...current, [currentUser.id]: refreshedLikes }));
    } catch (cause) {
      showError(cause instanceof Error ? cause.message : "Не удалось изменить лайк");
    }
  };
  const createPost = async (draft: Parameters<typeof postCreator.create>[0]): Promise<EditablePost | undefined> => {
    const created = await postCreator.create(draft);
    if (draft.status === "draft") {
      await drafts.reload();
      return { id: created.id, title: created.title, type: "article", body: created.body, status: "draft", cover_url: created.cover_url };
    }
    await posts.reload();
  };
  const createFishka = async (draft: FishkaDraft) => {
    await postCreator.create(draft);
    if (draft.status === "published") {
      await posts.reload();
      setToast("Фишка опубликована");
    } else {
      setToast("Фишка отправлена на проверку");
    }
  };
  const updatePost = async (post: EditablePost, draft: Parameters<typeof postEditor.update>[1]): Promise<EditablePost> => {
    const updated = await postEditor.update(post.id, draft);
    const editable = { id: updated.id, title: updated.title, type: "article" as const, body: updated.body, status: draft.status, cover_url: updated.cover_url };
    if (post.status === "published") {
      article.setValue(updated);
      setEditingPost(null);
    }
    if (draft.status === "published") await posts.reload();
    await drafts.reload();
    return editable;
  };
  const openDraft = async (postId: number) => {
    try {
      const draft = await getDraft(postId);
      setEditingPost({ id: draft.id, title: draft.title, type: "article", body: draft.body, status: "draft", cover_url: draft.cover_url });
    } catch (cause) {
      showError(cause instanceof Error ? cause.message : "Не удалось загрузить черновик");
    }
  };
  const deletePost = async (post: ApiPost) => {
    try {
      await postEditor.remove(post.id);
      await posts.reload();
      navigate({ page: "feed" });
    } catch (cause) {
      showError(cause instanceof Error ? cause.message : "Не удалось удалить публикацию");
    }
  };
  const deleteDraft = async (draft: { id: number }) => {
    await postEditor.remove(draft.id);
    drafts.setValue((current) => (current ?? []).filter((item) => item.id !== draft.id));
  };
  const page: Page = route.page === "countries" && topicOpen ? "topic" : route.page;
  let content = null;
  if (page === "feed") content = <Feed posts={(posts.value ?? []).map(withLikesCount)} loading={posts.loading} canCreate={canManagePosts} onCreatePost={createPost} createPostRequested={createPostRequested} onCreatePostRequestHandled={() => setCreatePostRequested(false)} onToggleLike={toggleLike} onOpenArticle={openArticle} onOpenProfile={(userId) => navigate({ page: "profile", userId })} onNotice={setToast} />;
  if (page === "fishki") content = <Feed mode="fishki" posts={(posts.value ?? []).map(withLikesCount)} loading={posts.loading} canCreateFishka={canManagePosts || fishkaPermission.value?.can_submit_fishka === true} fishkaPublishesImmediately={canManagePosts} fishkaAdminControls={<FishkaAdminSettings settings={isAdmin ? fishkaAdminSettings.value : null} loading={isAdmin && fishkaAdminSettings.loading} onUpdate={fishkaAdminSettings.update} />} fishkaCategories={fishkaCategories.value ?? []} fishkaCategory={fishkaCategory} onFishkaCategoryChange={setFishkaCategory} onCreateFishka={createFishka} onToggleLike={toggleLike} onOpenArticle={openArticle} onOpenProfile={(userId) => navigate({ page: "profile", userId })} onNotice={setToast} />;
  if (page === "countries" || page === "topic") {
    content = (
      <Forum
        page={page}
        initialCountryId={route.page === "countries" ? route.countryId : undefined}
        viewer={auth.user}
        onNavigate={openPage}
        onCountryNavigate={(countryId) => navigate({ page: "countries", countryId })}
        onError={showError}
        irishkaAdminControls={<IrishkaAdminSettings settings={isAdmin ? irishkaAdminSettings.value : null} loading={isAdmin && irishkaAdminSettings.loading} onUpdate={irishkaAdminSettings.update} />}
      />
    );
  }
  if (page === "article" && article.loading) {
    content = <main className="article-page"><div className="comment-skeleton"><i /><i /><i /></div></main>;
  }
  if (page === "article" && article.value) {
    content = <ArticleComments article={withLikesCount(article.value)} commentsModerationEnabled={publicSettings.value?.comments_moderation_enabled ?? false} onBack={() => navigate({ page: "feed" })} onError={showError} onOpenProfile={(userId) => navigate({ page: "profile", userId })} onToggleLike={toggleLike} canManage={canManagePosts} onEdit={(post) => setEditingPost({ id: post.id, title: post.title, type: "article", body: post.body, status: "published", cover_url: post.cover_url })} onDelete={deletePost} />;
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
        likes={likedPostsByUserId[publicProfile.value.id] ?? likedPosts.value ?? []}
        activity={profileActivity.items}
        comments={profileComments.value ?? []}
        followers={profileFollowers.value ?? []}
        following={profileFollowing.value ?? []}
        loading={authorPosts.loading}
        likesLoading={likedPosts.loading}
        activityLoading={profileActivity.loading}
        activityLoadingMore={profileActivity.loadingMore}
        activityHasMore={profileActivity.hasMore}
        commentsLoading={profileComments.loading}
        followListsLoading={profileFollowers.loading || profileFollowing.loading}
        viewerId={auth.user?.id ?? null}
        currentUser={auth.user}
        isOnline={Boolean(online.value?.some((person) => person.id === publicProfile.value?.id))}
        onOpenPost={openArticle}
        onLoadMoreActivity={profileActivity.loadMore}
        onEditProfile={() => setOverlay("profile")}
        onLogout={async () => { await auth.logout(); navigate({ page: "feed" }); }}
        onNotice={setToast}
        onToggleFollow={async () => {
          try {
            await publicProfile.toggleFollow();
          } catch (cause) {
            showError(cause instanceof Error ? cause.message : "Не удалось изменить подписку");
          }
        }}
        onToggleListFollow={async (userId, isFollowing) => {
          try {
            return await userFollow.toggle(userId, isFollowing);
          } catch (cause) {
            showError(cause instanceof Error ? cause.message : "Не удалось изменить подписку");
            throw cause;
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
  if (page === "reviews") content = <Reviews canModerate={canManagePosts} canTrackOwn={Boolean(auth.user)} onError={showError} onPrivacy={() => openPage("privacy")} />;
  if (page === "subscribe") content = <Subscribe onError={showError} onPrivacy={() => openPage("privacy")} />;
  if (page === "about") content = <About publicSettings={publicSettings.value} />;
  if (page === "drafts" && canManagePosts) content = <Drafts drafts={drafts.value ?? []} loading={drafts.loading} error={drafts.error} onRetry={() => void drafts.reload()} onOpen={(draft) => void openDraft(draft.id)} onDelete={deleteDraft} />;
  if (page === "drafts" && !canManagePosts) content = <main className="feed-page"><div className="feed-wrap"><section className="surface-card"><h1>Раздел недоступен</h1><p>Черновики доступны только редактору.</p></section></div></main>;
  if (page === "privacy" || page === "terms") {
    content = <Legal kind={page as LegalKind} onBack={() => navigate({ page: "feed" })} publicSettings={publicSettings.value} />;
  }

  return (
    <>
      <Layout
        page={page}
        canManagePosts={canManagePosts}
        theme={theme}
        notificationsOpen={notificationsOpen}
        unreadCount={notifications.items.filter((item) => !item.is_read).length}
        userName={auth.user?.name || (auth.user ? "Читатель" : "Войти")}
        isAuthenticated={Boolean(auth.user)}
        online={online.value ?? []}
        subscriptions={railSubscriptions.value ?? []}
        subscriptionsLoading={railSubscriptions.loading}
        publicSettings={publicSettings.value}
        onNavigate={openPage}
        onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
        onOpenQA={() => { setQaQuestionId(null); setOverlay("qa"); }}
        onOpenProfile={() => {
          if (auth.user) navigate({ page: "profile", userId: auth.user.id });
          else setOverlay("profile");
        }}
        onOpenUserProfile={(userId) => navigate({ page: "profile", userId })}
        onToggleNotifications={() => setNotificationsOpen(!notificationsOpen)}
        onCreatePost={() => {
          setCreatePostRequested(true);
          navigate({ page: "feed" });
        }}
        onOpenPrivacy={() => openPage("privacy")}
        onOpenTerms={() => openPage("terms")}
      >
        <PageCard>{content}</PageCard>
        {notificationsOpen && (
          <Notifications
            notifications={notifications.items}
            questions={notificationQuestions.value ?? []}
            onOpenQuestion={(notification, questionId) => {
              setNotificationsOpen(false);
              setQaQuestionId(questionId);
              setOverlay("qa");
              void notifications.read([notification.id]).catch((cause) => showError(
                cause instanceof Error ? cause.message : "Не удалось обновить уведомление",
              ));
            }}
            onReadAll={() => {
              void notifications.read().catch((cause) => showError(
                cause instanceof Error ? cause.message : "Не удалось обновить уведомления",
              ));
            }}
          />
        )}
        {overlay === "qa" && <QA initialQuestionId={qaQuestionId} onClose={() => { setOverlay(null); setQaQuestionId(null); }} onError={showError} onPrivacy={() => { setOverlay(null); setQaQuestionId(null); openPage("privacy"); }} />}
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
      {editingPost && (
        <div className="modal-backdrop composer-modal-backdrop" role="dialog" aria-modal="true" aria-label="Редактирование публикации" onMouseDown={() => setEditingPost(null)}>
          <section className="composer-modal" onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="round-close" aria-label="Закрыть" onClick={() => setEditingPost(null)}>×</button>
            <PostComposer initialPost={editingPost} onUpdate={(draft) => updatePost(editingPost, draft)} onClose={() => setEditingPost(null)} />
          </section>
        </div>
      )}
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
