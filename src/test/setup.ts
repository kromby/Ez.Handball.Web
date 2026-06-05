import "@testing-library/jest-dom/vitest";
import { beforeEach } from "vitest";
import { i18n } from "../i18n";

// Deterministic English copy and a clean storage slate for every test.
beforeEach(() => {
  localStorage.clear();
  if (i18n.language !== "en") i18n.changeLanguage("en");
});
