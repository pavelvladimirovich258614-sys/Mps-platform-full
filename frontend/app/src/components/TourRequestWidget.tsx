import { type FormEvent, type MouseEvent, useCallback, useEffect, useRef, useState } from "react";

import { useTourRequest, type TourRequestPayload } from "../hooks";

type TourRequestWidgetProps = {
  onOpenPrivacy: () => void;
};

type FormValues = {
  name: string;
  contact: string;
  destination: string;
  budget: string;
  comment: string;
  consent: boolean;
};

type FormErrors = Partial<Record<"name" | "contact" | "destination" | "consent", string>>;

const INITIAL_VALUES: FormValues = {
  name: "",
  contact: "",
  destination: "",
  budget: "",
  comment: "",
  consent: false,
};

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function TourIcon() {
  return <svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><path d="M4 17.5h16M7 17.5l2-7h6l2 7M10 10.5V7h4v3.5M6 21h12" /><path d="M9 7h6l-1-3h-4L9 7Z" /></svg>;
}

function CloseIcon() {
  return <svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18" /></svg>;
}

function CheckIcon() {
  return <svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" /></svg>;
}

export function TourRequestWidget({ onOpenPrivacy }: TourRequestWidgetProps) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const { countries, countriesLoading, countriesError, reloadCountries, submit } = useTourRequest(open);

  const close = useCallback(() => setOpen(false), []);
  const show = (event: MouseEvent<HTMLButtonElement>) => {
    openerRef.current = event.currentTarget;
    setErrors({});
    setServerError("");
    setSubmitted(false);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => {
      dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus();
    }, 0);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable.at(-1) as HTMLElement;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      window.setTimeout(() => openerRef.current?.focus(), 0);
    };
  }, [close, open]);

  const setField = (field: Exclude<keyof FormValues, "consent">, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (field === "name" || field === "contact" || field === "destination") {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const validate = () => {
    const next: FormErrors = {};
    if (!values.name.trim()) next.name = "Укажите имя";
    if (values.contact.trim().length < 3) next.contact = "Укажите телефон или Telegram";
    if (!values.destination.trim()) next.destination = "Укажите направление";
    if (!values.consent) next.consent = "Нужно согласие на обработку персональных данных";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError("");
    if (!validate()) return;
    const payload: TourRequestPayload = {
      name: values.name.trim(),
      contact: values.contact.trim(),
      destination: values.destination.trim(),
      budget: values.budget.trim() || null,
      comment: values.comment.trim() || null,
      personal_data_consent: true,
    };
    setSending(true);
    try {
      await submit(payload);
      setSubmitted(true);
      setValues(INITIAL_VALUES);
    } catch (cause) {
      setServerError(cause instanceof Error ? cause.message : "Не удалось отправить заявку. Попробуйте ещё раз.");
    } finally {
      setSending(false);
    }
  };

  const openPrivacy = () => {
    close();
    onOpenPrivacy();
  };

  return <>
    <button className="tour-request-desktop" type="button" onClick={show} aria-haspopup="dialog">
      <TourIcon />
      <span><strong>Подобрать тур</strong><small>Оставьте заявку менеджеру</small></span>
    </button>
    <button className="tour-request-fab" type="button" onClick={show} aria-haspopup="dialog" aria-label="Подобрать тур">
      <TourIcon /><span>Подобрать тур</span>
    </button>
    {open && <div className="tour-request-dialog-shell">
      <div
        ref={dialogRef}
        className="tour-request-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-request-title"
      >
        <div className="tour-request-dialog-content">
          <header>
            <span className="tour-request-dialog-mark" aria-hidden="true"><TourIcon /></span>
            <div><p>Персональная заявка</p><h2 id="tour-request-title">Подобрать тур</h2></div>
          </header>
          {submitted ? <section className="tour-request-success" role="status">
            <span><CheckIcon /></span>
            <h3>Заявка отправлена</h3>
            <p>Менеджер свяжется с вами по указанному контакту.</p>
            <button type="button" onClick={close}>Закрыть</button>
          </section> : <form aria-label="Заявка на подбор тура" onSubmit={handleSubmit} noValidate aria-busy={sending}>
            <div className="tour-request-fields">
              <label htmlFor="tour-request-name">Имя</label>
              <input id="tour-request-name" value={values.name} onChange={(event) => setField("name", event.target.value)} maxLength={100} autoComplete="name" disabled={sending} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "tour-request-name-error" : undefined} />
              {errors.name && <small className="tour-request-error" id="tour-request-name-error">{errors.name}</small>}

              <label htmlFor="tour-request-contact">Телефон или Telegram</label>
              <input id="tour-request-contact" type="tel" value={values.contact} onChange={(event) => setField("contact", event.target.value)} maxLength={255} autoComplete="tel" placeholder="+7 900 000-00-00 или @username" disabled={sending} aria-invalid={Boolean(errors.contact)} aria-describedby={errors.contact ? "tour-request-contact-error" : undefined} />
              {errors.contact && <small className="tour-request-error" id="tour-request-contact-error">{errors.contact}</small>}

              <label htmlFor="tour-request-destination">Направление</label>
              <input id="tour-request-destination" list="tour-request-countries" value={values.destination} onChange={(event) => setField("destination", event.target.value)} maxLength={255} placeholder="Страна, город или идея поездки" disabled={sending} aria-invalid={Boolean(errors.destination)} aria-describedby={errors.destination ? "tour-request-destination-error" : "tour-request-destination-help"} />
              <datalist id="tour-request-countries">{countries.map((country) => <option key={country.id} value={country.name} />)}</datalist>
              {errors.destination ? <small className="tour-request-error" id="tour-request-destination-error">{errors.destination}</small> : <small id="tour-request-destination-help">Можно выбрать подсказку или ввести своё направление.</small>}
              {countriesLoading && <small role="status">Загружаем подсказки стран…</small>}
              {countriesError && <div className="tour-request-countries-error"><small>{countriesError}</small><button type="button" onClick={() => void reloadCountries()}>Повторить</button></div>}

              <label htmlFor="tour-request-budget">Бюджет (необязательно)</label>
              <input id="tour-request-budget" value={values.budget} onChange={(event) => setField("budget", event.target.value)} maxLength={100} inputMode="text" placeholder="Например, до 250 000 ₽" disabled={sending} />

              <label htmlFor="tour-request-comment">Комментарий (необязательно)</label>
              <textarea id="tour-request-comment" value={values.comment} onChange={(event) => setField("comment", event.target.value)} maxLength={2000} rows={4} placeholder="Даты, количество туристов, пожелания" disabled={sending} />
            </div>
            <label className="tour-request-consent" htmlFor="tour-request-consent">
              <input id="tour-request-consent" type="checkbox" checked={values.consent} onChange={(event) => { setValues((current) => ({ ...current, consent: event.target.checked })); setErrors((current) => ({ ...current, consent: undefined })); }} disabled={sending} aria-invalid={Boolean(errors.consent)} aria-describedby={errors.consent ? "tour-request-consent-error" : undefined} />
              <span>Согласен на обработку персональных данных</span>
            </label>
            {errors.consent && <small className="tour-request-error" id="tour-request-consent-error">{errors.consent}</small>}
            <button className="tour-request-policy" type="button" onClick={openPrivacy}>Политика обработки персональных данных</button>
            {serverError && <p className="tour-request-server-error" role="alert">{serverError}</p>}
            <button className="tour-request-submit" type="submit" disabled={sending}>{sending ? "Отправляем…" : "Отправить заявку"}</button>
          </form>}
        </div>
        <button className="tour-request-close" type="button" aria-label="Закрыть форму" onClick={close}><CloseIcon /></button>
      </div>
    </div>}
  </>;
}
