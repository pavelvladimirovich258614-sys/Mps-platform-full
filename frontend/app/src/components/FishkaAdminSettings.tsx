import { useState } from "react";

import type { FishkaAdminSettings } from "../hooks";

type FishkaAdminSettingsProps = {
  settings: FishkaAdminSettings | null;
  loading: boolean;
  onUpdate: (enabled: boolean) => Promise<void>;
};

export function FishkaAdminSettings({ settings, loading, onUpdate }: FishkaAdminSettingsProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (loading || settings === null) return null;

  const update = async (enabled: boolean) => {
    setSaving(true);
    setError("");
    try {
      await onUpdate(enabled);
    } catch {
      setError("Не удалось изменить настройку. Попробуйте ещё раз.");
    } finally {
      setSaving(false);
    }
  };

  return <section className="fishka-admin-settings" aria-labelledby="fishka-admin-settings-title">
    <p>Настройки администратора</p>
    <h2 id="fishka-admin-settings-title">Приём фишек</h2>
    <label>
      <input
        type="checkbox"
        checked={settings.fishka_submissions_enabled}
        disabled={saving}
        onChange={(event) => void update(event.target.checked)}
      />
      Разрешить пользователям добавлять фишки
    </label>
    <small>Фишки пользователей поступают на модерацию; редакторы и администраторы публикуют их сразу.</small>
    {error && <p className="fishka-admin-settings-error" role="alert">{error}</p>}
  </section>;
}
