import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as "en" | "ta" | "si")) {
    locale = routing.defaultLocale;
  }

  let messages;
  if (locale === 'ta') {
    messages = (await import('../messages/ta.json')).default;
  } else if (locale === 'si') {
    messages = (await import('../messages/si.json')).default;
  } else {
    messages = (await import('../messages/en.json')).default;
  }

  return {
    locale,
    messages
  };
});
