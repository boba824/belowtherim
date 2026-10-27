import { readFile, readdir, mkdir, writeFile, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root = fileURLToPath(new URL('../', import.meta.url));
const domain = 'https://www.palankalatt.hu';
const languages = ['hu', 'en'];

const labels = {
  hu: {
    brand: 'Palánk alatt',
    tagline: 'Kosárlabda-történetek',
    skipLabel: 'Ugrás a cikkhez',
    navigationLabel: 'Fő navigáció',
    archiveLabel: 'Archívum',
    allArticlesLabel: 'Minden cikk',
    languageLabel: 'Nyelvválasztó',
    authorLabel: 'Szerző:',
    sourceLabel: 'Forrás:',
    minute: 'perc olvasás',
    backToTopLabel: 'Vissza a cikk tetejére ↑',
    footerText: 'Független kosárlabda-archívum',
    menu: 'Menü',
    articles: 'Cikkek',
    about: 'Az oldalról',
    eyebrow: 'Archív történetek a kosárlabda világából',
    heroTitleFirst: 'Legendák.',
    heroTitleSecond: 'Emlékek.',
    heroTitleThird: 'A pályán túl.',
    heroText: 'Olvasmányok a játékosokról és azokról a pillanatokról, amelyek nem mindig férnek bele az eredményjelzőbe.',
    lightMode: 'Világos téma bekapcsolása',
    darkMode: 'Sötét téma bekapcsolása',
    searchLabel: 'Keresés a cikkek között',
    searchPlaceholder: 'Keresés…',
    filterLabel: 'Szűrés címke alapján',
    clearFilters: 'Szűrés törlése',
    noResults: 'Nincs megfelelő cikk.',
    relatedArticlesLabel: 'Kapcsolódó cikkek',
    shareLabel: 'Cikk megosztása',
    copyLinkLabel: 'Link másolása'
  },
  en: {
    brand: 'Below the Rim',
    tagline: 'Basketball stories',
    skipLabel: 'Skip to article',
    navigationLabel: 'Main navigation',
    archiveLabel: 'Archive',
    allArticlesLabel: 'All articles',
    languageLabel: 'Choose language',
    authorLabel: 'By:',
    sourceLabel: 'Source:',
    minute: 'min read',
    backToTopLabel: 'Back to article ↑',
    footerText: 'Independent basketball archive',
    menu: 'Menu',
    articles: 'Articles',
    about: 'About',
    eyebrow: 'Archive stories from the world of basketball',
    heroTitleFirst: 'Legends.',
    heroTitleSecond: 'Memories.',
    heroTitleThird: 'Beyond the court.',
    heroText: 'Reads about the players and the moments that do not always fit on the scoreboard.',
    lightMode: 'Turn on light theme',
    darkMode: 'Turn on dark theme',
    searchLabel: 'Search articles',
    searchPlaceholder: 'Search…',
    filterLabel: 'Filter by tag',
    clearFilters: 'Clear filters',
    noResults: 'No matching articles.',
    relatedArticlesLabel: 'Related articles',
    shareLabel: 'Share article',
    copyLinkLabel: 'Copy link'
  }
};

const tagLabels = {
  'michael-jordan': { hu: 'Jordan', en: 'Jordan' },
  'chicago-bulls': { hu: 'Bulls', en: 'Bulls' },
  'hall-of-fame': { hu: 'Hírességek Csarnoka', en: 'Hall of Fame' },
  'new-york-knicks': { hu: 'Knicks', en: 'Knicks' },
  'miami-heat': { hu: 'Heat', en: 'Heat' },
  'rivalry': { hu: 'Rivalizálás', en: 'Rivalry' },
  'kobe-bryant': { hu: 'Kobe', en: 'Kobe' },
  'mamba-mentality': { hu: 'Mamba Mentalitás', en: 'Mamba Mentality' },
  'olympics': { hu: 'Olimpia', en: 'Olympics' },
  'sonics': { hu: 'Sonics', en: 'Sonics' }
};

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function articlePath(language, id) {
  return `/articles/${language}/${id}.html`;
}

function formatDate(value, language) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Hibás dátum: ${value}`);
  }

  const date = new Date(`${value}T12:00:00Z`);

  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`Érvénytelen dátum: ${value}`);
  }

  return new Intl.DateTimeFormat(language === 'hu' ? 'hu-HU' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(date);
}

function imagePath(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('Hiányzó képútvonal.');
  }

  const normalized = value.replace(/^\/+/, '');

  if (!normalized.startsWith('assets/') || normalized.split('/').includes('..') || /[\\?#]/.test(normalized)) {
    throw new Error(`Nem támogatott képútvonal: ${value}`);
  }

  return `/${normalized}`;
}

function videoEmbedUrl(value = '') {
  const match = String(value).match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (match) {
    return `https://www.youtube-nocookie.com/embed/${match[1]}`;
  }
  if (/^https:\/\/www\.youtube-nocookie\.com\/embed\/[\w-]{11}$/.test(value)) {
    return value;
  }
  throw new Error(`Nem támogatott vagy érvénytelen videó URL: ${value}`);
}

function renderBlock(block, index) {
  if (block.type === 'quote') {
    if (!Array.isArray(block.paragraphs)) {
      throw new Error('Az idézet paragraphs mezője nem tömb.');
    }

    return `<blockquote>${block.paragraphs.map(text => `<p>${escapeHtml(text)}</p>`).join('')}</blockquote>`;
  }

  if (block.type === 'image') {
    const portrait = block.layout === 'portrait' ? ' portrait' : '';
    const loading = index === 0 ? 'eager' : 'lazy';
    const caption = block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : '';

    return `<figure class="article-image${portrait}"><img src="${escapeHtml(imagePath(block.src))}" alt="${escapeHtml(block.alt || '')}" loading="${loading}" decoding="async">${caption}</figure>`;
  }

  if (block.type === 'heading') {
    const level = [2, 3, 4].includes(block.level) ? block.level : 3;
    return `<h${level}>${escapeHtml(block.text || '')}</h${level}>`;
  }

  if (block.type === 'video') {
    const embedUrl = videoEmbedUrl(block.src);
    const caption = block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : '';
    const title = escapeHtml(block.title || 'Videó');

    return `<figure class="article-video"><iframe src="${escapeHtml(embedUrl)}" title="${title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe>${caption}</figure>`;
  }

  if (block.type === 'table') {
    const caption = block.caption ? `<caption>${escapeHtml(block.caption)}</caption>` : '';
    const headers = Array.isArray(block.headers)
      ? `<thead><tr>${block.headers.map(th => `<th scope="col">${escapeHtml(th)}</th>`).join('')}</tr></thead>`
      : '';
    const rows = Array.isArray(block.rows)
      ? `<tbody>${block.rows.map(row => `<tr>${row.map(td => `<td>${escapeHtml(td)}</td>`).join('')}</tr>`).join('')}</tbody>`
      : '';

    return `<div class="article-table-wrapper"><table class="article-table">${caption}${headers}${rows}</table></div>`;
  }

  if ((!block.type || block.type === 'paragraph') && typeof block.text === 'string') {
    return `<p>${escapeHtml(block.text)}</p>`;
  }

  throw new Error(`Nem támogatott cikkblokk: ${block.type || 'ismeretlen'}`);
}

function readingMinutes(body) {
  const text = body.flatMap(block => {
    if (block.type === 'quote') return block.paragraphs;
    if (block.type === 'heading') return [block.text || ''];
    if (block.type === 'table') {
      return [...(block.headers || []), ...(block.rows?.flat() || [])];
    }
    return [block.text || ''];
  }).join(' ').trim();

  const words = text ? text.split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 210));
}

function renderTemplate(template, values) {
  return template.replace(/\{\{([A-Za-z]+)\}\}/g, (_, key) => {
    if (!Object.hasOwn(values, key)) {
      throw new Error(`Hiányzó sablonérték: ${key}`);
    }

    return values[key];
  });
}

function translateTemplate(template, ui) {
  return template.replace(/(<([a-z][a-z0-9]*)\b[^>]*\bdata-ui="([A-Za-z]+)"[^>]*>)[\s\S]*?<\/\2>/gi, (match, opening, tag, key) => {
    if (!Object.hasOwn(ui, key)) {
      throw new Error(`Hiányzó felirat: ${key}`);
    }
    return `${opening}${escapeHtml(ui[key])}</${tag}>`;
  });
}

async function loadArticles() {
  const directory = path.join(root, 'articles');
  const entries = await readdir(directory, { withFileTypes: true });
  const files = entries.filter(entry => entry.isFile() && entry.name.endsWith('.js')).map(entry => entry.name).sort();
  const articles = [];
  const ids = new Set();

  for (const filename of files) {
    const sourceFile = path.join(directory, filename);
    const source = await readFile(sourceFile, 'utf8');
    const context = vm.createContext({ window: { ARTICLES: [] } });

    vm.runInContext(source, context, { filename: sourceFile, timeout: 1000 });

    const loaded = context.window.ARTICLES;

    if (!Array.isArray(loaded) || loaded.length !== 1) {
      throw new Error(`${filename}: pontosan egy cikket kell tartalmaznia.`);
    }

    const article = loaded[0];

    if (typeof article.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.id)) {
      throw new Error(`${filename}: hiányzó vagy hibás cikkazonosító.`);
    }

    if (ids.has(article.id)) {
      throw new Error(`Ismétlődő cikkazonosító: ${article.id}`);
    }

    const availableLanguages = languages.filter(language => article[language] != null);

    if (!availableLanguages.length) {
      throw new Error(`${filename}: nincs nyelvi tartalom.`);
    }

    for (const language of availableLanguages) {
      const content = article[language];

      if (typeof content.title !== 'string' || !content.title.trim() || !Array.isArray(content.body) || !content.body.length) {
        throw new Error(`${filename}: hiányos ${language} nyelvű cikktartalom.`);
      }
    }

    if (article.date) formatDate(article.date, 'hu');
    if (article.dateAdded) formatDate(article.dateAdded, 'hu');

    ids.add(article.id);
    articles.push({ ...article, sourceFilename: filename });
  }

  if (!articles.length) {
    throw new Error('Nem található cikkadatfájl az articles mappában.');
  }

  return articles.sort((a, b) =>
    String(b.dateAdded || '').localeCompare(String(a.dateAdded || '')) ||
    a.id.localeCompare(b.id)
  );
}

function renderArticleNavigation(articles, language, currentId) {
  return articles.filter(article => article[language] != null).map(article => {
    const content = article[language];
    const tags = article.tags || [];
    const active = article.id === currentId;
    const searchText = [
      content.title,
      content.deck || '',
      article.author || '',
      ...tags,
      ...tags.map(tag => tagLabels[tag]?.[language] || tag)
    ].join(' ');

    const date = article.dateAdded
      ? `<time datetime="${escapeHtml(article.dateAdded)}">${escapeHtml(formatDate(article.dateAdded, language))}</time>`
      : '';

    return `<a class="article-link${active ? ' active' : ''}" href="${articlePath(language, article.id)}#article" data-search="${escapeHtml(searchText)}" data-tags="${escapeHtml(JSON.stringify(tags))}"${active ? ' aria-current="page"' : ''}><strong>${escapeHtml(content.title)}</strong>${date}</a>`;
  }).join('\n');
}

function renderTagFilters(articles, language) {
  const tags = [...new Set(
    articles.filter(article => article[language] != null).flatMap(article => article.tags || [])
  )];

  return tags.map(tag => {
    const label = tagLabels[tag]?.[language] || tag;
    return `<button type="button" class="article-tag" data-filter-tag="${escapeHtml(tag)}" aria-pressed="false">${escapeHtml(`#${label.replace(/\s+/g, '')}`)}</button>`;
  }).join('\n');
}

function replaceGeneratedSection(html, name, content) {
  const startMarker = `<!-- GENERATED:${name}:START -->`;
  const endMarker = `<!-- GENERATED:${name}:END -->`;
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker);

  if (
    start === -1 ||
    end === -1 ||
    end <= start ||
    html.indexOf(startMarker, start + startMarker.length) !== -1 ||
    html.indexOf(endMarker, end + endMarker.length) !== -1
  ) {
    throw new Error(`Hiányzó, ismétlődő vagy hibás jelölők az index.html fájlban: ${name}`);
  }

  return html.slice(0, start + startMarker.length)
    + `\n${content}\n  `
    + html.slice(end);
}

function renderSitemap(articles) {
  const urls = [
    `${domain}/`,
    ...articles.flatMap(article =>
      languages
        .filter(language => article[language] != null)
        .map(language => `${domain}${articlePath(language, article.id)}`)
    )
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url><loc>${escapeHtml(url)}</loc></url>`).join('\n')}
</urlset>
`;
}

function renderSeoExtras(article, language) {
  const content = article[language];
  const ui = labels[language];
  const url = `${domain}${articlePath(language, article.id)}`;
  const description = content.seoDescription || content.deck || content.title;
  const image = content.body.find(block => block.type === 'image' && block.src);
  const imageUrl = image ? `${domain}${imagePath(image.src)}` : null;
  const locale = language === 'hu' ? 'hu_HU' : 'en_US';

  const socialMeta = [
    '<meta property="og:type" content="article">',
    `<meta property="og:site_name" content="${escapeHtml(ui.brand)}">`,
    `<meta property="og:title" content="${escapeHtml(content.title)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:url" content="${escapeHtml(url)}">`,
    `<meta property="og:locale" content="${locale}">`,
    ...languages
      .filter(lang => lang !== language && article[lang] != null)
      .map(lang => `<meta property="og:locale:alternate" content="${lang === 'hu' ? 'hu_HU' : 'en_US'}">`),
    `<meta name="twitter:card" content="${imageUrl ? 'summary_large_image' : 'summary'}">`,
    `<meta name="twitter:title" content="${escapeHtml(content.title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(description)}">`
  ];

  if (imageUrl) {
    socialMeta.push(
      `<meta property="og:image" content="${escapeHtml(imageUrl)}">`,
      `<meta name="twitter:image" content="${escapeHtml(imageUrl)}">`
    );

    if (image.alt) {
      socialMeta.push(
        `<meta property="og:image:alt" content="${escapeHtml(image.alt)}">`,
        `<meta name="twitter:image:alt" content="${escapeHtml(image.alt)}">`
      );
    }
  }

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: content.title,
    description,
    inLanguage: language,
    url,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url
    },
    publisher: {
      '@type': 'Organization',
      name: ui.brand,
      url: `${domain}/`
    }
  };

  if (article.author) {
    data.author = {
      '@type': 'Person',
      name: article.author
    };
  }

  if (imageUrl) {
    data.image = [imageUrl];
  }

  if (article.tags?.length) {
    data.keywords = article.tags
      .map(tag => tagLabels[tag]?.[language] || tag)
      .join(', ');
  }

  const json = JSON.stringify(data, null, 2)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');

  return {
    socialMeta: socialMeta.join('\n  '),
    structuredData: `<script type="application/ld+json">\n${json}\n</script>`
  };
}

function renderArticleScripts(articles) {
  return articles.map(article => {
    const filename = encodeURIComponent(article.sourceFilename);
    return `<script src="/articles/${filename}"></script>`;
  }).join('\n');
}

async function cleanObsoleteArticlePages(outputs) {
  const expectedFiles = new Set(outputs.map(output => path.resolve(output.filename)));

  for (const language of languages) {
    const directory = path.join(root, 'articles', language);

    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.html')) continue;

      const filename = path.join(directory, entry.name);
      if (expectedFiles.has(path.resolve(filename))) continue;

      const html = await readFile(filename, 'utf8');

      if (!html.startsWith('<!doctype html>\n<!-- GENERATED:ARTICLE-PAGE -->')) {
        console.warn(`Nem törölt, jelöletlen HTML: ${path.relative(root, filename)}`);
        continue;
      }

      await unlink(filename);
      console.log(`Törölt elavult cikkoldal: ${path.relative(root, filename)}`);
    }
  }
}

function renderRelatedArticles(articles, currentArticle, language) {
  const currentTags = new Set(currentArticle.tags || []);

  const related = articles
    .filter(article => article.id !== currentArticle.id && article[language] != null)
    .map(article => ({
      article,
      score: [...new Set(article.tags || [])].filter(tag => currentTags.has(tag)).length
    }))
    .filter(item => item.score > 0)
    .sort((a, b) =>
      b.score - a.score ||
      String(b.article.dateAdded || '').localeCompare(String(a.article.dateAdded || '')) ||
      a.article.id.localeCompare(b.article.id)
    )
    .slice(0, 3);

  if (!related.length) return '';

  const links = related.map(({ article }) => {
    const content = article[language];
    const deck = content.deck
      ? `<p>${escapeHtml(content.deck)}</p>`
      : '';

    return `<a class="related-article-link" href="${articlePath(language, article.id)}#article"><h3>${escapeHtml(content.title)}</h3>${deck}</a>`;
  }).join('\n');

  return `<section class="related-articles" aria-labelledby="related-articles-title"><h2 id="related-articles-title">${escapeHtml(labels[language].relatedArticlesLabel)}</h2><div class="related-articles-grid">${links}</div></section>`;
}

async function main() {
  const templateFile = path.join(root, 'templates', 'article.html');
  const [articles, template] = await Promise.all([
    loadArticles(),
    readFile(templateFile, 'utf8')
  ]);

  const outputs = [];

  for (const article of articles) {
    const availableLanguages = languages.filter(language => article[language] != null);

    for (const language of availableLanguages) {
      const content = article[language];
      const ui = labels[language];
      const currentPath = articlePath(language, article.id);
      const description = content.seoDescription || content.deck || content.title;

      const dateHtml = article.date
        ? `<time id="article-date" datetime="${escapeHtml(article.date)}">${escapeHtml(formatDate(article.date, language))}</time><span aria-hidden="true"> • </span>`
        : '';

      const alternateLinks = availableLanguages.map(lang =>
        `<link rel="alternate" hreflang="${lang}" href="${domain}${articlePath(lang, article.id)}">`
      ).join('\n  ');

      const languageLinks = availableLanguages.map(lang =>
        `<a href="${articlePath(lang, article.id)}" lang="${lang}" hreflang="${lang}"${lang === language ? ' aria-current="page"' : ''}>${lang.toUpperCase()}</a>`
      ).join('\n        ');

      const articleTags = (article.tags || []).map(tag => {
        const label = tagLabels[tag]?.[language] || tag;
        return `<span class="article-tag">${escapeHtml(`#${label.replace(/\s+/g, '')}`)}</span>`;
      }).join('');

      const values = {
        ...renderSeoExtras(article, language),
        language,
        description: escapeHtml(description),
        pageTitle: escapeHtml(`${content.title} — ${ui.brand}`),
        canonical: escapeHtml(`${domain}${currentPath}`),
        alternateLinks,
        languageLinks,
        brand: escapeHtml(ui.brand),
        tagline: escapeHtml(ui.tagline),
        skipLabel: escapeHtml(ui.skipLabel),
        navigationLabel: escapeHtml(ui.navigationLabel),
        archiveLabel: escapeHtml(ui.archiveLabel),
        allArticlesLabel: escapeHtml(ui.allArticlesLabel),
        languageLabel: escapeHtml(ui.languageLabel),
        articleNavigation: renderArticleNavigation(articles, language, article.id),
        relatedArticles: renderRelatedArticles(articles, article, language),
        searchPlaceholder: escapeHtml(ui.searchPlaceholder),
        filterLabel: escapeHtml(ui.filterLabel),
        tagFilters: renderTagFilters(articles, language),
        articleMeta: `${dateHtml}<span id="reading-time">${readingMinutes(content.body)} ${escapeHtml(ui.minute)}</span>`,
        articleTags,
        articleTitle: escapeHtml(content.title),
        deck: escapeHtml(content.deck || ''),
        disclaimer: content.disclaimer ? `<div id="article-disclaimer" class="disclaimer">${escapeHtml(content.disclaimer)}</div>` : '',
        body: content.body.map(renderBlock).join('\n'),
        authorRow: article.author ? `<p><span>${escapeHtml(ui.authorLabel)}</span> <strong id="article-author">${escapeHtml(article.author)}</strong></p>` : '',
        sourceRow: article.source ? `<p id="article-source-row"><span>${escapeHtml(ui.sourceLabel)}</span> <strong id="article-source">${escapeHtml(article.source)}</strong></p>` : '',
        backToTopLabel: escapeHtml(ui.backToTopLabel),
        year: String(new Date().getUTCFullYear()),
        footerText: escapeHtml(ui.footerText),
        shareLabel: escapeHtml(ui.shareLabel),
        copyLinkLabel: escapeHtml(ui.copyLinkLabel)
      };

      outputs.push({
        directory: path.join(root, 'articles', language),
        filename: path.join(root, 'articles', language, `${article.id}.html`),
        html: renderTemplate(translateTemplate(template, ui), values)
      });
    }
  }

  const indexFile = path.join(root, 'index.html');
  const indexSource = await readFile(indexFile, 'utf8');
  const homepageNavigation = renderArticleNavigation(articles, 'hu', null);
  const indexWithNavigation = replaceGeneratedSection(indexSource, 'ARTICLE-NAV', homepageNavigation);
  const articleScripts = renderArticleScripts(articles);
  const updatedIndex = replaceGeneratedSection(indexWithNavigation, 'ARTICLE-SCRIPTS', articleScripts);
  const sitemap = renderSitemap(articles);

  // Minden oldal tartalmát előállítjuk a fájlok írása előtt.
  for (const output of outputs) {
    await mkdir(output.directory, { recursive: true });
    await writeFile(output.filename, output.html, 'utf8');
    console.log(`Elkészült: ${path.relative(root, output.filename)}`);
  }

  if (updatedIndex !== indexSource) {
    await writeFile(indexFile, updatedIndex, 'utf8');
    console.log('Frissült: index.html cikkmenü');
  }

  await writeFile(path.join(root, 'sitemap.xml'), sitemap, 'utf8');
  console.log('Elkészült: sitemap.xml');
  await cleanObsoleteArticlePages(outputs);
  console.log(`${articles.length} cikkből ${outputs.length} HTML-oldal készült.`);
}

main().catch(error => {
  console.error(`Generálási hiba: ${error.message}`);
  process.exitCode = 1;
});
