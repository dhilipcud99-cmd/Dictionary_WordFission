const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const outputPanel = document.getElementById('output-panel');
const themeToggle = document.getElementById('theme-toggle');
const suggestionsPanel = document.getElementById('suggestions-panel');

const API_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en';
const AUTOCOMPLETE_API = 'https://api.datamuse.com/sug';
const ALT_EXAMPLE_API = 'https://api.urbandictionary.com/v0/define?term=';
const SENTENCE_DICT_BASE = 'https://sentencedict.com/';
const THESAURUS_BASE = 'https://www.thesaurus.com/browse/';
const LONGMAN_BASE = 'https://www.ldoceonline.com/dictionary/';
const COLLINS_BASE = 'https://www.collinsdictionary.com/dictionary/english/';
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

async function initApp() {
  initTheme();
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

    const match = html.match(/<h[2-4][^>]*>\s*Etymology\s*<\/h[2-4]>([\s\S]*?)(?=<h[2-4][^>]*>)/i);
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
            ? `<p class="example">"${definition.example}"</p>`
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

  const etymologyHtml = etymologyText
    ? `<div class="etymology-section"><div class="etymology-heading">Etymology Breakdown</div>${etymologyText}<p class="etymology-source">More details at <a href="${etymologyUrl}" target="_blank" rel="noopener noreferrer">Etymonline</a></p></div>`
    : '';

  outputPanel.innerHTML = `
    <div class="definition-card">
      <div class="definition-header">
        <div>
          <h2>${entry.word}</h2>
          ${summaryHtml}
          ${relatedWordsHtml}
          ${etymologyHtml}
        </div>
        ${audioSource.audio ? `<button class="audio-button" data-audio="${audioSource.audio}" aria-label="Play pronunciation">🔊</button>` : ''}
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

outputPanel.addEventListener('click', (event) => {
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

themeToggle.addEventListener('click', () => {
  const isDark = document.documentElement.classList.contains('dark-theme');
  setTheme(isDark ? 'light' : 'dark');
});

initApp();
