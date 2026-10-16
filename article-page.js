(() => {
  const language = document.documentElement.lang === 'en' ? 'en' : 'hu';
  const labels = {
    hu: { lightMode: 'Világos téma bekapcsolása', darkMode: 'Sötét téma bekapcsolása' },
    en: { lightMode: 'Turn on light theme', darkMode: 'Turn on dark theme' }
  };

  const themeButton = document.querySelector('#theme-toggle');
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#site-nav');

  function updateThemeLabel() {
    if (!themeButton) return;
    const dark = document.documentElement.dataset.theme === 'dark';
    const label = dark ? labels[language].lightMode : labels[language].darkMode;
    themeButton.setAttribute('aria-label', label);
    themeButton.title = label;
  }

  themeButton?.addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('theme', theme); } catch {}
    updateThemeLabel();
  });

  function closeMenu() {
    if (!menuButton || !navigation) return;
    menuButton.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('open');
  }

  menuButton?.addEventListener('click', () => {
    if (!navigation) return;
    const expanded = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(expanded));
    navigation.classList.toggle('open', expanded);
  });

  navigation?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menuButton.focus();
    }
  });

  document.querySelectorAll('.language-switch a').forEach(link => {
    link.addEventListener('click', () => {
      try { localStorage.setItem('language', link.lang); } catch {}
    });
  });

    const filterPanel = document.querySelector('#archive-filters');
  const searchInput = document.querySelector('#article-search');
  const clearButton = document.querySelector('#clear-filters');
  const noResults = document.querySelector('#no-results');
  const filterButtons = [...document.querySelectorAll('#tag-filters [data-filter-tag]')];
  const articleLinks = [...document.querySelectorAll('#article-navigation .article-link')].map(link => ({
    link,
    search: normalizeSearch(link.dataset.search || ''),
    tags: JSON.parse(link.dataset.tags || '[]')
  }));

  let selectedTag = null;

  function normalizeSearch(value) {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase(language).trim();
  }

  function applyFilters() {
    const query = normalizeSearch(searchInput.value);
    let visibleCount = 0;

    articleLinks.forEach(item => {
      const visible = (!query || item.search.includes(query)) &&
        (!selectedTag || item.tags.includes(selectedTag));
      item.link.hidden = !visible;
      if (visible) visibleCount++;
    });

    filterButtons.forEach(button => {
      const active = button.dataset.filterTag === selectedTag;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    clearButton.hidden = !query && !selectedTag;
    noResults.hidden = visibleCount !== 0;
  }

  if (filterPanel && searchInput && clearButton && noResults) {
    searchInput.addEventListener('input', applyFilters);

    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        selectedTag = selectedTag === button.dataset.filterTag ? null : button.dataset.filterTag;
        applyFilters();
      });
    });

    clearButton.addEventListener('click', () => {
      searchInput.value = '';
      selectedTag = null;
      applyFilters();
      searchInput.focus();
    });

    filterPanel.hidden = false;
    applyFilters();
  }
  
  updateThemeLabel();
})();
