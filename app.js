const tagLabels = {
  'michael-jordan': {
    hu: 'Jordan',
    en: 'Jordan'
  },
  'chicago-bulls': {
    hu: 'Bulls',
    en: 'Bulls'
  },
  'hall-of-fame': {
    hu: 'Hírességek Csarnoka',
    en: 'Hall of Fame'
  }
};

const uiText = {
  hu: {
    brand: 'Palánk alatt', tagline: 'Kosárlabda-történetek', menu: 'Menü', articles: 'Cikkek', about: 'Az oldalról',
    eyebrow: 'Archív történetek a kosárlabda világából', heroTitle: 'Legendák.\nEmlékek.\nA pályán túl.',
    heroText: 'Hosszabb olvasmányok a játékosokról és azokról a pillanatokról, amelyek nem mindig férnek bele az eredményjelzőbe.',
    archive: 'Archívum', allArticles: 'Minden cikk', moreSoon: 'Hamarosan további történetekkel bővül.',
    authorLabel: 'Szerző:', backToTop: 'Vissza az oldal tetejére ↑', aboutEyebrow: 'Az oldalról',
    aboutTitle: 'Egy bővíthető cikkarchívum', aboutText: 'A cikkek külön adatfájlokban élnek, ezért az archívum új történetekkel egyszerűen bővíthető. Minden írás magyar és angol nyelven is olvasható.',
    footerText: 'Független kosárlabda-archívum', minute: 'perc olvasás', lightMode: 'Világos téma bekapcsolása', darkMode: 'Sötét téma bekapcsolása',
    searchLabel: 'Keresés a cikkek között',
    searchPlaceholder: 'Keresés…',
    clearFilters: 'Szűrés törlése',
    noResults: 'Nincs megfelelő cikk.',
    sourceLabel: 'Forrás:'
  },
  en: {
    brand: 'Below the Rim', tagline: 'Basketball stories', menu: 'Menu', articles: 'Articles', about: 'About',
    eyebrow: 'Archive stories from the world of basketball', heroTitle: 'Legends.\nMemories.\nBeyond the court.',
    heroText: 'Long reads about the players and the moments that do not always fit on the scoreboard.',
    archive: 'Archive', allArticles: 'All articles', moreSoon: 'More stories are coming soon.', authorLabel: 'By:',
    backToTop: 'Back to top ↑', aboutEyebrow: 'About', aboutTitle: 'An archive built to grow',
    aboutText: 'Articles live in separate data files, making it easy to expand the archive. Every story is available in Hungarian and English.',
    footerText: 'Independent basketball archive', minute: 'min read', lightMode: 'Turn on light theme', darkMode: 'Turn on dark theme',
    searchLabel: 'Search articles',
    searchPlaceholder: 'Search…',
    clearFilters: 'Clear filters',
    noResults: 'No matching articles.',
    sourceLabel: 'Source:'
  }
};

const state = {
  language: localStorage.getItem('language') || 'hu',
  article: window.ARTICLES[0],
  searchQuery: '',
  selectedTag: null
};

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

function formatDate(date, language) {
  return new Intl.DateTimeFormat(language === 'hu' ? 'hu-HU' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  }).format(new Date(`${date}T12:00:00`));
}

function normalizeSearchValue(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase(
      state.language === 'hu' ? 'hu-HU' : 'en-US'
    )
    .trim();
}

function getFilteredArticles() {
  const query = normalizeSearchValue(state.searchQuery);

  return window.ARTICLES.filter(article => {
    const content = article[state.language];
    const tags = article.tags || [];

    const matchesTag =
      !state.selectedTag ||
      tags.includes(state.selectedTag);

    const tagNames = tags.map(tag =>
      tagLabels[tag]?.[state.language] || tag
    );

    const searchableText = normalizeSearchValue([
      content.title,
      content.deck,
      article.author,
      ...tags,
      ...tagNames
    ].join(' '));

    const matchesSearch =
      !query || searchableText.includes(query);

    return matchesTag && matchesSearch;
  });
}

function formatHashtag(label) {
  return `#${label.replace(/\s+/g, '')}`;
}

function getAvailableTags() {
  return [
    ...new Set(
      window.ARTICLES.flatMap(article => article.tags || [])
    )
  ];
}

function renderTagFilters() {
  const container = $('#tag-filters');
  const tags = getAvailableTags();

  container.innerHTML = tags.map(tag => {
    const label =
      tagLabels[tag]?.[state.language] || tag;

    const active = state.selectedTag === tag;

    return `
      <button
        type="button"
        class="article-tag${active ? ' active' : ''}"
        data-filter-tag="${tag}"
        aria-pressed="${active}"
      >
        ${formatHashtag(label)}
      </button>
    `;
  }).join('');

}

function renderUI() {
  document.documentElement.lang = state.language;

  $$('[data-ui]').forEach(node => {
    const value = uiText[state.language][node.dataset.ui];

    if (value) {
      node.textContent = value;
    }
  });

  $$('[data-ui-placeholder]').forEach(node => {
    const value =
      uiText[state.language][node.dataset.uiPlaceholder];

    if (value) {
      node.placeholder = value;
    }
  });

  $$('[data-language]').forEach(button => {
    button.setAttribute(
      'aria-pressed',
      String(button.dataset.language === state.language)
    );
  });
}

function renderNavigation() {
  const nav = $('#article-navigation');
  const filteredArticles = getFilteredArticles();

  nav.innerHTML = '';

  filteredArticles.forEach(article => {
    const link = document.createElement('a');

    link.className =
      `article-link${article.id === state.article.id ? ' active' : ''}`;

    link.href = `#${article.id}`;

    link.innerHTML = `
      <strong>${article[state.language].title}</strong>
      <time datetime="${article.date}">
        ${formatDate(article.date, state.language)}
      </time>
    `;

    link.addEventListener('click', event => {
      event.preventDefault();

      state.article = article;
      renderArticle();

      history.replaceState(
        null,
        '',
        `#${article.id}`
      );

      $('#article').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    });

    nav.append(link);
  });

  $('#no-results').hidden = filteredArticles.length !== 0;
}

function formatHashtag(label) {
  return `#${label.replace(/\s+/g, '')}`;
}

function renderArticle() {
  const article = state.article;
  const content = article[state.language];
  $('#article-date').dateTime = article.date;
  $('#article-date').textContent = formatDate(article.date, state.language);
  $('#article-title').textContent = content.title;
  $('#article-deck').textContent = content.deck;
  $('#article-author').textContent = article.author;

  const sourceRow = $('#article-source-row');
  const sourceElement = $('#article-source');

  sourceElement.replaceChildren();

  if (article.source?.name) {
    sourceRow.hidden = false;

    if (article.source.url) {
      const sourceLink = document.createElement('a');

      sourceLink.href = article.source.url;
      sourceLink.textContent = article.source.name;
      sourceLink.target = '_blank';
      sourceLink.rel = 'noopener noreferrer';

      sourceElement.append(sourceLink);
    } else {
      sourceElement.textContent = article.source.name;
    }
  } else {
    sourceRow.hidden = true;
  }
  $('#article-disclaimer').textContent = content.disclaimer;
  $('#article-disclaimer').hidden = !content.disclaimer;
  $('#article-body').innerHTML = content.body.map(block => {
    if (block.type === 'quote') return `<blockquote>${block.paragraphs.map(p => `<p>${p}</p>`).join('')}</blockquote>`;
    if (block.type === 'image') return `<figure class="article-image ${block.layout || ''}"><img src="${block.src}" alt="${block.alt || ''}" loading="lazy"><figcaption>${block.caption || ''}</figcaption></figure>`;
    return `<p>${block.text}</p>`;
  }).join('');
  const wordCount = content.body.flatMap(block => block.type === 'quote' ? block.paragraphs : [block.text || '']).join(' ').trim().split(/\s+/).length;
  $('#reading-time').textContent = `${Math.max(1, Math.ceil(wordCount / 210))} ${uiText[state.language].minute}`;
  document.title = `${content.title} — ${uiText[state.language].brand}`;
  $('#article-tags').innerHTML = (article.tags || [])
    .map(tag => {
      const label =
        tagLabels[tag]?.[state.language] || tag;

      const active =
        state.selectedTag === tag;

      return `
        <button
          type="button"
          class="article-tag${active ? ' active' : ''}"
          data-filter-tag="${tag}"
          aria-pressed="${active}"
        >
          ${formatHashtag(label)}
        </button>
      `;
    })
    .join('');
  renderNavigation();
}

function setLanguage(language) {
  state.language = language;
  localStorage.setItem('language', language);
  renderUI();
  renderArticle();
}

function updateThemeLabel() {
  const isDark = document.documentElement.dataset.theme === 'dark';
  $('#theme-toggle').setAttribute('aria-label', isDark ? uiText[state.language].lightMode : uiText[state.language].darkMode);
}

function updateFilterControls() {
  const hasActiveFilter =
    Boolean(state.selectedTag) ||
    Boolean(state.searchQuery.trim());

  $('#clear-filters').hidden = !hasActiveFilter;
}

function toggleTagFilter(tag) {
  state.selectedTag =
    state.selectedTag === tag ? null : tag;

  renderTagFilters();
  renderNavigation();
  updateFilterControls();
  updateArticleTagStates();

  if (window.matchMedia('(max-width: 820px)').matches) {
    $('#article-list-title').scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}

function updateArticleTagStates() {
  $$('#article-tags [data-filter-tag]').forEach(button => {
    const active =
      button.dataset.filterTag === state.selectedTag;

    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function setLanguage(language) {
  state.language = language;

  localStorage.setItem('language', language);

  renderUI();
  renderTagFilters();
  renderArticle();
  updateFilterControls();
}

$('#clear-filters').addEventListener('click', () => {
  state.searchQuery = '';
  state.selectedTag = null;

  $('#article-search').value = '';

  renderTagFilters();
  renderNavigation();
  updateFilterControls();
});

$$('[data-language]').forEach(button => button.addEventListener('click', () => {
  setLanguage(button.dataset.language);
  updateThemeLabel();
}));

$('#theme-toggle').addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('theme', theme);
  updateThemeLabel();
});

$('.menu-toggle').addEventListener('click', event => {
  const open = $('#site-nav').classList.toggle('open');
  event.currentTarget.setAttribute('aria-expanded', String(open));
});

$('#back-to-top').addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
$('#year').textContent = new Date().getFullYear();

const hashArticle = window.ARTICLES.find(
  article => `#${article.id}` === location.hash
);

if (hashArticle) {
  state.article = hashArticle;
}

$('#article-search').addEventListener('input', event => {
  state.searchQuery = event.target.value;

  renderNavigation();
  updateFilterControls();
});

document.addEventListener('click', event => {
  const tagButton = event.target.closest(
    '[data-filter-tag]'
  );

  if (!tagButton) {
    return;
  }

  toggleTagFilter(tagButton.dataset.filterTag);
});

// Kezdeti oldalbetöltés
renderUI();
renderTagFilters();
renderArticle();
updateFilterControls();
updateThemeLabel();