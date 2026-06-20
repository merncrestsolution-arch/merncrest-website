import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ta", "si"],
  defaultLocale: "en",
  localePrefix: "always",
});
