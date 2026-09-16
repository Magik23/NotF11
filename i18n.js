(() => {
  function t(key, substitutions = undefined, fallback = "") {
    const value = chrome.i18n.getMessage(key, substitutions);
    return value || fallback || key;
  }

  function applyI18n(root = document) {
    const language = chrome.i18n.getUILanguage();
    if (language) {
      document.documentElement.lang = language;
    }

    for (const element of root.querySelectorAll("[data-i18n]")) {
      const key = element.dataset.i18n;
      const value = t(key, undefined, element.textContent.trim());
      element.textContent = value;
    }

    for (const element of root.querySelectorAll("[data-i18n-aria-label]")) {
      const key = element.dataset.i18nAriaLabel;
      const value = t(key, undefined, element.getAttribute("aria-label") || "");
      element.setAttribute("aria-label", value);
    }

    for (const element of root.querySelectorAll("[data-i18n-title]")) {
      const key = element.dataset.i18nTitle;
      const value = t(key, undefined, element.getAttribute("title") || "");
      element.setAttribute("title", value);
    }
  }

  window.NotF11I18n = { t, applyI18n };
  applyI18n();
})();
