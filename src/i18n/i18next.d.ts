import "i18next";
import type en from "./locales/en.json";

// Bind t() keys to the English resource shape so typos fail `tsc -b`.
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: { translation: typeof en };
  }
}
