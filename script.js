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
let suggestionIndex = -1;
let suggestionRequestId = 0;

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
    recentList.innerHTML = '<p class="sidebar-empty">No recent searches</p>';
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
    favoritesList.innerHTML = '<p class="sidebar-empty">No bookmarked words</p>';
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

  const clockSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>';

  return `
    <div class="etymology-card">
      <div class="etym-heading">${clockSvg}<span>Etymology &amp; Word Origin</span></div>
      <div class="etym-top-grid">
        <div class="etym-box">
          <div class="etym-box-label">ORIGIN LANGUAGE(S)</div>
          <p class="etym-origin-langs">${originLanguages}</p>
        </div>
        <div class="etym-box">
          <div class="etym-box-label">ROOT WORD(S) &amp; MEANINGS</div>
          <ul class="etym-roots-list">${rootsListHtml}</ul>
        </div>
      </div>
      <div class="etym-section">
        <div class="etym-section-label">WORD EVOLUTION PATH</div>
        <p class="etym-evolution-path">${evolutionPathText}</p>
      </div>
      <div class="etym-section">
        <div class="etym-section-label">HOW MEANING CHANGED OVER TIME</div>
        <p>${meaningEvolutionText}</p>
      </div>
      <div class="etym-section">
        <div class="etym-section-label">PRESENT-DAY MEANING</div>
        <p>${presentDayMeaning}</p>
      </div>
      <div class="etym-core-idea">
        <div class="etym-section-label">CORE IDEA</div>
        <p>&ldquo;<strong>${coreIdea}</strong>&rdquo;</p>
      </div>
      <p class="etymology-source">More details at <a href="${etymologyUrl}" target="_blank" rel="noopener noreferrer">Etymonline</a></p>
    </div>
  `;
}

async function fetchTranslation(text, langCode) {
  const key = text + '|' + langCode;
  if (translationCache.has(key)) return translationCache.get(key);
  try {
    const url = MYMEMORY_API + '?q=' + encodeURIComponent(text) + '&langpair=en|' + langCode;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Translation failed');
    const data = await res.json();
    const result = data?.responseData?.translatedText || '';
    if (result && result.toLowerCase() !== text.toLowerCase()) {
      translationCache.set(key, result);
      return result;
    }
    return '';
  } catch (e) {
    return '';
  }
}

function buildTranslationSectionHtml(word) {
  const options = TRANSLATION_LANGS.map(l =>
    '<option value="' + l.code + '">' + l.name + '</option>'
  ).join('');
  return `
    <div class="translation-section" id="translation-section-${word}">
      <div class="translation-header">
        <span class="translation-title">🌐 Translations</span>
        <select class="translation-dropdown" id="translation-dropdown-${word}" data-word="${word}">
          <option value="">Select language</option>
          ${options}
        </select>
      </div>
      <div class="translation-result" id="translation-result-${word}"></div>
    </div>
  `;
}

function shortenText(text, maxLength = 150) {
  if (!text) return '';
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength).replace(/\s+$/, '')}...`;
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
  outputPanel.innerHTML = '<div class="output-empty">Loading definition...</div>';

  try {
    const response = await fetch(`${API_BASE}/${encodeURIComponent(word)}`);
    if (!response.ok) {
      throw new Error('Word not found');
    }
    const data = await response.json();
    await renderResult(data[0]);
    saveRecentSearch(word);
  } catch (error) {
    outputPanel.innerHTML = `<div class="output-empty">Unable to find "${word}". Try another word.</div>`;
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
    outputPanel.innerHTML = `<div class="output-empty">No definitions available for "${entry.word}".</div>`;
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
         <h3>More words</h3>
         <div class="word-tags">
           ${relatedWords.map((word) => `<button type="button" class="word-tag" data-word="${word}">${word}</button>`).join('')}
         </div>
       </div>`
    : '';

  const summary = shortenText(entry.meanings?.[0]?.definitions?.[0]?.definition || '', 140);
  const summaryHtml = summary
    ? `<p class="word-summary">${summary}</p>`
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

  outputPanel.innerHTML = `
    <div class="definition-card">
      <div class="definition-header">
        <div class="definition-title-row">
          <h2>${entry.word}</h2>
          <div class="definition-actions">
            ${buildTranslationSectionHtml(entry.word)}
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

outputPanel.addEventListener('change', async (event) => {
  const dropdown = event.target.closest('.translation-dropdown');
  if (!dropdown) return;
  const word = dropdown.dataset.word;
  const langCode = dropdown.value;
  const resultEl = document.getElementById('translation-result-' + word);
  if (!langCode || !resultEl) return;

  const langName = TRANSLATION_LANGS.find(l => l.code === langCode)?.name || langCode;
  const definition = resultEl.closest('.definition-card')
    ?.querySelector('.meaning-list li')?.textContent?.trim() || '';

  resultEl.innerHTML = '<span class="translation-loading">Translating...</span>';

  const [wordTranslation, defTranslation] = await Promise.all([
    fetchTranslation(word, langCode),
    definition ? fetchTranslation(definition.slice(0, 200), langCode) : Promise.resolve('')
  ]);

  if (!wordTranslation) {
    resultEl.innerHTML = '<span class="translation-error">Translation not available for this language.</span>';
    return;
  }

  resultEl.innerHTML = `
    <div class="translation-card">
      <div class="translation-row">
        <span class="translation-label">Word in ${langName}</span>
        <span class="translation-value">${wordTranslation}</span>
      </div>
      ${defTranslation ? `<div class="translation-row">
        <span class="translation-label">Definition in ${langName}</span>
        <span class="translation-value translation-def">${defTranslation}</span>
      </div>` : ''}
    </div>
  `;
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

document.addEventListener('click', (event) => {
  if (!event.target.closest('.search-container')) {
    clearSuggestions();
  }
});

themeToggle.addEventListener('click', () => {
  const isDark = document.documentElement.classList.contains('dark-theme');
  setTheme(isDark ? 'light' : 'dark');
});

// Translate feature
const LANGUAGES = [
  { code: 'af', name: 'Afrikaans' }, { code: 'sq', name: 'Albanian' }, { code: 'am', name: 'Amharic' },
  { code: 'ar', name: 'Arabic' }, { code: 'hy', name: 'Armenian' }, { code: 'az', name: 'Azerbaijani' },
  { code: 'eu', name: 'Basque' }, { code: 'be', name: 'Belarusian' }, { code: 'bn', name: 'Bengali' },
  { code: 'bs', name: 'Bosnian' }, { code: 'bg', name: 'Bulgarian' }, { code: 'ca', name: 'Catalan' },
  { code: 'ceb', name: 'Cebuano' }, { code: 'zh-CN', name: 'Chinese (Simplified)' }, { code: 'zh-TW', name: 'Chinese (Traditional)' },
  { code: 'co', name: 'Corsican' }, { code: 'hr', name: 'Croatian' }, { code: 'cs', name: 'Czech' },
  { code: 'da', name: 'Danish' }, { code: 'nl', name: 'Dutch' }, { code: 'eo', name: 'Esperanto' },
  { code: 'et', name: 'Estonian' }, { code: 'fi', name: 'Finnish' }, { code: 'fr', name: 'French' },
  { code: 'fy', name: 'Frisian' }, { code: 'gl', name: 'Galician' }, { code: 'ka', name: 'Georgian' },
  { code: 'de', name: 'German' }, { code: 'el', name: 'Greek' }, { code: 'gu', name: 'Gujarati' },
  { code: 'ht', name: 'Haitian Creole' }, { code: 'ha', name: 'Hausa' }, { code: 'haw', name: 'Hawaiian' },
  { code: 'he', name: 'Hebrew' }, { code: 'hi', name: 'Hindi' }, { code: 'hmn', name: 'Hmong' },
  { code: 'hu', name: 'Hungarian' }, { code: 'is', name: 'Icelandic' }, { code: 'ig', name: 'Igbo' },
  { code: 'id', name: 'Indonesian' }, { code: 'ga', name: 'Irish' }, { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' }, { code: 'jv', name: 'Javanese' }, { code: 'kn', name: 'Kannada' },
  { code: 'kk', name: 'Kazakh' }, { code: 'km', name: 'Khmer' }, { code: 'rw', name: 'Kinyarwanda' },
  { code: 'ko', name: 'Korean' }, { code: 'ku', name: 'Kurdish' }, { code: 'ky', name: 'Kyrgyz' },
  { code: 'lo', name: 'Lao' }, { code: 'la', name: 'Latin' }, { code: 'lv', name: 'Latvian' },
  { code: 'lt', name: 'Lithuanian' }, { code: 'lb', name: 'Luxembourgish' }, { code: 'mk', name: 'Macedonian' },
  { code: 'mg', name: 'Malagasy' }, { code: 'ms', name: 'Malay' }, { code: 'ml', name: 'Malayalam' },
  { code: 'mt', name: 'Maltese' }, { code: 'mi', name: 'Maori' }, { code: 'mr', name: 'Marathi' },
  { code: 'mn', name: 'Mongolian' }, { code: 'my', name: 'Myanmar (Burmese)' }, { code: 'ne', name: 'Nepali' },
  { code: 'no', name: 'Norwegian' }, { code: 'ny', name: 'Nyanja (Chichewa)' }, { code: 'or', name: 'Odia (Oriya)' },
  { code: 'ps', name: 'Pashto' }, { code: 'fa', name: 'Persian' }, { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' }, { code: 'pa', name: 'Punjabi' }, { code: 'ro', name: 'Romanian' },
  { code: 'ru', name: 'Russian' }, { code: 'sm', name: 'Samoan' }, { code: 'gd', name: 'Scots Gaelic' },
  { code: 'sr', name: 'Serbian' }, { code: 'st', name: 'Sesotho' }, { code: 'sn', name: 'Shona' },
  { code: 'sd', name: 'Sindhi' }, { code: 'si', name: 'Sinhala' }, { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' }, { code: 'so', name: 'Somali' }, { code: 'es', name: 'Spanish' },
  { code: 'su', name: 'Sundanese' }, { code: 'sw', name: 'Swahili' }, { code: 'sv', name: 'Swedish' },
  { code: 'tl', name: 'Tagalog (Filipino)' }, { code: 'tg', name: 'Tajik' }, { code: 'ta', name: 'Tamil' },
  { code: 'tt', name: 'Tatar' }, { code: 'te', name: 'Telugu' }, { code: 'th', name: 'Thai' },
  { code: 'tr', name: 'Turkish' }, { code: 'tk', name: 'Turkmen' }, { code: 'uk', name: 'Ukrainian' },
  { code: 'ur', name: 'Urdu' }, { code: 'ug', name: 'Uyghur' }, { code: 'uz', name: 'Uzbek' },
  { code: 'vi', name: 'Vietnamese' }, { code: 'cy', name: 'Welsh' }, { code: 'xh', name: 'Xhosa' },
  { code: 'yi', name: 'Yiddish' }, { code: 'yo', name: 'Yoruba' }, { code: 'zu', name: 'Zulu' }
];

const translateBtn = document.getElementById('translate-btn');
const translateOverlay = document.getElementById('translate-overlay');
const translateClose = document.getElementById('translate-close');
const translateFilter = document.getElementById('translate-filter');
const translateLangGrid = document.getElementById('translate-lang-grid');
const translateSubtitle = document.getElementById('translate-subtitle');

function getCurrentWord() {
  return searchInput.value.trim() || '';
}

function renderLanguageGrid(filter = '') {
  const word = getCurrentWord();
  const filtered = filter
    ? LANGUAGES.filter(l => l.name.toLowerCase().includes(filter.toLowerCase()))
    : LANGUAGES;
  translateLangGrid.innerHTML = filtered.map(lang => {
    const url = word
      ? `https://translate.google.com/?sl=en&tl=${lang.code}&text=${encodeURIComponent(word)}&op=translate`
      : `https://translate.google.com/?sl=en&tl=${lang.code}`;
    return `<a class="lang-chip" href="${url}" target="_blank" rel="noopener noreferrer">${lang.name}</a>`;
  }).join('');
}

translateBtn.addEventListener('click', () => {
  const word = getCurrentWord();
  translateSubtitle.textContent = word ? `Translating: "${word}"` : 'Search a word first, or browse languages';
  renderLanguageGrid();
  translateOverlay.classList.add('translate-overlay--open');
  translateOverlay.setAttribute('aria-hidden', 'false');
  translateFilter.value = '';
  translateFilter.focus();
});

translateClose.addEventListener('click', () => {
  translateOverlay.classList.remove('translate-overlay--open');
  translateOverlay.setAttribute('aria-hidden', 'true');
});

translateOverlay.addEventListener('click', (e) => {
  if (e.target === translateOverlay) {
    translateOverlay.classList.remove('translate-overlay--open');
    translateOverlay.setAttribute('aria-hidden', 'true');
  }
});

translateFilter.addEventListener('input', (e) => renderLanguageGrid(e.target.value));

initApp();
