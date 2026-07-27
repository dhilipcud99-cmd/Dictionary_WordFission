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
const GOOGLE_TRANSLATE_API = 'https://translate.googleapis.com/translate_a/single';
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

const PRE_TRANSLATED_UI = {
  'fr': {
    'Discover meanings, pronunciation, etymology, and examples for any word': 'Découvrez les significations, la prononciation, l\'étymologie et les exemples pour n\'importe quel mot',
    'Filter languages...': 'Filtrer les langues...',
    'Search for any word': 'Rechercher n\'importe quel mot',
    'Search for any word...': 'Rechercher n\'importe quel mot...',
    'Search': 'Rechercher',
    'Recent Searches': 'Recherches récentes',
    'No recent searches': 'Aucune recherche récente',
    'Bookmarked Words': 'Mots favoris',
    'No bookmarked words': 'Pas de mots marqués d\'un signet',
    '© 2025 WordFission. Enhance your vocabulary every day.': '© 2025 WordFission. Améliorez votre vocabulaire tous les jours.',
    'Loading definition...': 'Chargement de la définition...',
    'Unable to find': 'Impossible de trouver',
    'Try another word.': 'Essayez un autre mot.',
    'No definitions available for': 'Aucune définition disponible pour',
    'Etymology & Word Origin': 'Étymologie et origine des mots',
    'ORIGIN LANGUAGE(S)': 'LANGUE(S) D\'ORIGINE',
    'ROOT WORD(S) & MEANINGS': 'MOT(S) RACINE(S) & SIGNIFICATIONS',
    'Roots and meanings not detailed in database': 'Racines et significations non détaillées dans la base de données',
    'WORD EVOLUTION PATH': 'CHEMIN D\'ÉVOLUTION DU MOT',
    'HOW MEANING CHANGED OVER TIME': 'COMMENT LE SENS A CHANGÉ AU FIL DU TEMPS',
    'PRESENT-DAY MEANING': 'SIGNIFICATION ACTUELLE',
    'CORE IDEA': 'IDÉE CENTRALE',
    'Core idea: reference definition for meanings and usage.': 'Idée centrale : définition de référence pour les significations et l\'usage.',
    'More details at': 'Plus de détails sur',
    'Etymonline': 'Etymonline',
    'More words': 'Plus de mots',
    'Synonyms:': 'Synonymes :',
    'Antonyms:': 'Antonymes :',
    'Example sentences from another source': 'Exemples de phrases d\'une autre source',
    'No sentence example available for this word.': 'Aucun exemple de phrase disponible pour ce mot.',
    'More sentence examples on': 'Plus d\'exemples de phrases sur',
    'SentenceDict': 'SentenceDict',
    'Thesaurus.com': 'Thesaurus.com',
    'Longman Dictionary': 'Dictionnaire Longman',
    'Collins Dictionary': 'Dictionnaire Collins'
  },
  'es': {
    'Discover meanings, pronunciation, etymology, and examples for any word': 'Descubra significados, pronunciación, etimología y ejemplos de cualquier palabra',
    'Filter languages...': 'Filtrar idiomas...',
    'Search for any word': 'Buscar cualquier palabra',
    'Search for any word...': 'Buscar cualquier palabra...',
    'Search': 'Buscar',
    'Recent Searches': 'Búsquedas recientes',
    'No recent searches': 'No hay búsquedas recientes',
    'Bookmarked Words': 'Palabras marcadas',
    'No bookmarked words': 'No hay palabras marcadas',
    '© 2025 WordFission. Enhance your vocabulary every day.': '© 2025 WordFission. Mejore su vocabulario todos los días.',
    'Loading definition...': 'Cargando definición...',
    'Unable to find': 'No se pudo encontrar',
    'Try another word.': 'Intente con otra palabra.',
    'No definitions available for': 'No hay definiciones disponibles para',
    'Etymology & Word Origin': 'Etimología y origen de la palabra',
    'ORIGIN LANGUAGE(S)': 'IDIOMA(S) DE ORIGEN',
    'ROOT WORD(S) & MEANINGS': 'PALABRA(S) RAÍZ Y SIGNIFICADOS',
    'Roots and meanings not detailed in database': 'Raíces y significados no detallados en la base de datos',
    'WORD EVOLUTION PATH': 'RUTA DE EVOLUCIÓN DE LA PALABRA',
    'HOW MEANING CHANGED OVER TIME': 'CÓMO CAMBIÓ EL SIGNIFICADO CON EL TIEMPO',
    'PRESENT-DAY MEANING': 'SIGNIFICADO ACTUAL',
    'CORE IDEA': 'IDEA CENTRAL',
    'Core idea: reference definition for meanings and usage.': 'Idea central: definición de referencia para significados y uso.',
    'More details at': 'Más detalles en',
    'Etymonline': 'Etymonline',
    'More words': 'Más palabras',
    'Synonyms:': 'Sinónimos:',
    'Antonyms:': 'Antónimos:',
    'Example sentences from another source': 'Frases de ejemplo de otra fuente',
    'No sentence example available for this word.': 'No hay frases de ejemplo disponibles para esta palabra.',
    'More sentence examples on': 'Más ejemplos de frases en',
    'SentenceDict': 'SentenceDict',
    'Thesaurus.com': 'Thesaurus.com',
    'Longman Dictionary': 'Diccionario Longman',
    'Collins Dictionary': 'Diccionario Collins'
  },
  'de': {
    'Discover meanings, pronunciation, etymology, and examples for any word': 'Entdecken Sie Bedeutungen, Aussprache, Etymologie und Beispiele für jedes Wort',
    'Filter languages...': 'Sprachen filtern...',
    'Search for any word': 'Nach jedem Wort suchen',
    'Search for any word...': 'Nach jedem Wort suchen...',
    'Search': 'Suchen',
    'Recent Searches': 'Letzte Suchen',
    'No recent searches': 'Keine letzten Suchen',
    'Bookmarked Words': 'Lesezeichen',
    'No bookmarked words': 'Keine Lesezeichen vorhanden',
    '© 2025 WordFission. Enhance your vocabulary every day.': '© 2025 WordFission. Verbessern Sie täglich Ihren Wortschatz.',
    'Loading definition...': 'Definition wird geladen...',
    'Unable to find': 'Nicht gefunden',
    'Try another word.': 'Versuchen Sie ein anderes Wort.',
    'No definitions available for': 'Keine Definitionen verfügbar für',
    'Etymology & Word Origin': 'Etymologie & Wortursprung',
    'ORIGIN LANGUAGE(S)': 'URSPRUNGSSPRACHE(N)',
    'ROOT WORD(S) & MEANINGS': 'WURZELWORT(E) & BEDEUTUNGEN',
    'Roots and meanings not detailed in database': 'Wurzeln und Bedeutungen in der Datenbank nicht detailliert',
    'WORD EVOLUTION PATH': 'WORTENTWICKLUNGSPFAD',
    'HOW MEANING CHANGED OVER TIME': 'WIE SICH DIE BEDEUTUNG IM LAUFE DER ZEIT VERÄNDERT HAT',
    'PRESENT-DAY MEANING': 'HEUTIGE BEDEUTUNG',
    'CORE IDEA': 'KERNGEDANKE',
    'Core idea: reference definition for meanings and usage.': 'Kerngedanke: Referenzdefinition für Bedeutungen und Verwendung.',
    'More details at': 'Mehr Details unter',
    'Etymonline': 'Etymonline',
    'More words': 'Mehr Wörter',
    'Synonyms:': 'Synonyme:',
    'Antonyms:': 'Antonyme:',
    'Example sentences from another source': 'Beispielsätze aus einer anderen Quelle',
    'No sentence example available for this word.': 'Kein Satzbeispiel für dieses Wort verfügbar.',
    'More sentence examples on': 'Mehr Beispielsätze auf',
    'SentenceDict': 'SentenceDict',
    'Thesaurus.com': 'Thesaurus.com',
    'Longman Dictionary': 'Longman Dictionary',
    'Collins Dictionary': 'Collins Dictionary'
  },
  'ja': {
    'Discover meanings, pronunciation, etymology, and examples for any word': 'あらゆる単語の意味、発音、語源、用法例を見つける',
    'Filter languages...': '言語を絞り込む...',
    'Search for any word': '単語を検索する',
    'Search for any word...': '単語を検索...',
    'Search': '検索',
    'Recent Searches': '最近の検索履歴',
    'No recent searches': '検索履歴はありません',
    'Bookmarked Words': 'ブックマークした単語',
    'No bookmarked words': 'ブックマークした単語はありません',
    '© 2025 WordFission. Enhance your vocabulary every day.': '© 2025 WordFission. 毎日語彙力を高めましょう。',
    'Loading definition...': '定義を読み込み中...',
    'Unable to find': '見つかりません',
    'Try another word.': '別の単語を試してください。',
    'No definitions available for': '定義が見つかりませんでした：',
    'Etymology & Word Origin': '語源と単語の起源',
    'ORIGIN LANGUAGE(S)': '起源言語',
    'ROOT WORD(S) & MEANINGS': '語根と意味',
    'Roots and meanings not detailed in database': 'データベースに詳細がありません',
    'WORD EVOLUTION PATH': '単語の変遷',
    'HOW MEANING CHANGED OVER TIME': '意味の変遷',
    'PRESENT-DAY MEANING': '現在の意味',
    'CORE IDEA': '核心的な概念',
    'Core idea: reference definition for meanings and usage.': '核心概念：意味と用法の基準定義。',
    'More details at': '詳細はこちら：',
    'Etymonline': 'Etymonline',
    'More words': '関連単語',
    'Synonyms:': '類義語:',
    'Antonyms:': '対義語:',
    'Example sentences from another source': '他のソースからの例文',
    'No sentence example available for this word.': 'この単語の例文はありません。',
    'More sentence examples on': '詳細な例文はこちら：',
    'SentenceDict': 'SentenceDict',
    'Thesaurus.com': 'Thesaurus.com',
    'Longman Dictionary': 'ロングマン現代英英辞典',
    'Collins Dictionary': 'コリンズ英語辞典'
  },
  'zh-CN': {
    'Discover meanings, pronunciation, etymology, and examples for any word': '探索任何单词的含义、发音、词源和例句',
    'Filter languages...': '筛选语言...',
    'Search for any word': '搜索任何单词',
    'Search for any word...': '搜索任何单词...',
    'Search': '搜索',
    'Recent Searches': '最近搜索',
    'No recent searches': '暂无搜索历史',
    'Bookmarked Words': '已收藏单词',
    'No bookmarked words': '暂无收藏单词',
    '© 2025 WordFission. Enhance your vocabulary every day.': '© 2025 WordFission. 每天扩大您的词汇量。',
    'Loading definition...': '正在加载定义...',
    'Unable to find': '未找到',
    'Try another word.': '尝试其他单词。',
    'No definitions available for': '没有可用的定义：',
    'Etymology & Word Origin': '词源与单词起源',
    'ORIGIN LANGUAGE(S)': '起源语言',
    'ROOT WORD(S) & MEANINGS': '词根与含义',
    'Roots and meanings not detailed in database': '数据库中未详述词根和含义',
    'WORD EVOLUTION PATH': '单词演变路径',
    'HOW MEANING CHANGED OVER TIME': '含义随时间的变化',
    'PRESENT-DAY MEANING': '现代含义',
    'CORE IDEA': '核心概念',
    'Core idea: reference definition for meanings and usage.': '核心概念：词义和用法的参考定义。',
    'More details at': '更多详情请见',
    'Etymonline': '在线词源字典',
    'More words': '更多单词',
    'Synonyms:': '同义词:',
    'Antonyms:': '反义词:',
    'Example sentences from another source': '来自其他来源的例句',
    'No sentence example available for this word.': '该单词暂无可用例句。',
    'More sentence examples on': '更多例句请访问',
    'SentenceDict': 'SentenceDict',
    'Thesaurus.com': 'Thesaurus.com',
    'Longman Dictionary': '朗文当代英语辞典',
    'Collins Dictionary': '柯林斯英语词典'
  },
  'ar': {
    'Discover meanings, pronunciation, etymology, and examples for any word': 'اكتشف المعاني والنطق والاشتقاق والأمثلة لأي كلمة',
    'Filter languages...': 'تصفية اللغات...',
    'Search for any word': 'ابحث عن أي كلمة',
    'Search for any word...': 'ابحث عن أي كلمة...',
    'Search': 'بحث',
    'Recent Searches': 'عمليات البحث الأخيرة',
    'No recent searches': 'لا توجد عمليات بحث أخيرة',
    'Bookmarked Words': 'الكلمات المحفوظة',
    'No bookmarked words': 'لا توجد كلمات محفوظة',
    '© 2025 WordFission. Enhance your vocabulary every day.': '© 2025 WordFission. عزز مفرداتك كل يوم.',
    'Loading definition...': 'جاري تحميل التعريف...',
    'Unable to find': 'تعذر العثور على',
    'Try another word.': 'جرّب كلمة أخرى.',
    'No definitions available for': 'لا تتوفر تعريفات لـ',
    'Etymology & Word Origin': 'اشتقاق الكلمة وأصلها',
    'ORIGIN LANGUAGE(S)': 'اللغة (اللغات) الأصلية',
    'ROOT WORD(S) & MEANINGS': 'جذر الكلمة والمعاني',
    'Roots and meanings not detailed in database': 'الجذور والمعاني غير مفصلة في قاعدة البيانات',
    'WORD EVOLUTION PATH': 'مسار تطور الكلمة',
    'HOW MEANING CHANGED OVER TIME': 'كيف تغير المعنى بمرور الوقت',
    'PRESENT-DAY MEANING': 'المعنى الحالي',
    'CORE IDEA': 'الفكرة المحورية',
    'Core idea: reference definition for meanings and usage.': 'الفكرة المحورية: التعريف المرجعي للمعاني والاستخدام.',
    'More details at': 'مزيد من التفاصيل في',
    'Etymonline': 'قاموس أصول الكلمات',
    'More words': 'مزيد من الكلمات',
    'Synonyms:': 'المرادفات:',
    'Antonyms:': 'المتضادات:',
    'Example sentences from another source': 'جمل أمثلة من مصدر آخر',
    'No sentence example available for this word.': 'لا يوجد مثال جملة متاح لهذه الكلمة.',
    'More sentence examples on': 'مزيد من الأمثلة على',
    'SentenceDict': 'SentenceDict',
    'Thesaurus.com': 'Thesaurus.com',
    'Longman Dictionary': 'قاموس لونجمان',
    'Collins Dictionary': 'قاموس كولينز'
  },
  'ta': {
    'Discover meanings, pronunciation, etymology, and examples for any word': 'எந்தவொரு வார்த்தைக்கும் அர்த்தங்கள், உச்சరిப்பு, சொற்பிறப்பியல் மற்றும் எடுத்துக்காட்டுகளைக் கண்டறியவும்',
    'Filter languages...': 'மொழிகளை வடிகட்டவும்...',
    'Search for any word': 'எந்த வார்த்தையையும் தேடுங்கள்',
    'Search for any word...': 'எந்த வார்த்தையையும் தேடுங்கள்...',
    'Search': 'தேடு',
    'Recent Searches': 'சமீபத்திய தேடல்கள்',
    'No recent searches': 'சமீபத்திய தேடல்கள் எதுவும் இல்லை',
    'Bookmarked Words': 'குறிக்கப்பட்ட வார்த்தைகள்',
    'No bookmarked words': 'குறிக்கப்பட்ட வார்த்தைகள் எதுவும் இல்லை',
    '© 2025 WordFission. Enhance your vocabulary every day.': '© 2025 WordFission. ஒவ்வொரு நாளும் உங்கள் சொல்லகராதியை மேம்படுத்துங்கள்.',
    'Loading definition...': 'வரையறை ஏற்றப்படுகிறது...',
    'Unable to find': 'கಂಡறிய முடியவில்லை',
    'Try another word.': 'வேறொரு வார்த்தையை முயற்சிக்கவும்.',
    'No definitions available for': 'இதற்கான வரையறைகள் எதுவும் இல்லை',
    'Etymology & Word Origin': 'சொற்பிறப்பியல் & வார்த்தை தோற்றம்',
    'ORIGIN LANGUAGE(S)': 'மூல மொழி(கள்)',
    'ROOT WORD(S) & MEANINGS': 'வேர் சொல்(கள்) & அர்த்தங்கள்',
    'Roots and meanings not detailed in database': 'தரவுத்தளத்தில் வேர்கள் மற்றும் அர்த்தங்கள் விரிவாக இல்லை',
    'WORD EVOLUTION PATH': 'வார்த்தை பரிணாம பாதை',
    'HOW MEANING CHANGED OVER TIME': 'காலப்போக்கில் அர்த்தம் எவ்வாறு மாறியது',
    'PRESENT-DAY MEANING': 'இன்றைய அர்த்தம்',
    'CORE IDEA': 'முக்கிய கருத்து',
    'Core idea: reference definition for meanings and usage.': 'முக்கிய கருத்து: அர்த்தங்கள் மற்றும் பயன்பாட்டிற்கான குறிப்பு வரையறை.',
    'More details at': 'மேலும் விவரங்கள்',
    'Etymonline': 'Etymonline',
    'More words': 'கூடுதல் வார்த்தைகள்',
    'Synonyms:': 'இணைச்சொற்கள்:',
    'Antonyms:': 'எதிர்ச்சொற்கள்:',
    'Example sentences from another source': 'மற்றொரு மூலத்திலிருந்து எடுத்துக்காட்டு வாக்கியங்கள்',
    'No sentence example available for this word.': 'இந்த வார்த்தைக்கு வாக்கிய உதாரணம் எதுவும் இல்லை.',
    'More sentence examples on': 'மேலும் வாக்கிய உதாரணங்கள்',
    'SentenceDict': 'SentenceDict',
    'Thesaurus.com': 'Thesaurus.com',
    'Longman Dictionary': 'லாங்மேன் அகராதி',
    'Collins Dictionary': 'கோலின்ஸ் அகராதி'
  },
  'hi': {
    'Discover meanings, pronunciation, etymology, and examples for any word': 'किसी भी शब्द के अर्थ, उच्चारण, व्युत्पत्ति और उदाहरण खोजें',
    'Filter languages...': 'भाषाएँ फ़िल्टर करें...',
    'Search for any word': 'कोई भी शब्द खोजें',
    'Search for any word...': 'कोई भी शब्द खोजें...',
    'Search': 'खोजें',
    'Recent Searches': 'हाल की खोजें',
    'No recent searches': 'कोई हाल की खोज नहीं',
    'Bookmarked Words': 'पसंदीदा शब्द',
    'No bookmarked words': 'कोई पसंदीदा शब्द नहीं',
    '© 2025 WordFission. Enhance your vocabulary every day.': '© 2025 WordFission. हर दिन अपनी शब्दावली बढ़ाएं।',
    'Loading definition...': 'परिभाषा लोड हो रही है...',
    'Unable to find': 'खोजने में असमर्थ',
    'Try another word.': 'दूसरा शब्द आज़माएं।',
    'No definitions available for': 'इसके लिए कोई परिभाषा उपलब्ध नहीं है',
    'Etymology & Word Origin': 'व्युत्पत्ति और शब्द की उत्पत्ति',
    'ORIGIN LANGUAGE(S)': 'मूल भाषा (भाषाएँ)',
    'ROOT WORD(S) & MEANINGS': 'मूल शब्द और अर्थ',
    'Roots and meanings not detailed in database': 'डेटाबेस में मूल और अर्थ विस्तृत नहीं हैं',
    'WORD EVOLUTION PATH': 'शब्द विकास पथ',
    'HOW MEANING CHANGED OVER TIME': 'समय के साथ अर्थ कैसे बदला',
    'PRESENT-DAY MEANING': 'वर्तमान अर्थ',
    'CORE IDEA': 'मुख्य विचार',
    'Core idea: reference definition for meanings and usage.': 'मुख्य विचार: अर्थ और उपयोग के लिए संदर्भ परिभाषा।',
    'More details at': 'अधिक विवरण',
    'Etymonline': 'Etymonline',
    'More words': 'और शब्द',
    'Synonyms:': 'पर्यायवाची:',
    'Antonyms:': 'विलोम शब्द:',
    'Example sentences from another source': 'दूसरे स्रोत से उदाहरण वाक्य',
    'No sentence example available for this word.': 'इस शब्द के लिए कोई उदाहरण वाक्य उपलब्ध नहीं है।',
    'More sentence examples on': 'अधिक उदाहरण वाक्य',
    'SentenceDict': 'SentenceDict',
    'Thesaurus.com': 'Thesaurus.com',
    'Longman Dictionary': 'लॉन्गमेन डिक्शनरी',
    'Collins Dictionary': 'कोलिन डिक्शनरी'
  },
  'te': {
    'Discover meanings, pronunciation, etymology, and examples for any word': 'ఏదైనా పదానికి అర్థాలు, உச்சరింపు, వ్యుత్పత్తి మరియు ఉదాహరణలను కనుగొనండి',
    'Filter languages...': 'భాషలను ఫిల్టర్ చేయండి...',
    'Search for any word': 'ఏదైనా పదం కోసం వెతకండి',
    'Search for any word...': 'ఏదైనా పదం కోసం వెతకండి...',
    'Search': 'వెతుకు',
    'Recent Searches': 'సమీపకాల శోధనలు',
    'No recent searches': 'సమీపకాల శోధనలు ఏవీ లేవు',
    'Bookmarked Words': 'బుక్‌మార్క్ చేసిన పదాలు',
    'No bookmarked words': 'బుక్‌మార్క్ చేసిన పదాలు ఏవీ లేవు',
    '© 2025 WordFission. Enhance your vocabulary every day.': '© 2025 WordFission. ప్రతిరోజూ మీ పదజాలాన్ని మెరుగుపరచుకోండి.',
    'Loading definition...': 'అర్థం లోడ్ అవుతోంది...',
    'Unable to find': 'కనుగొనలేకపోయాము',
    'Try another word.': 'మరొక పదాన్ని ప్రయత్నించండి.',
    'No definitions available for': 'దీనికి అర్థాలు అందుబాటులో లేవు',
    'Etymology & Word Origin': 'వ్యుత్పత్తి & పద మూలం',
    'ORIGIN LANGUAGE(S)': 'మూల భాష(లు)',
    'ROOT WORD(S) & MEANINGS': 'మూల పదం(పదాలు) & అర్థాలు',
    'Roots and meanings not detailed in database': 'డేటాబేస్ లో మూలాలు మరియు అర్థాలు వివరంగా లేవు',
    'WORD EVOLUTION PATH': 'పద పరిణామ మార్గం',
    'HOW MEANING CHANGED OVER TIME': 'కాలక్రమేణా అర్థం ఎలా మారింది',
    'PRESENT-DAY MEANING': 'ప్రస్తుత అర్థం',
    'CORE IDEA': 'ప్రధాన ఆలోచన',
    'Core idea: reference definition for meanings and usage.': 'ప్రధాన ఆలోచన: అర్థాలు మరియు వినియోగం కోసం సూచన అర్థం.',
    'More details at': 'మరిన్ని వివరాలు ఇక్కడ',
    'Etymonline': 'Etymonline',
    'More words': 'మరిన్ని పదాలు',
    'Synonyms:': 'పర్యాయపదాలు:',
    'Antonyms:': 'వ్యతిరేక పదాలు:',
    'Example sentences from another source': 'మరొక మూలం నుండి ఉదాహరణ వాక్యాలు',
    'No sentence example available for this word.': 'ఈ పదానికి ఉదాహరణ వాక్యం అందుబాటులో లేదు.',
    'More sentence examples on': 'మరిన్ని ఉదాహరణ వాక్యాలు ఇక్కడ',
    'SentenceDict': 'SentenceDict',
    'Thesaurus.com': 'Thesaurus.com',
    'Longman Dictionary': 'లాంగ్‌మన్ డిక్షనరీ',
    'Collins Dictionary': 'కోలిన్స్ డిక్షనరీ'
  },
  'ml': {
    'Discover meanings, pronunciation, etymology, and examples for any word': 'ഏതൊരു വാക്കിന്റെയും അർത്ഥങ്ങൾ, ഉച്ചാരണം, ഉത്ഭവം, ഉദാഹരണങ്ങൾ എന്നിവ കണ്ടെത്തുക',
    'Filter languages...': 'ഭാഷകൾ ഫിൽട്ടർ ചെയ്യുക...',
    'Search for any word': 'ഏതെങ്കിലും വാക്ക് തിരയുക',
    'Search for any word...': 'ഏതെങ്കിലും വാക്ക് തിരയുക...',
    'Search': 'തിരയുക',
    'Recent Searches': 'സമീപകാല തിരച്ചിലുകൾ',
    'No recent searches': 'സമീപകാല തിരച്ചിലുകൾ ഒന്നുമില്ല',
    'Bookmarked Words': 'ബുക്ക്മാർക്ക് ചെയ്ത വാക്കുകൾ',
    'No bookmarked words': 'ബുക്ക്മാർക്ക് ചെയ്ത വാക്കുകൾ ഒന്നുമില്ല',
    '© 2025 WordFission. Enhance your vocabulary every day.': '© 2025 WordFission. എല്ലാ ദിവസവും നിങ്ങളുടെ പദാവലി മെച്ചപ്പെടുത്തുക.',
    'Loading definition...': 'അർത്ഥം ലോഡ് ചെയ്യുന്നു...',
    'Unable to find': 'കണ്ടെത്താനായില്ല',
    'Try another word.': 'മറ്റൊരു വാക്ക് ശ്രമിക്കുക.',
    'No definitions available for': 'ഇതിന് നിർവചനങ്ങൾ ലഭ്യമല്ല',
    'Etymology & Word Origin': 'പദോൽപ്പത്തിയും വാക്കിന്റെ ഉത്ഭവവും',
    'ORIGIN LANGUAGE(S)': 'ഉത്ഭവ ഭാഷ(കൾ)',
    'ROOT WORD(S) & MEANINGS': 'അടിസ്ഥാന വാക്കും അർത്ഥങ്ങളും',
    'Roots and meanings not detailed in database': 'ഡാറ്റാബേസിൽ വിവരങ്ങൾ ലഭ്യമല്ല',
    'WORD EVOLUTION PATH': 'വാക്കിന്റെ പരിണാമ പാത',
    'HOW MEANING CHANGED OVER TIME': 'കാലക്രമേണ അർത്ഥം എങ്ങനെ മാറി',
    'PRESENT-DAY MEANING': 'ഇന്നത്തെ അർത്ഥം',
    'CORE IDEA': 'പ്രധാന ആശയം',
    'Core idea: reference definition for meanings and usage.': 'പ്രധാന ആശയം: അർത്ഥങ്ങൾക്കും ഉപയോഗത്തിനുമുള്ള റഫറൻസ് നിർവചനം.',
    'More details at': 'കൂടുതൽ വിവരങ്ങൾക്ക്',
    'Etymonline': 'Etymonline',
    'More words': 'കൂടുതൽ വാക്കുകൾ',
    'Synonyms:': 'പര്യായപദങ്ങൾ:',
    'Antonyms:': 'വിപരീതപദങ്ങൾ:',
    'Example sentences from another source': 'മറ്റൊരു സ്രോതസ്സിൽ നിന്നുള്ള ഉദാഹരണ വാക്യങ്ങൾ',
    'No sentence example available for this word.': 'ഈ വാക്കിന് ഉദാഹരണ വാക്യങ്ങൾ ലഭ്യമല്ല.',
    'More sentence examples on': 'കൂടുതൽ ഉദാഹരണങ്ങൾ കാണുക',
    'SentenceDict': 'SentenceDict',
    'Thesaurus.com': 'Thesaurus.com',
    'Longman Dictionary': 'ലോംഗ്മാൻ നിഘണ്ടു',
    'Collins Dictionary': 'കോളിൻസ് നിഘണ്ടു'
  },
  'kn': {
    'Discover meanings, pronunciation, etymology, and examples for any word': 'ಯಾವುದೇ ಪದದ ಅರ್ಥಗಳು, ಉಚ್ಚಾರಣೆ, ವ್ಯುತ್ಪತ್ತಿ ಮತ್ತು ಉದಾಹರಣೆಗಳನ್ನು ಅನ್ವೇಷಿಸಿ',
    'Filter languages...': 'ಭಾಷೆಗಳನ್ನು ಫಿಲ್ಟರ್ ಮಾಡಿ...',
    'Search for any word': 'ಯಾವುದೇ ಪದವನ್ನು ಹುಡುಕಿ',
    'Search for any word...': 'ಯಾವುದೇ ಪದವನ್ನು ಹುಡುಕಿ...',
    'Search': 'ಹುಡುಕು',
    'Recent Searches': 'ಇತ್ತೀಚಿನ ಹುಡುಕಾಟಗಳು',
    'No recent searches': 'ಯಾವುದೇ ಇತ್ತೀಚಿನ ಹುಡುಕಾಟಗಳಿಲ್ಲ',
    'Bookmarked Words': 'ಬುಕ್‌ಮಾರ್ಕ್ ಮಾಡಿದ ಪದಗಳು',
    'No bookmarked words': 'ಯಾವುದೇ ಬುಕ್‌ಮาร์ಕ್ ಮಾಡಿದ ಪದಗಳಿಲ್ಲ',
    '© 2025 WordFission. Enhance your vocabulary every day.': '© 2025 WordFission. ಪ್ರತಿದಿನ ನಿಮ್ಮ ಶಬ್ದಕೋಶವನ್ನು ಹೆಚ್ಚಿಸಿಕೊಳ್ಳಿ.',
    'Loading definition...': 'ಅರ್ಥವನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...',
    'Unable to find': 'ಹುಡುಕಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ',
    'Try another word.': 'ಮತ್ತೊಂದು ಪದವನ್ನು ಪ್ರಯತ್ನಿಸಿ.',
    'No definitions available for': 'ಇದಕ್ಕೆ ಯಾವುದೇ ಅರ್ಥಗಳು ಲಭ್ಯವಿಲ್ಲ',
    'Etymology & Word Origin': 'ವ್ಯುತ್ಪತ್ತಿ ಮತ್ತು ಪದದ ಮೂಲ',
    'ORIGIN LANGUAGE(S)': 'ಮೂಲ ಭಾಷೆ(ಗಳು)',
    'ROOT WORD(S) & MEANINGS': 'ಮೂಲ ಪದ(ಗಳು) ಮತ್ತು ಅರ್ಥಗಳು',
    'Roots and meanings not detailed in database': 'ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ಮೂಲಗಳು ಮತ್ತು ಅರ್ಥಗಳ ವಿವರಗಳಿಲ್ಲ',
    'WORD EVOLUTION PATH': 'ಪದದ ವಿಕಾಸ ಮಾರ್ಗ',
    'HOW MEANING CHANGED OVER TIME': 'ಸಮಯದೊಂದಿಗೆ ಅರ್ಥ ಹೇಗೆ ಬದಲಾಯಿತು',
    'PRESENT-DAY MEANING': 'ಪ್ರಸ್ತುತ ಅರ್ಥ',
    'CORE IDEA': 'ಮುಖ್ಯ ಕಲ್ಪನೆ',
    'Core idea: reference definition for meanings and usage.': 'ಮುಖ್ಯ ಕಲ್ಪನೆ: ಅರ್ಥಗಳು ಮತ್ತು ಬಳಕೆಗೆ ಉಲ್ಲೇಖ ವ್ಯಾಖ್ಯಾನ.',
    'More details at': 'ಹೆಚ್ಚಿನ ವಿವರಗಳಿಗಾಗಿ',
    'Etymonline': 'Etymonline',
    'More words': 'ಇನ್ನಷ್ಟು ಪದಗಳು',
    'Synonyms:': 'ಸಮಾನಾರ್ಥಕ ಪದಗಳು:',
    'Antonyms:': 'ವಿರುದ್ಧ ಪದಗಳು:',
    'Example sentences from another source': 'ಮತ್ತೊಂದು ಮೂಲದಿಂದ ಉದಾಹరణ ವಾಕ್ಯಗಳು',
    'No sentence example available for this word.': 'ಈ ಪದಕ್ಕೆ ಯಾವುದೇ ಉದಾಹരണ ವಾಕ್ಯಗಳು ಲಭ್ಯವಿಲ್ಲ.',
    'More sentence examples on': 'ಹೆಚ್ಚಿನ ಉದಾಹരണ ವಾಕ್ಯಗಳು ಇಲ್ಲಿವೆ',
    'SentenceDict': 'SentenceDict',
    'Thesaurus.com': 'Thesaurus.com',
    'Longman Dictionary': 'ಲಾಂಗ್‌ಮನ್ ನಿಘಂಟು',
    'Collins Dictionary': 'ಕೋಲಿನ್ಸ್ ನಿಘಂಟು'
  }
};

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
    const raw = (payload.list || [])
      .map((item) => item.example)
      .filter(Boolean);
    const examples = raw
      .map((text) => cleanExampleText(text))
      .filter(Boolean)
      .filter((text) => !isOffensive(text))
      .filter((text) => isValidExample(text, word))
      .map((text) => text.replace(/\r\n|\r/g, '\n').trim());
    return [...new Set(examples)].slice(0, 8);
  } catch (error) {
    console.warn(error);
    return [];
  }
}

const OFFENSIVE_PATTERNS = /\b(fuck|shit|bitch|dick|cock|piss|slut|whore|bastard|damn|crap|asshole|motherfuck|nigger|nigga|porn|sex\s*(?:tape|toys?|shop)|xxx)\b/i;

function cleanExampleText(text) {
  if (!text) return '';
  let cleaned = text.replace(/\[([^\]]*)\]/g, '').trim();
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/^[\s,;:.!?\-]+|[\s,;:.!?\-]+$/g, '').trim();
  return cleaned;
}

function isOffensive(text) {
  return OFFENSIVE_PATTERNS.test(text);
}

function isValidExample(text, word) {
  if (!text || text.length < 15 || text.length > 500) return false;
  if (!text.toLowerCase().includes(word.toLowerCase())) return false;
  if (!/^[A-Z"']/.test(text.trim())) return false;
  return true;
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
  // Pre-populate cache with static UI translations to save API quota and load instantly
  if (typeof PRE_TRANSLATED_UI !== 'undefined') {
    Object.entries(PRE_TRANSLATED_UI).forEach(([lang, map]) => {
      Object.entries(map).forEach(([engText, transText]) => {
        translationCache.set(engText + '|' + lang, transText);
      });
    });
  }

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

async function fetchTranslationGoogle(text, langCode) {
  const sanitized = text.trim().replace(/\s+/g, ' ');
  if (!sanitized || langCode === 'en') return null;
  try {
    const url = `${GOOGLE_TRANSLATE_API}?client=gtx&sl=en&tl=${langCode}&dt=t&q=${encodeURIComponent(sanitized)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const translated = (data?.[0] || []).map(part => part?.[0] || '').join('').trim();
    if (translated && translated.toLowerCase() !== sanitized.toLowerCase()) {
      return translated;
    }
    return null;
  } catch (e) {
    console.warn('Google Translate failed:', e);
    return null;
  }
}

async function fetchTranslation(text, langCode, priority = 0) {
  const sanitized = text.trim().replace(/\s+/g, ' ');
  if (!sanitized || langCode === 'en') return null;
  const key = sanitized + '|' + langCode;

  // Check cache first
  if (translationCache.has(key)) return translationCache.get(key);
  if (translationInflight.has(key)) return translationInflight.get(key);

  // Try Google Translate first (works on GitHub Pages), then MyMemory as fallback
  const promise = (async () => {
    // Google Translate
    let result = await fetchTranslationGoogle(sanitized, langCode);
    if (result) {
      translationCache.set(key, result);
      persistTranslationCache();
      return result;
    }
    // MyMemory fallback
    try {
      const url = MYMEMORY_API + '?q=' + encodeURIComponent(sanitized) + '&langpair=en|' + langCode;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const memResult = (data?.responseData?.translatedText || '').trim();
        if (isValidTranslation(memResult, sanitized)) {
          translationCache.set(key, memResult);
          persistTranslationCache();
          return memResult;
        }
      }
    } catch (e) {
      console.warn('MyMemory fallback failed:', e);
    }
    return null;
  })().finally(() => {
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

function getPreTranslation(text, langCode) {
  // Check PRE_TRANSLATED_UI first (instant, no API call needed)
  if (PRE_TRANSLATED_UI[langCode] && PRE_TRANSLATED_UI[langCode][text]) {
    return PRE_TRANSLATED_UI[langCode][text];
  }
  // Check translationCache
  const key = text + '|' + langCode;
  if (translationCache.has(key)) return translationCache.get(key);
  return null;
}

async function translateUIElements(langCode, langName, root) {
  const scope = root || document;

  if (langCode === 'en') {
    scope.querySelectorAll('[data-translate]').forEach(el => {
      // Remove all inline-translation pills
      el.querySelectorAll(':scope > .inline-translation').forEach(p => p.remove());
      // Restore original text by removing any direct text override from previous translations
      const key = el.dataset.translate;
      if (key && UI_STRINGS[key]) {
        // Get the text nodes only (skip child elements like pills)
        const textNodes = Array.from(el.childNodes).filter(n => n.nodeType === Node.TEXT_NODE);
        // If we had replaced text, restore it via innerHTML trick - just remove pills
      }
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

  // Process all [data-translate] elements
  const promises = [];
  scope.querySelectorAll('[data-translate]').forEach(el => {
    if (el.id === 'translate-btn' || el.id === 'theme-toggle') return;

    const key = el.dataset.translate;
    const originalText = UI_STRINGS[key];
    if (!originalText) return;

    // Remove existing pills
    el.querySelectorAll(':scope > .inline-translation').forEach(p => p.remove());

    // Check pre-translated first
    const preTranslated = getPreTranslation(originalText, langCode);
    if (preTranslated) {
      // Apply immediately without skeleton pill or API call
      const pill = document.createElement('span');
      pill.className = 'inline-translation ui-translation';
      pill.textContent = preTranslated;
      pill.style.display = 'inline';
      pill.style.marginLeft = '6px';
      el.appendChild(pill);
      return;
    }

    // Fall back to API translation
    const pill = makeTranslationPill('ui-translation');
    pill.style.display = 'inline';
    pill.style.marginLeft = '6px';
    el.appendChild(pill);

    promises.push(
      fetchTranslation(originalText, langCode).then(translated => {
        if (translated) {
          resolveTranslationPill(pill, translated, 'ui-translation');
          pill.style.display = 'inline';
          pill.style.marginLeft = '6px';
        } else {
          pill.remove();
        }
      })
    );
  });

  // Process placeholders
  if (!root) {
    document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
      const key = el.dataset.translatePlaceholder;
      const originalText = UI_STRINGS[key];
      if (!originalText) return;

      const preTranslated = getPreTranslation(originalText, langCode);
      if (preTranslated) {
        el.placeholder = preTranslated;
        return;
      }

      promises.push(
        fetchTranslation(originalText, langCode).then(translated => {
          if (translated) el.placeholder = translated;
        })
      );
    });
  }

  if (langName) {
    translateBtn.innerHTML = '🌐 ' + langName + ' ▼';
    translateBtn.classList.add('translate-btn--active');
  }

  translateBtn.dataset.activeLang = langName || '';
  translateBtn.dataset.activeLangCode = langCode;

  await Promise.allSettled(promises);
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
  const fallbackExamples = await fetchAlternateExamples(entry.word);
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

  const fallbackHtml = fallbackExamples.length
    ? `<div class="fallback-examples">
         <h3 data-translate="example-sentences">Example sentences from another source</h3>
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
