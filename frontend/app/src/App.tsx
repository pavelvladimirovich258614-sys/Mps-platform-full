import { useEffect, useState } from "react";

import { ArticleComments } from "./components/ArticleComments";
import { Feed } from "./components/Feed";
import { Forum } from "./components/Forum";
import { Layout, type Page } from "./components/Layout";

export type Post = {
  id: number;
  kind: "article" | "tip" | "video";
  tag: string;
  title: string;
  text?: string;
  country?: string;
  flag?: string;
  videoDate?: string;
  byRequest?: boolean;
};

const posts: Post[] = [
  { id: 1, kind: "article", tag: "Направление · 8 мин чтения", title: "Ликийское побережье осенью: куда ехать, когда все уже уехали", text: "Сентябрь и октябрь на юге Турции — та же вода 26 градусов, но вдвое меньше людей и цены как в мае." },
  { id: 2, kind: "tip", tag: "Фишка · Турция", title: "Трансфер из Антальи дешевле брать не в аэропорту", text: "Стойки внутри терминала берут наценку до 40%. Закажите трансфер заранее — водитель встретит с табличкой." },
  { id: 3, kind: "video", tag: "Видеообзор", title: "Видеообзор отеля Rixos Bab Al Bahr", country: "ОАЭ", flag: "🇦🇪", videoDate: "12 августа 2026", byRequest: true },
];

export function App() {
  const [page, setPage] = useState<Page>("feed");
  const [theme, setTheme] = useState<"dark" | "light">(() => localStorage.getItem("mps-theme2") === "light" ? "light" : "dark");
  const [articleId, setArticleId] = useState<number | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("mps-theme2", theme);
  }, [theme]);

  const openArticle = (postId: number) => {
    setArticleId(postId);
    setPage("article");
    window.scrollTo(0, 0);
  };
  const openPage = (nextPage: Page) => {
    setPage(nextPage);
    window.scrollTo(0, 0);
  };
  const article = posts.find((post) => post.id === articleId) ?? posts[0];

  return <Layout page={page} theme={theme} onNavigate={openPage} onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")}>
    {page === "feed" && <Feed posts={posts} onOpenArticle={openArticle} />}
    {(page === "countries" || page === "topic") && <Forum page={page} onNavigate={openPage} />}
    {page === "article" && <ArticleComments article={article} onBack={() => openPage("feed")} />}
  </Layout>;
}
