const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const outputPanel = document.getElementById('output-panel');
const themeToggle = document.getElementById('theme-toggle');
const suggestionsPanel = document.getElementById('suggestions-panel');
const recentList = document.getElementById('recent-list');
const favoritesList = document.getElementById('favorites-list');

const API_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en';
const AUTOCOMPLETE_API = 'https://api.datamuse.com/sug';
const ALT_EXAMPLE_API = 'https://api.urbandictionary.com/v0/define?term=';
const SENTENCE_DICT_BASE = 'https://sentencedict.com/';
const THESAURUS_BASE = 'https://www.thesaurus.com/browse/';
const LONGMAN_BASE = 'https://www.ldoceonline.com/dictionary/';
const COLLINS_BASE = 'https://www.collinsdictionary.com/dictionary/english/';
const MYMEMORY_API = 'https://api.mymemory.translated.net/get';
const translationCache = new Map();

const TRANSLATION_LANGS = [
  { code: 'en', name: 'English (Original)' },
  { code: 'ta', name: 'Tamil' },
  { code: 'hi', name: 'Hindi' },
  { code: 'te', name: 'Telugu' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'kn', name: 'Kannada' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'es', name: 'Spanish' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh-CN', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
];

// UI Strings translation map
const UI_STRINGS = {
  'tagline': 'Discover meanings, pronunciation, etymology, and examples for any word',
  'theme-dark': '🌙 Dark',
  'theme-light': '☀️ Light',
  'translate-btn': '🌐 Translate ▼',
  'filter-langs': 'Filter languages...',
  'search-label': 'Search for any word',
  'search-placeholder': 'Search for any word...',
  'search-btn': 'Search',
  'recent-title': 'Recent Searches',
  'no-recent': 'No recent searches',
  'favorites-title': 'Bookmarked Words',
  'no-favorites': 'No bookmarked words',
  'footer-text': '© 2025 WordFission. Enhance your vocabulary every day.',
  'loading': 'Loading definition...',
  'not-found': 'Unable to find',
  'try-another': 'Try another word.',
  'no-definitions': 'No definitions available for',
  'etymology-heading': 'Etymology & Word Origin',
  'origin-langs-label': 'ORIGIN LANGUAGE(S)',
  'roots-label': 'ROOT WORD(S) & MEANINGS',
  'roots-not-available': 'Roots and meanings not detailed in database',
  'evolution-label': 'WORD EVOLUTION PATH',
  'meaning-changed-label': 'HOW MEANING CHANGED OVER TIME',
  'present-meaning-label': 'PRESENT-DAY MEANING',
  'core-idea-label': 'CORE IDEA',
  'core-idea-default': 'Core idea: reference definition for meanings and usage.',
  'more-details': 'More details at',
  'etymonline': 'Etymonline',
  'synonyms': 'Synonyms:',
  'antonyms': 'Antonyms:',
  'example-sentences': 'Example sentences from another source',
  'no-example': 'No sentence example available for this word.',
  'more-sentences': 'More sentence examples on',
  'sentence-dict': 'SentenceDict',
  'thesaurus': 'Thesaurus.com',
  'longman': 'Longman Dictionary',
  'collins': 'Collins Dictionary',
  'more-words': 'More words',
  'bookmark-label': 'Bookmark word',
  'play-pronunciation': 'Play pronunciation',
  'remove-bookmark-label': 'Remove bookmark',
};
let suggestionIndex = -1;
let suggestionRequestId = 0;
let currentEntry = null;

function debounce(fn, delay = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

async function fetchSuggestions(query) {
  if (!query) return [];
  try {
    const response = await fetch(`${AUTOCOMPLETE_API}?s=${encodeURIComponent(query)}&max=10`);
    if (!response.ok) {
      throw new Error('Autocomplete fetch failed');
    }
    const suggestions = await response.json();
    return suggestions.map((item) => item.word);
  } catch (error) {
    console.error(error);
    return [];
  }
}

function setActiveSuggestion(index) {
  const items = Array.from(suggestionsPanel.querySelectorAll('.suggestion-item'));
  items.forEach((item, itemIndex) => {
    item.classList.toggle('active', itemIndex === index);
  });
  const activeItem = items[index];
  if (activeItem) {
    activeItem.scrollIntoView({ block: 'nearest' });
    searchInput.value = activeItem.textContent;
  }
  suggestionIndex = index;
}

function clearSuggestions() {
  suggestionsPanel.innerHTML = '';
  suggestionIndex = -1;
}

// Storage and State Management
function getRecentSearches() {
  try {
    const list = localStorage.getItem('wordfission-recents');
    return list ? JSON.parse(list) : [];
  } catch (e) {
    return [];
  }
}

function saveRecentSearch(word) {
  if (!word) return;
  const wordLower = word.toLowerCase().trim();
  let recents = getRecentSearches();
  recents = recents.filter(w => w.toLowerCase() !== wordLower);
  recents.unshift(word);
  if (recents.length > 5) recents.pop();
  localStorage.setItem('wordfission-recents', JSON.stringify(recents));
  renderRecentSearches();
}

function renderRecentSearches() {
  const recents = getRecentSearches();
  if (recents.length === 0) {
    recentList.innerHTML = '<p class="sidebar-empty" data-translate="no-recent">No recent searches</p>';
    const btn = document.getElementById('translate-btn');
    if (btn && btn.dataset.activeLang && btn.dataset.activeLangCode) {
      translateUIElements(btn.dataset.activeLangCode, btn.dataset.activeLang, recentList);
    }
    return;
  }
  recentList.innerHTML = recents
    .map(word => `<button type="button" class="recent-item" data-word="${word}">${word}</button>`)
    .join('');
}

function getBookmarks() {
  try {
    const list = localStorage.getItem('wordfission-bookmarks');
    return list ? JSON.parse(list) : [];
  } catch (e) {
    return [];
  }
}

function toggleBookmark(word) {
  if (!word) return;
  const wordLower = word.toLowerCase().trim();
  let bookmarks = getBookmarks();
  const exists = bookmarks.some(w => w.toLowerCase() === wordLower);
  if (exists) {
    bookmarks = bookmarks.filter(w => w.toLowerCase() !== wordLower);
  } else {
    bookmarks.push(word);
  }
  localStorage.setItem('wordfission-bookmarks', JSON.stringify(bookmarks));
  renderBookmarks();
  const btn = document.querySelector('.bookmark-button');
  if (btn && btn.dataset.word.toLowerCase() === wordLower) {
    btn.classList.toggle('active', !exists);
  }
}

function renderBookmarks() {
  const bookmarks = getBookmarks();
  if (bookmarks.length === 0) {
    favoritesList.innerHTML = '<p class="sidebar-empty" data-translate="no-favorites">No bookmarked words</p>';
    const btn = document.getElementById('translate-btn');
    if (btn && btn.dataset.activeLang && btn.dataset.activeLangCode) {
      translateUIElements(btn.dataset.activeLangCode, btn.dataset.activeLang, favoritesList);
    }
    return;
  }
  favoritesList.innerHTML = bookmarks
    .map(word => `
      <div class="favorite-item" data-word="${word}">
        <span>${word}</span>
        <button type="button" class="remove-bookmark" data-word="${word}" aria-label="Remove bookmark">&times;</button>
      </div>
    `)
    .join('');
}





async function initApp() {
  initTheme();
  renderRecentSearches();
  renderBookmarks();
  outputPanel.innerHTML = '';
}

function setTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.classList.toggle('dark-theme', isDark);
  themeToggle.textContent = isDark ? '☀️ Light' : '🌙 Dark';
  themeToggle.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`);
  localStorage.setItem('wordfission-theme', theme);
}

async function fetchAlternateExamples(word) {
  try {
    const response = await fetch(`${ALT_EXAMPLE_API}${encodeURIComponent(word)}`);
    if (!response.ok) {
      throw new Error('Alternate example fetch failed');
    }
    const payload = await response.json();
    const examples = (payload.list || [])
      .map((item) => item.example)
      .filter(Boolean)
      .map((text) => text.replace(/\r\n|\r/g, '\n').trim())
      .filter(Boolean);
    return [...new Set(examples)].slice(0, 3);
  } catch (error) {
    console.warn(error);
    return [];
  }
}

function sanitizeEtymologyHtml(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  doc.querySelectorAll('script, style, .mw-editsection, sup, table, img, span.mw-editsection').forEach((el) => el.remove());

  const allowedTags = {
    P: [],
    UL: [],
    OL: [],
    LI: [],
    B: [],
    STRONG: [],
    I: [],
    EM: [],
    BR: [],
    A: [],
    SPAN: [],
  };

  function clean(node) {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const tag = node.tagName;
    if (!allowedTags[tag]) {
      const parent = node.parentNode;
      while (node.firstChild) parent.insertBefore(node.firstChild, node);
      parent.removeChild(node);
      return;
    }

    [...node.attributes].forEach((attr) => node.removeAttribute(attr.name));
    Array.from(node.childNodes).forEach(clean);
  }

  Array.from(doc.body.childNodes).forEach(clean);
  return doc.body.innerHTML.trim();
}

async function fetchEtymology(word) {
  try {
    const url = `https://en.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(word)}&prop=text&format=json&origin=*`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Etymology fetch failed');
    }
    const data = await response.json();
    const html = data?.parse?.text?.['*'];
    if (!html) return '';

    const match = html.match(/<h[2-4][^>]*>\s*Etymology\s*\d*\s*<\/h[2-4]>([\s\S]*?)(?=<h[2-4][^>]*>)/i);
    const section = match ? match[1] : '';
    if (!section) return '';

    const cleaned = sanitizeEtymologyHtml(section);
    if (!cleaned) return '';

    return cleaned;
  } catch (error) {
    console.warn(error);
    return '';
  }
}







const KNOWN_LANGUAGES = [
  'Proto-Indo-European', 'Proto-Germanic', 'Proto-West Germanic', 'Middle English', 'Old English', 'Modern English',
  'Middle French', 'Old French', 'Vulgar Latin', 'Ancient Greek', 'Anglo-Norman', 'Proto-Italic', 'Proto-Celtic',
  'Old High German', 'Middle High German', 'Middle Dutch', 'Proto-West-Germanic', 'Old Saxon', 'Old Norse', 'Sanskrit',
  'Germanic', 'English', 'French', 'Latin', 'Greek', 'Norse', 'Irish', 'Welsh', 'Gothic', 'Dutch', 'Spanish', 'Italian'
];

function parseEtymology(html, word) {
  if (!html) return [];
  let cleaned = html.replace(/<em>/g, '<i>').replace(/<\/em>/g, '</i>');
  cleaned = cleaned.replace(/<a[^>]*>/g, '').replace(/<\/a>/g, '');
  cleaned = cleaned.replace(/<(?!\/?i\b)[^>]+>/g, '');
  const nodes = [];
  const regex = /(?:([A-Za-z\s-]+)\s+)?<i>([^<]+)<\/i>(?:\s*[,;()]*\s*(?:"([^"]+)"|'([^']+)'|\u201c([^\u201d]+)\u201d))?/g;
  const sortedLangs = [...KNOWN_LANGUAGES].sort((a, b) => b.length - a.length);
  let match, lastLanguage = '';
  while ((match = regex.exec(cleaned)) !== null) {
    let rawLang = match[1] ? match[1].trim() : '';
    let nodeWord = match[2] ? match[2].trim() : '';
    let meaning = match[3] || match[4] || match[5] || '';
    let language = '';
    if (rawLang) {
      const foundLang = sortedLangs.find(lang => rawLang.toLowerCase().includes(lang.toLowerCase()));
      if (foundLang) language = foundLang;
    }
    if (language) lastLanguage = language;
    else language = lastLanguage || 'Origin';
    const startIdx = Math.max(0, match.index - 60);
    const searchArea = cleaned.substring(startIdx, match.index);
    const dateMatch = searchArea.match(/\b(\d{4}s?|\dth\s*(?:century|c\b|c\.\b))/i);
    const date = dateMatch ? dateMatch[0] : '';
    nodeWord = nodeWord.replace(/^\*/, '').trim();
    if (nodeWord && nodeWord.length > 1 && !/^[.,\/#!$%\^&\*;:{}=\-_`~()]+$/.test(nodeWord)) {
      if (nodeWord.toLowerCase() !== word.toLowerCase()) {
        nodes.push({ word: nodeWord, language, meaning, date });
      }
    }
  }
  if (nodes.length === 0) return [];
  const uniqueNodes = [];
  for (const node of nodes) {
    if (!uniqueNodes.length || uniqueNodes[uniqueNodes.length - 1].word.toLowerCase() !== node.word.toLowerCase()) {
      uniqueNodes.push(node);
    }
  }
  return uniqueNodes.reverse();
}


function buildEtymologyCardHtml(word, etymologyText, entry, etymologyUrl) {
  const nodes = parseEtymology(etymologyText, word);

  // Origin languages
  let originLanguages = 'Historical Germanic / Italic / Indo-European';
  let rootsListHtml = '<li><span class="etym-no-data">Roots and meanings not detailed in database</span></li>';
  let evolutionPathText = 'Historical development → Modern English';
  let meaningEvolutionText = 'Evolved through historical word forms and adopted into English usage.';

  if (nodes.length > 0) {
    const langs = [...new Set(nodes.map(n => n.language))].filter(l => l !== 'Modern English');
    originLanguages = langs.length ? langs.join(', ') : 'Unknown';

    rootsListHtml = nodes
      .filter(n => n.language !== 'Modern English')
      .map(n => '<li><span class="etym-lang-badge">[' + n.language.toUpperCase() + ']</span> <em>' + n.word + '</em>' + (n.meaning ? ' – “<strong>' + n.meaning + '</strong>”' : '') + '</li>')
      .join('');

    const pathParts = nodes.map(n => n.language + ' (<em>' + n.word + '</em>)');
    if (nodes[nodes.length - 1].word.toLowerCase() !== word.toLowerCase()) {
      pathParts.push('Modern English (<em>' + word + '</em>)');
    }
    evolutionPathText = pathParts.join(' → ');

    if (nodes.length >= 2) {
      const first = nodes[0], last = nodes[nodes.length - 2];
      meaningEvolutionText = 'Originating from the ' + first.language + ' term <em>' + first.word + '</em>' +
        (first.meaning ? ' (“<strong>' + first.meaning + '</strong>”)' : '') +
        ', the word transitioned through various historical forms including ' + last.language + ' <em>' + last.word + '</em>' +
        (last.meaning ? ' (“<strong>' + last.meaning + '</strong>”)' : '') +
        ' before taking its modern form in English.';
    } else {
      const n = nodes[0];
      meaningEvolutionText = 'Derived from the ' + n.language + ' term <em>' + n.word + '</em>' +
        (n.meaning ? ' (“<strong>' + n.meaning + '</strong>”)' : '') + ' and adopted into the English vocabulary.';
    }
  } else if (etymologyText) {
    const foundLangs = KNOWN_LANGUAGES.filter(lang => etymologyText.toLowerCase().includes(lang.toLowerCase()));
    if (foundLangs.length) originLanguages = foundLangs.slice(0, 4).join(', ');
    const rawRoots = etymologyText.match(/<i>([^<]+)<\/i>/g);
    if (rawRoots) {
      const uniqueRoots = [...new Set(rawRoots.map(r => r.replace(/<[^>]+>/g, '').trim()))];
      rootsListHtml = uniqueRoots.slice(0, 6).map(r => '<li><em>' + r + '</em></li>').join('');
      evolutionPathText = uniqueRoots.map(r => '<em>' + r + '</em>').join(' → ') + ' → Modern English (<em>' + word + '</em>)';
    }
  }

  const presentDayMeaning = entry.meanings?.[0]?.definitions?.[0]?.definition || 'No definition available.';
  const coreIdea = entry.meanings?.[0]?.definitions?.[0]?.definition
    ? shortenText(entry.meanings[0].definitions[0].definition, 120).replace(/\.$/, '') + '.'
    : 'Core idea: reference definition for meanings and usage.';

  const stripTags = (html) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

  const meaningEvolutionPlain = stripTags(meaningEvolutionText);
  const presentDayAttr = escAttr(presentDayMeaning.slice(0, 220));
  const coreIdeaAttr = escAttr(coreIdea.slice(0, 220));
  const meaningEvoAttr = escAttr(meaningEvolutionPlain.slice(0, 220));

  const clockSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>';

  return `
    <div class="etymology-card">
      <div class="etym-heading">${clockSvg}<span data-translate="etymology-heading">Etymology & Word Origin</span></div>
      <div class="etym-top-grid">
        <div class="etym-box">
          <div class="etym-box-label" data-translate="origin-langs-label">ORIGIN LANGUAGE(S)</div>
          <p class="etym-origin-langs">${originLanguages}</p>
        </div>
        <div class="etym-box">
          <div class="etym-box-label" data-translate="roots-label">ROOT WORD(S) & MEANINGS</div>
          <ul class="etym-roots-list">${rootsListHtml}</ul>
        </div>
      </div>
      <div class="etym-section">
        <div class="etym-section-label" data-translate="evolution-label">WORD EVOLUTION PATH</div>
        <p class="etym-evolution-path">${evolutionPathText}</p>
      </div>
      <div class="etym-section">
        <div class="etym-section-label" data-translate="meaning-changed-label">HOW MEANING CHANGED OVER TIME</div>
        <p data-translate-etym="${meaningEvoAttr}">${meaningEvolutionText}</p>
      </div>
      <div class="etym-section">
        <div class="etym-section-label" data-translate="present-meaning-label">PRESENT-DAY MEANING</div>
        <p data-translate-etym="${presentDayAttr}">${presentDayMeaning}</p>
      </div>
      <div class="etym-core-idea">
        <div class="etym-section-label" data-translate="core-idea-label">CORE IDEA</div>
        <p data-translate-etym="${coreIdeaAttr}">&ldquo;<strong>${coreIdea}</strong>&rdquo;</p>
      </div>
      <p class="etymology-source"><span data-translate="more-details">More details at</span> <a href="${etymologyUrl}" target="_blank" rel="noopener noreferrer"><span data-translate="etymonline">Etymonline</span></a></p>
    </div>
  `;
}

function isValidTranslation(result, source) {
  if (!result || typeof result !== 'string') return false;
  const t = result.trim();
  if (!t) return false;
  if (t.toLowerCase() === source.toLowerCase()) return false;
  if (/QUERY LENGTH LIMIT|MYMEMORY WARNING|PLEASE SELECT|quota|exceeded|invalid/i.test(t)) return false;
  if (/<[a-z][\s\S]*>/i.test(t)) return false;
  if (/https?:\/\/|www\./i.test(t)) return false;
  if (/^[{\["']/.test(t) && t.length > 20) return false;
  if (t.length > source.length * 6 + 80) return false;
  return true;
}

// Parallel pool (not fully serial) + in-flight dedupe + localStorage cache
const TX_CONCURRENCY = 5;
const TX_CACHE_STORAGE_KEY = 'wordfission-tx-cache-v1';
const translationInflight = new Map();
let _txActive = 0;
const _txWaiters = [];
let _txCacheSaveTimer = null;

(function loadTranslationCache() {
  try {
    const raw = localStorage.getItem(TX_CACHE_STORAGE_KEY);
    if (!raw) return;
    const entries = JSON.parse(raw);
    if (entries && typeof entries === 'object') {
      Object.entries(entries).forEach(([k, v]) => {
        if (typeof v === 'string' && v) translationCache.set(k, v);
      });
    }
  } catch (_) { /* ignore */ }
})();

function persistTranslationCache() {
  clearTimeout(_txCacheSaveTimer);
  _txCacheSaveTimer = setTimeout(() => {
    try {
      const obj = {};
      let i = 0;
      for (const [k, v] of translationCache) {
        obj[k] = v;
        if (++i >= 400) break; // keep storage bounded
      }
      localStorage.setItem(TX_CACHE_STORAGE_KEY, JSON.stringify(obj));
    } catch (_) { /* quota / private mode */ }
  }, 400);
}

function drainTxQueue() {
  while (_txActive < TX_CONCURRENCY && _txWaiters.length) {
    _txWaiters.sort((a, b) => b.priority - a.priority);
    const job = _txWaiters.shift();
    _txActive++;
    Promise.resolve()
      .then(job.fn)
      .then(job.resolve, job.reject)
      .finally(() => {
        _txActive--;
        drainTxQueue();
      });
  }
}

function enqueueTx(priority, fn) {
  return new Promise((resolve, reject) => {
    _txWaiters.push({ priority, fn, resolve, reject });
    drainTxQueue();
  });
}

async function fetchTranslation(text, langCode, priority = 0) {
  const sanitized = text.trim().replace(/\s+/g, ' ');
  if (!sanitized) return null;
  const key = sanitized + '|' + langCode;
  if (translationCache.has(key)) return translationCache.get(key);
  if (translationInflight.has(key)) return translationInflight.get(key);

  const promise = enqueueTx(priority, async () => {
    const url = MYMEMORY_API + '?q=' + encodeURIComponent(sanitized) + '&langpair=en|' + langCode;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const result = (data?.responseData?.translatedText || '').trim();
    if (isValidTranslation(result, sanitized)) {
      translationCache.set(key, result);
      persistTranslationCache();
      return result;
    }
    return null;
  }).catch(() => null).finally(() => {
    translationInflight.delete(key);
  });

  translationInflight.set(key, promise);
  return promise;
}

function makeTranslationPill(cls) {
  const el = document.createElement('span');
  el.className = 'inline-translation translation-skeleton' + (cls ? ' ' + cls : '');
  return el;
}

function resolveTranslationPill(pill, text, cls) {
  if (text) {
    pill.className = 'inline-translation' + (cls ? ' ' + cls : '');
    pill.textContent = text;
  } else {
    pill.remove();
  }
}

async function translateUIElements(langCode, langName, root) {
  const scope = root || document;

  if (langCode === 'en') {
    scope.querySelectorAll('[data-translate]').forEach(el => {
      el.querySelectorAll(':scope > .inline-translation').forEach(p => p.remove());
    });
    if (!root) {
      document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
        const key = el.dataset.translatePlaceholder;
        const originalText = UI_STRINGS[key];
        if (originalText) el.placeholder = originalText;
      });
    }
    translateBtn.innerHTML = '🌐 Translate ▼';
    translateBtn.classList.remove('translate-btn--active');
    translateBtn.dataset.activeLang = '';
    translateBtn.dataset.activeLangCode = 'en';
    return;
  }

  scope.querySelectorAll('[data-translate]').forEach(el => {
    // Button label is managed separately
    if (el.id === 'translate-btn' || el.id === 'theme-toggle') return;

    const key = el.dataset.translate;
    const originalText = UI_STRINGS[key];
    if (!originalText) return;

    el.querySelectorAll(':scope > .inline-translation').forEach(p => p.remove());

    const pill = makeTranslationPill('ui-translation');
    pill.style.display = 'inline';
    pill.style.marginLeft = '6px';
    el.appendChild(pill);

    fetchTranslation(originalText, langCode).then(translated => {
      if (translated) {
        resolveTranslationPill(pill, translated, 'ui-translation');
        pill.style.display = 'inline';
        pill.style.marginLeft = '6px';
      } else {
        pill.remove();
      }
    });
  });

  if (!root) {
    document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
      const key = el.dataset.translatePlaceholder;
      const originalText = UI_STRINGS[key];
      if (!originalText) return;
      fetchTranslation(originalText, langCode).then(translated => {
        if (translated) el.placeholder = translated;
      });
    });
  }

  if (langName) {
    translateBtn.innerHTML = '🌐 ' + langName + ' ▼';
    translateBtn.classList.add('translate-btn--active');
  }

  translateBtn.dataset.activeLang = langName || '';
  translateBtn.dataset.activeLangCode = langCode;
}

async function applyInlineTranslations(langCode, langName) {
  const card = outputPanel.querySelector('.definition-card');
  if (!card || !currentEntry) return;

  // Clear previous content pills (keep UI label pills managed by translateUIElements)
  card.querySelectorAll('.inline-translation:not(.ui-translation)').forEach(el => el.remove());

  if (langCode === 'en') return;

  // ── Word title ──────────────────────────────────────────────────────────────
  const titleEl = card.querySelector('[data-translate-word]');
  if (titleEl) {
    const wordText = titleEl.dataset.translateWord;
    const pill = makeTranslationPill('word-translation');
    titleEl.appendChild(pill);
    fetchTranslation(wordText, langCode, 1).then(r =>
      resolveTranslationPill(pill, r, 'word-translation')
    );
  }

  // ── Word summary ────────────────────────────────────────────────────────────
  const summaryEl = card.querySelector('[data-translate-summary]');
  if (summaryEl) {
    const summaryText = summaryEl.dataset.translateSummary;
    const pill = makeTranslationPill('summary-translation');
    summaryEl.appendChild(pill);
    fetchTranslation(summaryText, langCode).then(r =>
      resolveTranslationPill(pill, r, 'summary-translation')
    );
  }

  // ── Definitions + examples ──────────────────────────────────────────────────
  card.querySelectorAll('.meaning-list li').forEach((li) => {
    const block = li.closest('.meaning-block');
    const blockIdx = Array.from(card.querySelectorAll('.meaning-block')).indexOf(block);
    const liIdx = Array.from(li.parentElement.children).indexOf(li);
    const def = currentEntry.meanings[blockIdx]?.definitions[liIdx];
    if (!def) return;

    const defText = def.definition.replace(/\s+/g, ' ').trim().slice(0, 180);
    const defPill = makeTranslationPill('def-translation');
    li.appendChild(defPill);
    fetchTranslation(defText, langCode).then(r =>
      resolveTranslationPill(defPill, r, 'def-translation')
    );

    if (def.example) {
      const exText = def.example.replace(/\s+/g, ' ').trim().slice(0, 180);
      const exEl = li.querySelector('.example');
      if (exEl) {
        const exPill = makeTranslationPill('ex-translation');
        exEl.appendChild(exPill);
        fetchTranslation(exText, langCode).then(r =>
          resolveTranslationPill(exPill, r ? '\u201c' + r + '\u201d' : null, 'ex-translation')
        );
      }
    }
  });

  // ── Synonyms ────────────────────────────────────────────────────────────────
  card.querySelectorAll('.meaning-block').forEach((block, bi) => {
    const meaning = currentEntry.meanings[bi];
    if (!meaning) return;
    const synonyms = [...new Set([
      ...(meaning.synonyms || []),
      ...meaning.definitions.flatMap(d => d.synonyms || [])
    ])].slice(0, 6);
    if (!synonyms.length) return;

    const synEl = block.querySelector('.word-list[data-translate-synonyms]');
    if (!synEl) return;

    const pill = makeTranslationPill('syn-translation');
    synEl.appendChild(pill);

    Promise.all(synonyms.map(w => fetchTranslation(w, langCode)))
      .then(results => {
        const translated = results.filter(Boolean);
        resolveTranslationPill(pill, translated.length ? translated.join(', ') : null, 'syn-translation');
      });
  });

  // ── Etymology body text ─────────────────────────────────────────────────────
  card.querySelectorAll('[data-translate-etym]').forEach(el => {
    const text = (el.dataset.translateEtym || '').replace(/\s+/g, ' ').trim().slice(0, 220);
    if (!text) return;
    const pill = makeTranslationPill('def-translation');
    el.appendChild(pill);
    fetchTranslation(text, langCode).then(r =>
      resolveTranslationPill(pill, r, 'def-translation')
    );
  });
}

function annotateCardForTranslation(entry) {
  const card = outputPanel.querySelector('.definition-card');
  if (!card) return;

  card.querySelectorAll('.meaning-block').forEach((block, bi) => {
    const meaning = entry.meanings[bi];
    if (!meaning) return;
    const synonyms = [...new Set([
      ...(meaning.synonyms || []),
      ...meaning.definitions.flatMap(d => d.synonyms || [])
    ])].slice(0, 6);
    if (!synonyms.length) return;
    const synEl = block.querySelector('.word-list');
    if (synEl) synEl.dataset.translateSynonyms = '1';
  });
}

function shortenText(text, maxLength = 150) {
  if (!text) return '';
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength).replace(/\s+$/, '')}...`;
}

function escAttr(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function initTheme() {
  const storedTheme = localStorage.getItem('wordfission-theme');
  if (storedTheme === 'dark' || storedTheme === 'light') {
    setTheme(storedTheme);
    return;
  }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(prefersDark ? 'dark' : 'light');
}

async function lookupWord(word) {
  outputPanel.innerHTML = '<div class="output-empty" data-translate="loading">Loading definition...</div>';
  const btn = document.getElementById('translate-btn');
  if (btn && btn.dataset.activeLang && btn.dataset.activeLangCode) {
    translateUIElements(btn.dataset.activeLangCode, btn.dataset.activeLang, outputPanel);
  }

  try {
    const response = await fetch(`${API_BASE}/${encodeURIComponent(word)}`);
    if (!response.ok) {
      throw new Error('Word not found');
    }
    const data = await response.json();
    await renderResult(data[0]);
    saveRecentSearch(word);
  } catch (error) {
    outputPanel.innerHTML = `<div class="output-empty"><span data-translate="not-found">Unable to find</span> "${word}". <span data-translate="try-another">Try another word.</span></div>`;
    if (btn && btn.dataset.activeLang && btn.dataset.activeLangCode) {
      translateUIElements(btn.dataset.activeLangCode, btn.dataset.activeLang, outputPanel);
    }
  }
}

async function fetchRelatedWords(word) {
  const suggestions = await fetchSuggestions(word);
  return suggestions.filter((item) => item.toLowerCase() !== word.toLowerCase()).slice(0, 6);
}

async function renderResult(entry) {
  const phonetics = entry.phonetics.find((item) => item.text) || {};
  const audioSource = entry.phonetics.find((item) => item.audio) || {};
  if (!entry.meanings || !entry.meanings.length) {
    outputPanel.innerHTML = `<div class="output-empty"><span data-translate="no-definitions">No definitions available for</span> "${entry.word}".</div>`;
    const btn = document.getElementById('translate-btn');
    if (btn && btn.dataset.activeLang && btn.dataset.activeLangCode) {
      translateUIElements(btn.dataset.activeLangCode, btn.dataset.activeLang, outputPanel);
    }
    return;
  }

  const wordExamples = entry.meanings.flatMap((meaning) =>
    meaning.definitions.map((definition) => definition.example).filter(Boolean)
  );
  const fallbackExamples = wordExamples.length ? [] : await fetchAlternateExamples(entry.word);
  const etymologyText = await fetchEtymology(entry.word);
  const etymologyUrl = `https://www.etymonline.com/word/${encodeURIComponent(entry.word)}`;
  const sentenceDictUrl = `${SENTENCE_DICT_BASE}${encodeURIComponent(entry.word)}.html`;
  const thesaurusUrl = `${THESAURUS_BASE}${encodeURIComponent(entry.word)}`;
  const longmanUrl = `${LONGMAN_BASE}${encodeURIComponent(entry.word)}`;
  const collinsUrl = `${COLLINS_BASE}${encodeURIComponent(entry.word)}`;

  const meaningsHtml = entry.meanings
    .map((meaning) => {
      const definitions = meaning.definitions
        .map((definition) => {
          const exampleHtml = definition.example
            ? `<p class="example">"<strong>${definition.example}</strong>"</p>`
            : '';
          return `<li>${definition.definition}${exampleHtml}</li>`;
        })
        .join('');

      const synonyms = [
        ...(meaning.synonyms || []),
        ...meaning.definitions.flatMap((definition) => definition.synonyms || []),
      ];
      const antonyms = [
        ...(meaning.antonyms || []),
        ...meaning.definitions.flatMap((definition) => definition.antonyms || []),
      ];

      return `<div class="meaning-block">
        <h3>${meaning.partOfSpeech}</h3>
        <ul class="meaning-list">${definitions}</ul>
        ${synonyms.length ? `<p class="word-list"><span>Synonyms:</span> ${[...new Set(synonyms)].join(', ')}</p>` : ''}
        ${antonyms.length ? `<p class="word-list"><span>Antonyms:</span> ${[...new Set(antonyms)].join(', ')}</p>` : ''}
      </div>`;
    })
    .join('');

  const fallbackHtml = !wordExamples.length && fallbackExamples.length
    ? `<div class="fallback-examples">
         <h3>Example sentences from another source</h3>
         <ul>${fallbackExamples.map((example) => `<li>${example}</li>`).join('')}</ul>
       </div>`
    : '';

  const noExampleHtml = !wordExamples.length && !fallbackExamples.length
    ? `<p class="no-example">No sentence example available for this word.</p>`
    : '';

  const sentenceSourceHtml = `<p class="sentence-source">More sentence examples on <a href="${sentenceDictUrl}" target="_blank" rel="noopener noreferrer">SentenceDict</a> · <a href="${thesaurusUrl}" target="_blank" rel="noopener noreferrer">Thesaurus.com</a> · <a href="${longmanUrl}" target="_blank" rel="noopener noreferrer">Longman Dictionary</a> · <a href="${collinsUrl}" target="_blank" rel="noopener noreferrer">Collins Dictionary</a>.</p>`;

  const relatedWords = await fetchRelatedWords(entry.word);
  const relatedWordsHtml = relatedWords.length
    ? `<div class="more-words-section">
         <h3 data-translate="more-words">More words</h3>
         <div class="word-tags">
           ${relatedWords.map((word) => `<button type="button" class="word-tag" data-word="${word}">${word}</button>`).join('')}
         </div>
       </div>`
    : '';

  const summary = shortenText(entry.meanings?.[0]?.definitions?.[0]?.definition || '', 140);
  const summaryHtml = summary
    ? `<p class="word-summary" data-translate-summary="${escAttr(summary)}">${summary}</p>`
    : '';

  const etymologyHtml = etymologyText ? buildEtymologyCardHtml(entry.word, etymologyText, entry, etymologyUrl) : '';


  const bookmarks = getBookmarks();
  const isBookmarked = bookmarks.some(w => w.toLowerCase() === entry.word.toLowerCase());
  const activeClass = isBookmarked ? 'active' : '';

  const starSvg = `
    <svg viewBox="0 0 24 24">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  `;
  const audioSvg = `
    <svg viewBox="0 0 24 24">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
    </svg>
  `;

  const pronunciationHtml = '';

  currentEntry = entry;

  outputPanel.innerHTML = `
    <div class="definition-card">
      <div class="definition-header">
        <div class="definition-title-row">
          <h2 data-translate-word="${escAttr(entry.word)}">${entry.word}</h2>
          <div class="definition-actions">
            <button class="bookmark-button ${activeClass}" data-word="${entry.word}" aria-label="Bookmark word">${starSvg}</button>
            ${audioSource.audio ? `<button class="audio-button" data-audio="${audioSource.audio}" aria-label="Play pronunciation">${audioSvg}</button>` : ''}
          </div>
        </div>
        ${summaryHtml}
        ${relatedWordsHtml}
        ${etymologyHtml}
      </div>
      ${meaningsHtml}
      ${fallbackHtml}
      ${sentenceSourceHtml}
      ${noExampleHtml}
    </div>
  `;

  annotateCardForTranslation(entry);

  // Re-apply translation if a language is already active (card was rebuilt)
  const btn = document.getElementById('translate-btn');
  if (btn && btn.dataset.activeLang && btn.dataset.activeLangCode) {
    const code = btn.dataset.activeLangCode;
    const name = btn.dataset.activeLang;
    const card = outputPanel.querySelector('.definition-card');
    translateUIElements(code, name, card);
    applyInlineTranslations(code, name);
  }
}

function handleSearch() {
  const word = searchInput.value.trim();
  clearSuggestions();
  if (word) {
    lookupWord(word);
  }
}

async function renderSuggestions(value) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    clearSuggestions();
    return;
  }

  const requestId = ++suggestionRequestId;
  const matches = await fetchSuggestions(normalized);
  if (requestId !== suggestionRequestId) return;

  if (!matches.length) {
    clearSuggestions();
    return;
  }

  suggestionsPanel.innerHTML = matches
    .map((word) => `<div class="suggestion-item" role="option" tabindex="0" data-value="${word}">${word}</div>`)
    .join('');
  suggestionIndex = -1;
}

searchButton.addEventListener('click', handleSearch);
searchInput.addEventListener('input', debounce((event) => {
  renderSuggestions(event.target.value);
}, 200));

searchInput.addEventListener('keydown', (event) => {
  const items = Array.from(suggestionsPanel.querySelectorAll('.suggestion-item'));
  if (!items.length) return;

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    const nextIndex = suggestionIndex + 1 >= items.length ? 0 : suggestionIndex + 1;
    setActiveSuggestion(nextIndex);
    return;
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault();
    const prevIndex = suggestionIndex - 1 < 0 ? items.length - 1 : suggestionIndex - 1;
    setActiveSuggestion(prevIndex);
    return;
  }

  if (event.key === 'Enter' && suggestionIndex >= 0) {
    event.preventDefault();
    handleSearch();
    clearSuggestions();
    return;
  }

  if (event.key === 'Escape') {
    clearSuggestions();
  }
});

suggestionsPanel.addEventListener('click', (event) => {
  const item = event.target.closest('.suggestion-item');
  if (!item) return;
  const value = item.dataset.value || item.textContent;
  searchInput.value = value;
  clearSuggestions();
  lookupWord(value);
});

suggestionsPanel.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && event.target.classList.contains('suggestion-item')) {
    const value = event.target.dataset.value || event.target.textContent;
    searchInput.value = value;
    clearSuggestions();
    lookupWord(value);
  }
});

outputPanel.addEventListener('click', async (event) => {
    const bookmarkBtn = event.target.closest('.bookmark-button');
  if (bookmarkBtn) {
    const word = bookmarkBtn.dataset.word;
    toggleBookmark(word);
    return;
  }

  const relatedButton = event.target.closest('.word-tag');
  if (relatedButton) {
    const value = relatedButton.dataset.word;
    if (value) {
      searchInput.value = value;
      lookupWord(value);
    }
    return;
  }

  const button = event.target.closest('.audio-button');
  if (!button) return;
  const src = button.dataset.audio;
  if (!src) return;
  const audio = new Audio(src);
  audio.play();
});

recentList.addEventListener('click', (event) => {
  const btn = event.target.closest('.recent-item');
  if (btn) {
    const word = btn.dataset.word;
    searchInput.value = word;
    lookupWord(word);
  }
});

favoritesList.addEventListener('click', (event) => {
  const removeBtn = event.target.closest('.remove-bookmark');
  if (removeBtn) {
    event.stopPropagation();
    const word = removeBtn.dataset.word;
    toggleBookmark(word);
    return;
  }
  const item = event.target.closest('.favorite-item');
  if (item) {
    const word = item.dataset.word;
    searchInput.value = word;
    lookupWord(word);
  }
});

themeToggle.addEventListener('click', () => {
  const isDark = document.documentElement.classList.contains('dark-theme');
  setTheme(isDark ? 'light' : 'dark');
});

// ── Translate dropdown ────────────────────────────────────────────────────────
const translateBtn = document.getElementById('translate-btn');
const translatePanel = document.getElementById('translate-panel');
const translateFilter = document.getElementById('translate-filter');
const translateLangList = document.getElementById('translate-lang-list');
const translateWrap = document.getElementById('translate-dropdown-wrap');

function renderTranslateLangList(filter) {
  const q = (filter || '').toLowerCase();
  const langs = q
    ? TRANSLATION_LANGS.filter(l => l.name.toLowerCase().includes(q))
    : TRANSLATION_LANGS;
  translateLangList.innerHTML = langs.map(l =>
    `<button class="translate-lang-item" data-code="${l.code}" data-name="${l.name}" role="option">${l.name}</button>`
  ).join('');
}

function openTranslatePanel() {
  translatePanel.hidden = false;
  translateBtn.setAttribute('aria-expanded', 'true');
  translateFilter.value = '';
  renderTranslateLangList('');
  translateFilter.focus();
}

function closeTranslatePanel() {
  translatePanel.hidden = true;
  translateBtn.setAttribute('aria-expanded', 'false');
}

translateBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (!translatePanel.hidden) {
    closeTranslatePanel();
  } else {
    openTranslatePanel();
  }
});

translateFilter.addEventListener('input', (e) => renderTranslateLangList(e.target.value));

translatePanel.addEventListener('click', (e) => {
  const item = e.target.closest('.translate-lang-item');
  if (!item) return;
  const langCode = item.dataset.code;
  const langName = item.dataset.name;
  closeTranslatePanel();
  translateBtn.dataset.activeLang = langName;
  translateBtn.dataset.activeLangCode = langCode;
  translateBtn.innerHTML = '🌐 ' + langName + ' ▼';
  translateBtn.classList.add('translate-btn--active');
  
  // Translate UI elements
  translateUIElements(langCode, langName);
  
  // Translate word content if available
  if (currentEntry) {
    applyInlineTranslations(langCode, langName);
  }
});

document.addEventListener('click', (e) => {
  if (translateWrap && !translateWrap.contains(e.target)) closeTranslatePanel();
  if (!e.target.closest('.search-container')) clearSuggestions();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeTranslatePanel();
});

initApp();
