(() => {
  function redirectLegacyArticle() {
    if (!['/', '/index.html'].includes(location.pathname)) return;
    if (!location.hash) return;

    let articleId;
    try {
      articleId = decodeURIComponent(location.hash.slice(1));
    } catch {
      return;
    }

    if (['about', 'article'].includes(articleId)) return;

    const article = (window.ARTICLES || []).find(item => item.id === articleId);
    if (!article) return;

    let preferredLanguage = /^hu(?:-|$)/i.test(navigator.language || '') ? 'hu' : 'en';
    try {
    const savedLanguage = localStorage.getItem('language');
    if (['hu', 'en'].includes(savedLanguage)) preferredLanguage = savedLanguage;
    } catch {}

    const language = [preferredLanguage, 'hu', 'en'].find(lang => article[lang] != null);
    if (!language) return;

    const target = new URL(`/articles/${language}/${article.id}.html`, location.origin);
    target.search = location.search;
    location.replace(target.href);
  }

  redirectLegacyArticle();
  window.addEventListener('hashchange', redirectLegacyArticle);
})();