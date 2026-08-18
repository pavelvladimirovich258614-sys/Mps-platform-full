const countryFlags: Record<string, string> = {
  "ОАЭ": "🇦🇪", "Турция": "🇹🇷", "Вьетнам": "🇻🇳", "Таиланд": "🇹🇭",
  "Китай": "🇨🇳", "Египет": "🇪🇬", "Мальдивы": "🇲🇻", "Россия": "🇷🇺",
};

/** Maps fixed F06 country names from the seed to their display emoji. */
export const countryFlag = (name: string) => countryFlags[name] ?? "🌍";
