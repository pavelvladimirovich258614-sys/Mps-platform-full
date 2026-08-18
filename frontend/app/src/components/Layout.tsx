import { type ReactNode, useState } from "react";

export type Page = "feed" | "countries" | "topic" | "article";

type LayoutProps = { children: ReactNode; page: Page; theme: "dark" | "light"; onNavigate: (page: Page) => void; onThemeToggle: () => void };
const navigation: Array<{ id: Page; label: string; icon: string }> = [{ id: "feed", label: "Лента", icon: "▤" }, { id: "countries", label: "Страны", icon: "◌" }];

export function SunLogo() {
  return <svg aria-hidden="true" className="sun-logo" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="17" r="5.4" /><path d="M20 6.5v-3M28.5 9.5l2-2M11.5 9.5l-2-2M31 17h3M6 17h3" /><path d="M9 26.5c2.6 0 2.6-1.6 5.2-1.6s2.6 1.6 5.2 1.6 2.6-1.6 5.2-1.6 2.6 1.6 5.2 1.6" /><path d="M9 31.5c2.6 0 2.6-1.6 5.2-1.6s2.6 1.6 5.2 1.6 2.6-1.6 5.2-1.6 2.6 1.6 5.2 1.6" /></svg>;
}

export function Layout({ children, page, theme, onNavigate, onThemeToggle }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = (next: Page) => { onNavigate(next); setMobileMenuOpen(false); };
  const countriesActive = page === "countries" || page === "topic";
  return <div className="app-shell"><div className="ambient" aria-hidden="true"><i /><i /><i /></div>
    <header className="site-header"><div className="header-inner"><div className="header-brand"><button className="menu-button" aria-label="Меню" onClick={() => setMobileMenuOpen(true)}>☰</button><button className="logo-button" onClick={() => navigate("feed")} aria-label="На главную"><SunLogo /><span className="brand-copy"><strong>Мир под солнцем</strong><small>журнал о путешествиях</small></span></button></div><div className="header-actions"><button className="round-button" aria-label="Поиск">⌕</button><button className="round-button" aria-label="Сменить тему" onClick={onThemeToggle}>{theme === "dark" ? "☀" : "☾"}</button><button className="login-button">Войти</button></div></div></header>
    <div className="site-body"><aside className="side-nav" aria-label="Основная навигация">{navigation.map((item) => <button className={page === item.id || (item.id === "countries" && countriesActive) ? "nav-item current" : "nav-item"} key={item.id} onClick={() => navigate(item.id)}><span>{item.icon}</span>{item.label}</button>)}</aside><div className="content-column">{children}</div><aside className="presence" aria-label="Сейчас на платформе"><p>Сейчас на платформе</p>{["Анна", "Костя", "Марина", "Саша"].map((name, index) => <div className="presence-person" key={name}><span className={`avatar avatar-${index}`} /><span>{name}</span><i /></div>)}<small>и ещё 14</small></aside></div>
    <nav className="mobile-nav" aria-label="Мобильная навигация">{navigation.map((item) => <button key={item.id} onClick={() => navigate(item.id)} className={page === item.id || (item.id === "countries" && countriesActive) ? "current" : ""}>{item.icon}<span>{item.label}</span></button>)}</nav>
    {mobileMenuOpen && <div className="mobile-sheet" role="dialog" aria-modal="true" aria-label="Меню"><button className="sheet-backdrop" aria-label="Закрыть меню" onClick={() => setMobileMenuOpen(false)} /><section className="sheet-content"><button className="close-sheet" onClick={() => setMobileMenuOpen(false)}>×</button><SunLogo /><strong>Мир под солнцем</strong>{navigation.map((item) => <button key={item.id} onClick={() => navigate(item.id)}>{item.icon} {item.label}</button>)}<button onClick={onThemeToggle}>{theme === "dark" ? "☀ Светлая тема" : "☾ Тёмная тема"}</button></section></div>}
    <footer>◆ ваше путешествие начинается с доверия ◆</footer>
  </div>;
}
