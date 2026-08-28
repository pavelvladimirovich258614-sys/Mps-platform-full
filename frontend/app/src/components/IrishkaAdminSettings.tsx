import { type FormEvent, useEffect, useState } from "react";

import type { IrishkaAdminSettings as IrishkaSettings } from "../hooks";

type IrishkaAdminSettingsProps = {
  settings: IrishkaSettings | null;
  loading: boolean;
  onUpdate: (settings: IrishkaSettings) => Promise<void>;
};

export function IrishkaAdminSettings({ settings, loading, onUpdate }: IrishkaAdminSettingsProps) {
  const [enabled, setEnabled] = useState(false);
  const [delay, setDelay] = useState("30");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!settings) return;
    setEnabled(settings.irishka_enabled);
    setDelay(String(settings.irishka_delay_min));
  }, [settings]);

  if (loading || !settings) return null;

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const parsedDelay = Number(delay);
    if (!Number.isInteger(parsedDelay) || parsedDelay < 1 || parsedDelay > 10080) {
      setError("Укажите задержку от 1 до 10080 минут");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onUpdate({ irishka_enabled: enabled, irishka_delay_min: parsedDelay });
    } catch {
      setEnabled(settings.irishka_enabled);
      setDelay(String(settings.irishka_delay_min));
      setError("Не удалось сохранить настройки Иришки");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="irishka-admin-settings" aria-label="Настройки Иришки">
      <p>Только для администратора</p>
      <h2>Настройки Иришки</h2>
      <form onSubmit={save}>
        <label>
          <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
          Автоответы Иришки в форуме
        </label>
        <label>
          Ответить не раньше чем через, минут
          <input type="number" min="1" max="10080" step="1" required value={delay} onChange={(event) => setDelay(event.target.value)} />
        </label>
        <button type="submit" className="panel-button" disabled={saving}>{saving ? "Сохраняем…" : "Сохранить настройки Иришки"}</button>
      </form>
      <small>Настройки действуют только для автоматических ответов в форуме и не меняют прямые вопросы Иришке.</small>
      {error && <p className="irishka-admin-settings-error" role="alert">{error}</p>}
    </section>
  );
}
