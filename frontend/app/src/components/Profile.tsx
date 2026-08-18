import { useState } from "react";

export function Profile({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("Марина К.");
  const [bio, setBio] = useState("Люблю собирать маршруты без спешки.");
  const [visibleOnline, setVisibleOnline] = useState(true);
  const [countries, setCountries] = useState(["🇹🇷 Турция", "🇦🇪 ОАЭ", "🇻🇳 Вьетнам"]);
  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Мой профиль" onMouseDown={onClose}><section className="profile-modal" onMouseDown={(event) => event.stopPropagation()}><h2>Мой профиль</h2><div className="profile-avatar-row"><span className="profile-avatar" /><button>Изменить фото</button></div><div className="form-grid"><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Имя" /><textarea value={bio} onChange={(event) => setBio(event.target.value)} placeholder="О себе" /></div><h3>Страны, где я был</h3><div className="country-chips">{countries.map((country) => <span key={country}>{country}<button onClick={() => setCountries(countries.filter((item) => item !== country))}>×</button></span>)}<button className="add-country" onClick={() => setCountries([...countries, "🇹🇭 Таиланд"])}>+ добавить страну</button></div><button className="online-toggle" onClick={() => setVisibleOnline(!visibleOnline)}><span>Показывать меня онлайн</span><i className={visibleOnline ? "on" : ""}><b /></i></button><p className="profile-limit">Моих тем: 2 из 3</p><button className="primary-button" onClick={onClose}>Готово</button></section></div>;
}
