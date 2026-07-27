// ============================================================
// HIGH-QUALITY EXAMPLE SENTENCE SYSTEM
// ============================================================
// Sources (in order of preference):
//   1. Dictionary API built-in examples
//   2. Wiktionary parsed examples (professional, cited)
//   3. Curated embedded examples for high-frequency words
//   4. Definition-based template generation (last resort)
// ============================================================

// Extended offensive/slang/gibberish filter
const OFFENSIVE_PATTERNS = /\b(fuck|shit|bitch|dick|cock|piss|slut|whore|bastard|damn|crap|asshole|motherfuck|nigger|nigga|porn|sex\s*(?:tape|toys?|shop)|xxx)\b/i;

const SLANG_PATTERNS = /\b(gonna|wanna|gotta|ain't|y'all|dunno|imo|tbh|btw|afk|lol|lmao|rofl|smh|omg|wtf|idk|ikr|nvm|brb|tyty)\b/i;

const INCOMPLETE_PATTERNS = /^[a-z]|^[,;:!?]|\.{2,}$|^\s*[-]|^\s*\)|^\s*\]|^\s*\}/;

// Curated, dictionary-quality example sentences for common words.
// These are professionally written to clearly demonstrate meaning and context.
const CURATED_EXAMPLES = {
  "ability": [
    "Her ability to solve complex problems quickly impressed everyone on the team.",
    "The course is designed to improve students' reading and writing abilities.",
    "He has a remarkable ability to stay calm under pressure."
  ],
  "able": [
    "She was able to complete the marathon despite the difficult weather conditions.",
    "The new software enables users to edit videos more efficiently.",
    "I will be able to attend the meeting if it finishes before five o'clock."
  ],
  "accept": [
    "The university accepted her application for the graduate program.",
    "It can be difficult to accept criticism, but it often helps us grow.",
    "They kindly accepted our invitation to dinner."
  ],
  "achieve": [
    "Through hard work and dedication, she achieved her goal of becoming a doctor.",
    "The company achieved record profits this quarter.",
    "He achieved a perfect score on the examination."
  ],
  "believe": [
    "Scientists believe that the universe is constantly expanding.",
    "I believe that honesty is the most important quality in a person.",
    "She firmly believes in the power of education to change lives."
  ],
  "benefit": [
    "Regular exercise provides numerous health benefits, including improved cardiovascular function.",
    "The new policy will benefit employees by offering more flexible working hours.",
    "One of the main benefits of reading is that it expands your vocabulary."
  ],
  "beautiful": [
    "The sunset over the ocean was absolutely beautiful.",
    "She painted a beautiful landscape of the countryside.",
    "The garden was filled with beautiful flowers of every color."
  ],
  "change": [
    "Climate change is one of the most pressing issues facing our generation.",
    "She decided to change her career path after working in finance for ten years.",
    "The new manager implemented several positive changes in the workplace."
  ],
  "create": [
    "The artist used oil paints to create a stunning portrait.",
    "The new policy is intended to create more job opportunities for young people.",
    "She loves to create handmade gifts for her friends and family."
  ],
  "develop": [
    "The company is working to develop a new vaccine for the virus.",
    "It took several years to develop the necessary skills for the job.",
    "Warm temperatures and rainfall help crops develop properly."
  ],
  "discover": [
    "Alexander Fleming discovered penicillin in 1928.",
    "Scientists have discovered a new species of butterfly in the Amazon rainforest.",
    "She discovered a hidden talent for painting later in life."
  ],
  "education": [
    "Access to quality education is essential for personal and professional growth.",
    "She pursued her higher education at a prestigious university.",
    "The government increased funding for public education this year."
  ],
  "example": [
    "The teacher provided several examples to help the students understand the concept.",
    "This painting is a perfect example of Renaissance art.",
    "Can you give me an example of when you used this technique?"
  ],
  "explain": [
    "The professor explained the theory in a way that everyone could understand.",
    "Can you explain why this formula is important for solving the problem?",
    "She carefully explained the instructions to the new employees."
  ],
  "good": [
    "Eating a balanced diet is good for your overall health.",
    "She did a good job organizing the conference.",
    "There are many good reasons to start learning a second language."
  ],
  "help": [
    "Volunteers helped clean the park after the community event.",
    "The new software helps users manage their time more effectively.",
    "She offered to help her colleague finish the project on time."
  ],
  "important": [
    "It is important to stay hydrated during hot weather.",
    "Education plays an important role in shaping a child's future.",
    "This is an important meeting, so please arrive on time."
  ],
  "improve": [
    "Regular practice is the best way to improve your language skills.",
    "The new system is designed to improve efficiency in the workplace.",
    "She took a course to improve her public speaking abilities."
  ],
  "knowledge": [
    "A good scientist always seeks to expand their knowledge of the natural world.",
    "Her extensive knowledge of history made the lecture fascinating.",
    "The test measures students' knowledge of basic mathematics."
  ],
  "learn": [
    "Children learn best when they are engaged and curious.",
    "She learned to play the piano at the age of six.",
    "It is never too late to learn something new."
  ],
  "necessary": [
    "It is necessary to obtain a visa before traveling to certain countries.",
    "A good night's sleep is necessary for maintaining good health.",
    "The company made all the necessary arrangements for the conference."
  ],
  "opportunity": [
    "She viewed the internship as an excellent opportunity to gain experience.",
    "The scholarship gave him the opportunity to study abroad.",
    "Don't miss the opportunity to learn from experienced professionals."
  ],
  "positive": [
    "Maintaining a positive attitude can help you overcome challenges.",
    "The new policy had a positive impact on employee morale.",
    "She received positive feedback on her presentation."
  ],
  "possible": [
    "With enough effort, almost anything is possible.",
    "The scientists are exploring every possible solution to the problem.",
    "Is it possible to finish the report by tomorrow?"
  ],
  "practice": [
    "Regular practice is essential for mastering any skill.",
    "She practices the violin for an hour every day.",
    "The doctor's medical practice has been serving the community for over twenty years."
  ],
  "provide": [
    "The organization provides food and shelter for those in need.",
    "This book provides a comprehensive overview of the subject.",
    "The report provides evidence to support the new theory."
  ],
  "research": [
    "The university conducts groundbreaking research in renewable energy.",
    "Her research focuses on the effects of climate change on marine ecosystems.",
    "Scientists are conducting research to find a cure for the disease."
  ],
  "result": [
    "The results of the experiment confirmed the hypothesis.",
    "Hard work often results in success.",
    "The test results showed a significant improvement in student performance."
  ],
  "success": [
    "The success of the project depended on the teamwork of all members.",
    "She achieved great success in her career as an architect.",
    "Hard work and dedication are the keys to success."
  ],
  "suggest": [
    "The data suggests that the economy is improving.",
    "I suggest that we review the proposal before making a decision.",
    "Her doctor suggested that she get more exercise."
  ],
  "support": [
    "The community came together to support the local library.",
    "Her family has always supported her career choices.",
    "The bridge is supported by strong steel cables."
  ],
  "understand": [
    "It is important to understand the risks before making a decision.",
    "She understands the importance of regular exercise for health.",
    "The teacher helped the students understand the complex concept."
  ],
  "use": [
    "You can use this tool to cut wood more precisely.",
    "The recipe uses fresh ingredients for the best flavor.",
    "She used her knowledge of languages to work as a translator."
  ],
  "value": [
    "The value of a college education extends far beyond the classroom.",
    "Honesty is a value that should be taught from a young age.",
    "The antique vase was valued at over ten thousand dollars."
  ],
  "work": [
    "She works as a software engineer for a technology company.",
    "The new system works much more efficiently than the old one.",
    "They worked together to complete the project ahead of schedule."
  ],
  "worry": [
    "There is no need to worry about the test if you have studied thoroughly.",
    "She worried about her son's health while he was traveling abroad.",
    "Don't worry; everything will be fine."
  ],
  "write": [
    "She writes articles for a popular science magazine.",
    "He wrote a heartfelt letter to his grandmother.",
    "The author is writing a book about the history of aviation."
  ],
  "young": [
    "The young students were eager to learn about astronomy.",
    "She started playing the piano when she was very young.",
    "The young tree needs plenty of water and sunlight to grow."
  ]
};

/**
 * Strict quality check for example sentences.
 * Ensures the example is a complete, grammatical, family-friendly sentence.
 */
function isHighQualityExample(text, word) {
  if (!text || typeof text !== 'string') return false;
  
  const cleaned = text.trim();
  
  // Length constraints
  if (cleaned.length < 15 || cleaned.length > 350) return false;
  
  // Must contain the target word (case-insensitive)
  if (!cleaned.toLowerCase().includes(word.toLowerCase())) return false;
  
  // Must start with uppercase letter or opening quote
  if (!/^[A-Z"'']/.test(cleaned)) return false;
  
  // Must end with proper sentence punctuation
  if (!/[.!?]$/.test(cleaned)) return false;
  
  // Must not contain offensive language
  if (OFFENSIVE_PATTERNS.test(cleaned)) return false;
  
  // Must not contain slang/informal abbreviations
  if (SLANG_PATTERNS.test(cleaned)) return false;
  
  // Must not start with lowercase letters or incomplete fragments
  if (INCOMPLETE_PATTERNS.test(cleaned)) return false;
  
  // Must have at least 5 words (to filter out fragments)
  const wordCount = cleaned.split(/\s+/).length;
  if (wordCount < 5) return false;
  
  // Avoid sentences that look like URL fragments, code, or gibberish
  if (/https?:\/\/|www\.|[{}[\]<>]|^\d+[.)]/.test(cleaned)) return false;
  
  // Avoid sentences with too many special characters (likely low quality)
  const specialChars = (cleaned.match(/[^a-zA-Z0-9\s.,!?;:'"()-]/g) || []).length;
  if (specialChars > cleaned.length * 0.2) return false;
  
  return true;
}

/**
 * Clean example text: remove brackets, normalize whitespace, trim punctuation.
 */
function cleanExampleText(text) {
  if (!text) return '';
  let cleaned = text.replace(/\[([^\]]*)\]/g, '').trim();
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/^[\s,;:.!?\-]+|[\s,;:.!?\-]+$/g, '').trim();
  cleaned = cleaned.replace(/&nbsp;/g, ' ').trim();
  return cleaned;
}

/**
 * Fetch example sentences from Wiktionary by parsing the page HTML.
 * Reuses the existing Wiktionary API that already powers etymology.
 */
async function fetchWiktionaryExamples(word) {
  try {
    const url = 'https://en.wiktionary.org/w/api.php?action=parse&page=' + encodeURIComponent(word) + '&prop=text&format=json&origin=*';
    const response = await fetch(url);
    if (!response.ok) throw new Error('Wiktionary fetch failed');
    const data = await response.json();
    const html = data && data.parse && data.parse.text && data.parse.text['*'];
    if (!html) return [];

    const examples = [];
    
    // Look for ordered lists with example class
    const exampleListRegex = /<ol[^>]*class="[^"]*examples[^"]*"[^>]*>([\s\S]*?)<\/ol>/gi;
    let listMatch;
    while ((listMatch = exampleListRegex.exec(html)) !== null) {
      const listContent = listMatch[1];
      const itemRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      let itemMatch;
      while ((itemMatch = itemRegex.exec(listContent)) !== null) {
        const plain = itemMatch[1].replace(/<[^>]+>/g, '').trim();
        const decoded = plain.replace(/"/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&rsquo;/g, "'").replace(/&lsquo;/g, "'");
        if (decoded && decoded.length > 10) {
          const cleaned = decoded.replace(/^[\d.()a-zA-Z]+\.\s*/, '').trim();
          examples.push(cleaned);
        }
      }
    }

    // Also look for <blockquote> elements
    const quoteRegex = /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi;
    let quoteMatch;
    while ((quoteMatch = quoteRegex.exec(html)) !== null) {
      const plain = quoteMatch[1].replace(/<[^>]+>/g, '').trim();
      const decoded = plain.replace(/"/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&rsquo;/g, "'").replace(/&lsquo;/g, "'");
      if (decoded && decoded.length > 10) {
        examples.push(decoded);
      }
    }

    // Deduplicate and filter
    const seen = new Set();
    const uniqueExamples = [];
    for (const ex of examples) {
      const key = ex.toLowerCase().replace(/\s+/g, ' ');
      if (!seen.has(key) && isHighQualityExample(ex, word)) {
        seen.add(key);
        uniqueExamples.push(ex);
      }
    }

    return uniqueExamples.slice(0, 6);
  } catch (error) {
    console.warn('Wiktionary example fetch failed:', error);
    return [];
  }
}

/**
 * Get locally curated example sentences for a word, if available.
 */
function getCuratedExamples(word) {
  const key = word.toLowerCase().trim();
  const examples = CURATED_EXAMPLES[key];
  if (!examples || !Array.isArray(examples)) return [];
  return examples.filter(function(ex) { return isHighQualityExample(ex, word); });
}

/**
 * Generate a grammatically correct example sentence from the word's definition.
 * Used as a last resort when no other examples are available.
 */
function generateExampleFromDefinition(word, partOfSpeech, definition) {
  if (!definition) return null;
  
  var cleanDef = definition.replace(/^[a-z]+:\s*/i, '').trim();
  var lowerWord = word.toLowerCase();
  var isVerb = partOfSpeech === 'verb';
  var isNoun = partOfSpeech === 'noun';
  var isAdjective = partOfSpeech === 'adjective' || partOfSpeech === 'adj';
  var isAdverb = partOfSpeech === 'adverb';
  var sentence = '';

  if (isVerb) {
    var verbDef = cleanDef.replace(/^to\s+/i, '');
    var templates = [
      'To ' + lowerWord + ' means to ' + verbDef + '.',
      'Many people ' + lowerWord + ' ' + verbDef + '.',
      'She learned how to ' + lowerWord + ' ' + verbDef.toLowerCase() + '.'
    ];
    sentence = templates[Math.floor(Math.random() * templates.length)];
  } else if (isNoun) {
    var templates = [
      word + ' refers to ' + cleanDef + '.',
      'The concept of ' + lowerWord + ' is important in many fields.',
      'Experts have studied ' + lowerWord + ' extensively.'
    ];
    sentence = templates[Math.floor(Math.random() * templates.length)];
  } else if (isAdjective) {
    var templates = [
      'The ' + lowerWord + ' nature of the phenomenon was evident.',
      'This is considered a ' + lowerWord + ' example of the genre.',
      'The results were ' + lowerWord + ' according to the researchers.'
    ];
    sentence = templates[Math.floor(Math.random() * templates.length)];
  } else if (isAdverb) {
    var templates = [
      'The process ' + lowerWord + ' advanced over time.',
      'The results were ' + lowerWord + ' distributed across the sample.',
      'The system ' + lowerWord + ' adapts to changing conditions.'
    ];
    sentence = templates[Math.floor(Math.random() * templates.length)];
  } else {
    var a = /^[aeiou]/i.test(cleanDef) ? 'an' : 'a';
    var templates = [
      word + ' is defined as ' + a + ' ' + cleanDef + '.',
      'The term "' + word + '" describes ' + cleanDef + '.',
      'In general, ' + lowerWord + ' refers to ' + cleanDef + '.'
    ];
    sentence = templates[Math.floor(Math.random() * templates.length)];
  }

  // Ensure proper capitalization and punctuation
  sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
  if (!/[.!?]$/.test(sentence)) sentence += '.';
  
  return sentence;
}

/**
 * Main entry point: fetch high-quality example sentences for a word.
 * Uses multiple sources in order of preference and applies strict quality filters.
 */
async function fetchHighQualityExamples(word, entry) {
  var allExamples = [];

  // Source 1: Dictionary API built-in examples (already filtered by the API)
  if (entry && entry.meanings) {
    for (var mi = 0; mi < entry.meanings.length; mi++) {
      var meaning = entry.meanings[mi];
      for (var di = 0; di < meaning.definitions.length; di++) {
        var def = meaning.definitions[di];
        if (def.example && isHighQualityExample(def.example, word)) {
          allExamples.push({ text: def.example, source: 'dictionary' });
        }
      }
    }
  }

  // Source 2: Wiktionary examples (professional, cited)
  if (allExamples.length < 4) {
    try {
      var wiktionaryExamples = await fetchWiktionaryExamples(word);
      for (var ei = 0; ei < wiktionaryExamples.length; ei++) {
        if (allExamples.length < 6) {
          allExamples.push({ text: wiktionaryExamples[ei], source: 'wiktionary' });
        }
      }
    } catch (e) {
      console.warn('Wiktionary fetch failed:', e);
    }
  }

  // Source 3: Curated embedded examples
  if (allExamples.length < 3) {
    var curated = getCuratedExamples(word);
    for (var ci = 0; ci < curated.length; ci++) {
      if (allExamples.length < 6) {
        allExamples.push({ text: curated[ci], source: 'curated' });
      }
    }
  }

  // Source 4: Definition-based template generation (last resort)
  if (allExamples.length === 0 && entry && entry.meanings && entry.meanings.length > 0) {
    var firstMeaning = entry.meanings[0];
    var firstDef = firstMeaning.definitions[0];
    var generated = generateExampleFromDefinition(word, firstMeaning.partOfSpeech, firstDef.definition);
    if (generated && isHighQualityExample(generated, word)) {
      allExamples.push({ text: generated, source: 'generated' });
    }
  }

  // Deduplicate and return just the text strings
  var seen = {};
  var result = [];
  for (var i = 0; i < allExamples.length; i++) {
    var key = allExamples[i].text.toLowerCase().replace(/\s+/g, ' ').trim();
    if (!seen[key]) {
      seen[key] = true;
      result.push(allExamples[i].text);
    }
  }
  
  return result.slice(0, 8);
}

