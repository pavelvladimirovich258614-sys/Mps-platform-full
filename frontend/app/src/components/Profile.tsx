import { useEffect, useState } from "react";

import type { User } from "../hooks";
import { TelegramLogin, type TelegramAuthData } from "./TelegramLogin";

type ProfileProps = {
  user: User | null;
  onClose: () => void;
  onRequestCode: (email: string) => Promise<void>;
  onVerifyCode: (email: string, code: string) => Promise<unknown>;
  onTelegramLogin: (payload: TelegramAuthData) => Promise<unknown>;
  onUpdate: (values: { name: string; bio: string; is_anonymous: boolean }) => Promise<unknown>;
  onUploadAvatar: (file: File) => Promise<unknown>;
  onLogout: () => Promise<void>;
  onError: (message: string) => void;
};

export function Profile({ user, onClose, onRequestCode, onVerifyCode, onTelegramLogin, onUpdate, onUploadAvatar, onLogout, onError }: ProfileProps) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [anonymous, setAnonymous] = useState(user?.is_anonymous ?? false);

  useEffect(() => {
    setName(user?.name ?? "");
    setBio(user?.bio ?? "");
    setAnonymous(user?.is_anonymous ?? false);
  }, [user?.id]);

  const request = async () => { try { await onRequestCode(email); setSent(true); } catch (cause) { onError(cause instanceof Error ? cause.message : "Не удалось отправить код"); } };
  const verify = async () => { try { await onVerifyCode(email, code); } catch (cause) { onError(cause instanceof Error ? cause.message : "Не удалось войти"); } };

  if (!user) {
    return <div className="modal-backdrop" role="dialog" aria-modal="true" onMouseDown={onClose}><section className="profile-modal" onMouseDown={(event) => event.stopPropagation()}><h2>Войти</h2><p className="page-description">Войдите по коду из письма, чтобы писать и сохранять ответы.</p><div className="form-grid"><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Электронная почта" />{sent && <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Код из письма" inputMode="numeric" />}</div><div className="form-actions"><button className="panel-button" onClick={sent ? verify : request}>{sent ? "Подтвердить" : "Получить код"}</button></div><div className="telegram-reading">или <TelegramLogin botUsername={import.meta.env.VITE_TELEGRAM_BOT_USERNAME ?? ""} onAuth={onTelegramLogin} onError={onError} /></div></section></div>;
  }

  const save = async () => { try { await onUpdate({ name, bio, is_anonymous: anonymous }); onClose(); } catch (cause) { onError(cause instanceof Error ? cause.message : "Не удалось сохранить профиль"); } };
  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => { const [file] = Array.from(event.target.files ?? []); if (!file) return; try { await onUploadAvatar(file); } catch (cause) { onError(cause instanceof Error ? cause.message : "Не удалось загрузить аватар"); } };
  const logout = async () => { try { await onLogout(); onClose(); } catch (cause) { onError(cause instanceof Error ? cause.message : "Не удалось выйти"); } };

  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Мой профиль" onMouseDown={onClose}><section className="profile-modal" onMouseDown={(event) => event.stopPropagation()}><h2>Мой профиль</h2><div className="profile-avatar-row"><span className="profile-avatar">{user.avatar_url && <img src={user.avatar_url} alt="" />}</span><div><strong>{user.name || "Путешественник"}</strong><small className="profile-role">Роль: {user.role}</small></div><label className="avatar-upload">Загрузить аватар<input aria-label="Загрузить аватар" type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadAvatar} /></label></div><div className="form-grid"><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Имя" /><textarea value={bio} onChange={(event) => setBio(event.target.value)} placeholder="О себе" /></div><button className="online-toggle" onClick={() => setAnonymous(!anonymous)}><span>Показывать меня онлайн</span><i className={!anonymous ? "on" : ""}><b /></i></button><button className="primary-button" onClick={save}>Готово</button><button className="profile-logout" onClick={logout}>Выйти</button></section></div>;
}
