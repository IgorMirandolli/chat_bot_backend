import { recommendTitles } from "./recommendation.service.js";

const FIELDS = ["type", "genres", "moods", "maxDuration"];

const OPTIONS = {
  type: {
    movie: ["filme", "filmes", "longa", "longas", "movie"],
    series: ["serie", "series", "seriado", "seriados"],
  },
  genres: {
    acao: ["acao", "acoes", "filme de acao", "serie de acao"],
    "ficcao-cientifica": [
      "ficcao cientifica",
      "ficcao",
      "sci fi",
      "science fiction",
    ],
    aventura: ["aventura", "aventuras"],
    animacao: ["animacao", "animado", "animada", "desenho"],
    comedia: ["comedia", "comedias", "engracado", "engracada"],
    drama: ["drama", "dramatico", "dramatica"],
    fantasia: ["fantasia", "fantastico", "fantastica"],
    misterio: ["misterio", "investigacao"],
    suspense: ["suspense", "thriller"],
  },
  moods: {
    divertido: ["divertido", "divertida", "rir", "risada"],
    emocionante: ["emocionante", "emocao", "empolgante"],
    reflexivo: ["reflexivo", "reflexiva", "pensar", "profundo", "profunda"],
    relaxante: ["relaxante", "tranquilo", "tranquila", "calmo", "calma", "leve"],
    tenso: ["tenso", "tensa", "tensao", "adrenalina", "assustador", "assustadora"],
  },
};

const LABELS = {
  type: {
    movie: "Filme",
    series: "S\u00e9rie",
  },
  genre: {
    acao: "A\u00e7\u00e3o",
    "ficcao-cientifica": "Fic\u00e7\u00e3o cient\u00edfica",
    aventura: "Aventura",
    animacao: "Anima\u00e7\u00e3o",
    comedia: "Com\u00e9dia",
    drama: "Drama",
    fantasia: "Fantasia",
    misterio: "Mist\u00e9rio",
    suspense: "Suspense",
  },
  mood: {
    divertido: "Divertido",
    emocionante: "Emocionante",
    reflexivo: "Reflexivo",
    relaxante: "Relaxante",
    tenso: "Tenso",
  },
};

const QUICK_REPLIES = {
  type: [
    { label: "Filme", message: "Quero um filme" },
    { label: "S\u00e9rie", message: "Quero uma s\u00e9rie" },
  ],
  genres: Object.entries(LABELS.genre).map(([value, label]) => ({
    label,
    message: label,
    value,
  })),
  moods: Object.entries(LABELS.mood).map(([value, label]) => ({
    label,
    message: label,
    value,
  })),
  maxDuration: [
    { label: "At\u00e9 30 min", message: "Tenho at\u00e9 30 minutos" },
    { label: "At\u00e9 1 hora", message: "Tenho at\u00e9 uma hora" },
    { label: "At\u00e9 2 horas", message: "Tenho at\u00e9 duas horas" },
    { label: "At\u00e9 3 horas", message: "Tenho at\u00e9 tr\u00eas horas" },
  ],
};

const QUESTIONS = {
  type: "Para come\u00e7ar, voc\u00ea prefere um filme ou uma s\u00e9rie?",
  genres: "Quais g\u00eaneros combinam com voc\u00ea agora? Pode escolher mais de um.",
  moods: "Quais climas voc\u00ea procura? Pode escolher mais de um.",
  maxDuration: "Quanto tempo voc\u00ea tem dispon\u00edvel para assistir?",
};

const CHANGE_COMMANDS = {
  type: [
    "mudar tipo",
    "mudar o tipo",
    "trocar tipo",
    "trocar o tipo",
    "mudar formato",
    "mudar o formato",
    "trocar formato",
    "trocar o formato",
    "outro formato",
  ],
  genres: [
    "mudar genero",
    "mudar o genero",
    "mudar generos",
    "mudar os generos",
    "trocar genero",
    "trocar o genero",
    "trocar generos",
    "trocar os generos",
    "outro genero",
    "outros generos",
  ],
  moods: [
    "mudar clima",
    "mudar o clima",
    "mudar climas",
    "mudar os climas",
    "trocar clima",
    "trocar o clima",
    "trocar climas",
    "trocar os climas",
    "outro clima",
    "outros climas",
  ],
  maxDuration: [
    "mudar tempo",
    "mudar o tempo",
    "trocar tempo",
    "trocar o tempo",
    "mudar duracao",
    "mudar a duracao",
    "trocar duracao",
    "trocar a duracao",
  ],
};

const RESET_COMMANDS = [
  "nova conversa",
  "nova busca",
  "recomecar",
  "comecar de novo",
  "limpar conversa",
];

const CONFIRM_SELECTION_COMMANDS = [
  "continuar",
  "continuar com esses generos",
  "pronto",
  "so esses",
  "pode seguir",
  "finalizar generos",
  "continuar com esses climas",
  "finalizar climas",
];

const POST_RECOMMENDATION_REPLIES = [
  { label: "Nova busca", message: "Quero come\u00e7ar de novo" },
  { label: "Mudar g\u00eaneros", message: "Quero mudar os g\u00eaneros" },
  { label: "Mudar climas", message: "Quero mudar os climas" },
  { label: "Mudar tempo", message: "Quero mudar o tempo" },
];

export class InvalidChatRequestError extends Error {}

function normalizeText(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsPhrase(text, phrase) {
  return ` ${text} `.includes(` ${phrase} `);
}

function findLastOption(text, options) {
  let selected;
  let selectedIndex = -1;

  Object.entries(options).forEach(([value, aliases]) => {
    aliases.forEach((alias) => {
      const index = ` ${text} `.lastIndexOf(` ${alias} `);

      if (index > selectedIndex) {
        selected = value;
        selectedIndex = index;
      }
    });
  });

  return selected;
}

function findAllOptions(text, options) {
  const paddedText = ` ${text} `;

  return Object.entries(options)
    .map(([value, aliases]) => {
      const indexes = aliases
        .map((alias) => paddedText.indexOf(` ${alias} `))
        .filter((index) => index >= 0);

      return {
        value,
        index: indexes.length > 0 ? Math.min(...indexes) : -1,
      };
    })
    .filter((match) => match.index >= 0)
    .sort((first, second) => first.index - second.index)
    .map((match) => match.value);
}

function extractDuration(text) {
  if (
    containsPhrase(text, "sem limite") ||
    containsPhrase(text, "qualquer duracao") ||
    containsPhrase(text, "tanto faz")
  ) {
    return 240;
  }

  const hourAndHalfWords = text.match(/\b(uma|duas|tres) horas? e meia\b/);
  if (hourAndHalfWords) {
    const hours = { uma: 1, duas: 2, tres: 3 }[hourAndHalfWords[1]];
    return hours * 60 + 30;
  }

  if (containsPhrase(text, "meia hora")) {
    return 30;
  }

  const wordHours = text.match(/\b(uma|duas|tres|quatro) horas?\b/);
  if (wordHours) {
    const hours = { uma: 1, duas: 2, tres: 3, quatro: 4 }[wordHours[1]];
    return hours * 60;
  }

  const hours = text.match(/\b(\d+)\s*h(?:ora|oras)?\s*(\d{1,2})?\b/);
  if (hours) {
    return Number(hours[1]) * 60 + Number(hours[2] || 0);
  }

  const minutes = text.match(/\b(\d+)\s*(?:min|minuto|minutos)\b/);
  if (minutes) {
    return Number(minutes[1]);
  }

  return undefined;
}

function extractPreferences(text) {
  const preferences = {};
  const type = findLastOption(text, OPTIONS.type);
  const genres = findAllOptions(text, OPTIONS.genres);
  const moods = findAllOptions(text, OPTIONS.moods);
  const maxDuration = extractDuration(text);

  if (type) preferences.type = type;
  if (genres.length > 0) preferences.genres = genres;
  if (moods.length > 0) preferences.moods = moods;
  if (maxDuration) preferences.maxDuration = maxDuration;

  return preferences;
}

function sanitizeContext(rawContext) {
  const rawPreferences = rawContext?.preferences || {};
  const preferences = {};

  if (Object.hasOwn(OPTIONS.type, rawPreferences.type)) {
    preferences.type = rawPreferences.type;
  }

  const rawGenres = rawPreferences.genres ?? rawPreferences.genre;
  const genres = Array.isArray(rawGenres) ? rawGenres : [rawGenres];
  const validGenres = genres.filter((genre) =>
    Object.hasOwn(OPTIONS.genres, genre),
  );

  if (validGenres.length > 0) {
    preferences.genres = [...new Set(validGenres)];
  }

  const rawMoods = rawPreferences.moods ?? rawPreferences.mood;
  const moods = Array.isArray(rawMoods) ? rawMoods : [rawMoods];
  const validMoods = moods.filter((mood) =>
    Object.hasOwn(OPTIONS.moods, mood),
  );

  if (validMoods.length > 0) {
    preferences.moods = [...new Set(validMoods)];
  }

  const duration = Number(rawPreferences.maxDuration);
  if (Number.isFinite(duration) && duration > 0 && duration <= 600) {
    preferences.maxDuration = duration;
  }

  return {
    preferences,
    genresConfirmed:
      rawContext?.genresConfirmed === true ||
      (rawContext?.genresConfirmed !== false &&
        validGenres.length > 0 &&
        rawContext?.awaiting !== "genres"),
    moodsConfirmed:
      rawContext?.moodsConfirmed === true ||
      (rawContext?.moodsConfirmed !== false &&
        validMoods.length > 0 &&
        rawContext?.awaiting !== "moods"),
  };
}

function getMissingField(preferences, genresConfirmed, moodsConfirmed) {
  if (!preferences.type) return "type";
  if (!preferences.genres?.length || !genresConfirmed) return "genres";
  if (!preferences.moods?.length || !moodsConfirmed) return "moods";
  if (!preferences.maxDuration) return "maxDuration";
  return undefined;
}

function findChangeCommand(text) {
  return FIELDS.find((field) =>
    CHANGE_COMMANDS[field].some((command) => containsPhrase(text, command)),
  );
}

function getQuickReplies(field, preferences) {
  if (field !== "genres" && field !== "moods") {
    return QUICK_REPLIES[field] || [];
  }

  const selectedValues = new Set(preferences[field] || []);
  const replies = QUICK_REPLIES[field].filter(
    (reply) => !selectedValues.has(reply.value),
  );

  if (selectedValues.size > 0) {
    replies.push({
      label: "Continuar com esses",
      message: field === "genres"
        ? "Continuar com esses generos"
        : "Continuar com esses climas",
    });
  }

  return replies;
}

function buildContext(
  preferences,
  awaiting = null,
  genresConfirmed = true,
  moodsConfirmed = true,
) {
  return {
    preferences,
    awaiting,
    genresConfirmed,
    moodsConfirmed,
  };
}

function createQuestionResponse(
  reply,
  preferences,
  field,
  genresConfirmed = false,
  moodsConfirmed = false,
) {
  return {
    reply: `${reply} ${QUESTIONS[field]}`.trim(),
    context: buildContext(
      preferences,
      field,
      genresConfirmed,
      moodsConfirmed,
    ),
    quickReplies: getQuickReplies(field, preferences),
    recommendations: [],
    complete: false,
  };
}

function createMultiSelectionResponse(
  preferences,
  field,
  genresConfirmed,
  moodsConfirmed,
) {
  const labels = field === "genres" ? LABELS.genre : LABELS.mood;
  const selectedLabels = preferences[field]
    .map((value) => labels[value])
    .join(" + ");
  const itemName = field === "genres" ? "g\u00eanero" : "clima";

  return {
    reply: `Adicionei ${selectedLabels}. Voc\u00ea pode escolher outro ${itemName} ou continuar.`,
    context: buildContext(
      preferences,
      field,
      genresConfirmed,
      moodsConfirmed,
    ),
    quickReplies: getQuickReplies(field, preferences),
    recommendations: [],
    complete: false,
  };
}

function describeRecognizedPreferences(recognized) {
  const descriptions = [];

  if (recognized.type) {
    descriptions.push(recognized.type === "movie" ? "um filme" : "uma s\u00e9rie");
  }

  if (recognized.genres) {
    const genres = recognized.genres
      .map((genre) => LABELS.genre[genre].toLowerCase())
      .join(" + ");
    descriptions.push(`g\u00eaneros ${genres}`);
  }

  if (recognized.moods) {
    const moods = recognized.moods
      .map((mood) => LABELS.mood[mood].toLowerCase())
      .join(" + ");
    descriptions.push(`climas ${moods}`);
  }

  if (recognized.maxDuration) {
    descriptions.push(`at\u00e9 ${recognized.maxDuration} minutos`);
  }

  return descriptions.join(", ");
}

function isGreeting(text) {
  return ["oi", "ola", "bom dia", "boa tarde", "boa noite", "e ai"].some(
    (greeting) => containsPhrase(text, greeting),
  );
}

function isThanks(text) {
  return ["obrigado", "obrigada", "valeu", "perfeito"].some((thanks) =>
    containsPhrase(text, thanks),
  );
}

export async function processChatMessage(rawPayload, providedTitles) {
  if (!rawPayload || typeof rawPayload !== "object") {
    throw new InvalidChatRequestError("Envie uma mensagem para o assistente.");
  }

  if (typeof rawPayload.message !== "string") {
    throw new InvalidChatRequestError("A mensagem precisa ser um texto.");
  }

  if (rawPayload.message.length > 500) {
    throw new InvalidChatRequestError("A mensagem deve ter no m\u00e1ximo 500 caracteres.");
  }

  const text = normalizeText(rawPayload.message);
  const sanitizedContext = sanitizeContext(rawPayload.context);
  const { preferences } = sanitizedContext;
  let { genresConfirmed, moodsConfirmed } = sanitizedContext;

  if (RESET_COMMANDS.some((command) => containsPhrase(text, command))) {
    return createQuestionResponse(
      "Combinado, vamos fazer uma nova busca.",
      {},
      "type",
      false,
      false,
    );
  }

  if (text === "" && Object.keys(preferences).length === 0) {
    return createQuestionResponse(
      "Oi! Eu sou o Cine, seu assistente de filmes e s\u00e9ries. Voc\u00ea pode responder com suas palavras ou usar as sugest\u00f5es abaixo.",
      preferences,
      "type",
      false,
      false,
    );
  }

  const changeField = findChangeCommand(text);
  if (changeField) {
    delete preferences[changeField];
    if (changeField === "genres") {
      genresConfirmed = false;
    }
    if (changeField === "moods") {
      moodsConfirmed = false;
    }
  }

  const recognized = extractPreferences(text);
  if (recognized.genres) {
    preferences.genres = [
      ...new Set([...(preferences.genres || []), ...recognized.genres]),
    ];
  }

  if (recognized.moods) {
    preferences.moods = [
      ...new Set([...(preferences.moods || []), ...recognized.moods]),
    ];
  }

  Object.entries(recognized).forEach(([field, value]) => {
    if (field !== "genres" && field !== "moods") {
      preferences[field] = value;
    }
  });

  const confirmsSelection = CONFIRM_SELECTION_COMMANDS.some((command) =>
    containsPhrase(text, command),
  );
  const awaitingField = rawPayload.context?.awaiting;
  const confirmsGenres = confirmsSelection && awaitingField === "genres";
  const confirmsMoods = confirmsSelection && awaitingField === "moods";

  if (confirmsGenres && preferences.genres?.length) {
    genresConfirmed = true;
  }

  if (confirmsMoods && preferences.moods?.length) {
    moodsConfirmed = true;
  }

  const hasAllPreferences =
    preferences.type &&
    preferences.genres?.length &&
    preferences.moods?.length &&
    preferences.maxDuration;

  if (
    recognized.genres &&
    (hasAllPreferences || recognized.moods || recognized.maxDuration)
  ) {
    genresConfirmed = true;
  }

  if (
    recognized.moods &&
    (hasAllPreferences || recognized.genres || recognized.maxDuration)
  ) {
    moodsConfirmed = true;
  }

  const missingField = changeField && recognized[changeField] === undefined
    ? changeField
    : getMissingField(preferences, genresConfirmed, moodsConfirmed);

  if (missingField) {
    if (changeField && recognized[changeField] === undefined) {
      return createQuestionResponse(
        "Claro, podemos alterar essa escolha.",
        preferences,
        missingField,
        genresConfirmed,
        moodsConfirmed,
      );
    }

    if (missingField === "genres" && recognized.genres) {
      return createMultiSelectionResponse(
        preferences,
        "genres",
        false,
        moodsConfirmed,
      );
    }

    if (missingField === "moods" && recognized.moods) {
      return createMultiSelectionResponse(
        preferences,
        "moods",
        genresConfirmed,
        false,
      );
    }

    if (confirmsSelection) {
      return createQuestionResponse(
        "Perfeito, vamos continuar.",
        preferences,
        missingField,
        genresConfirmed,
        moodsConfirmed,
      );
    }

    const recognizedDescription = describeRecognizedPreferences(recognized);
    if (recognizedDescription) {
      return createQuestionResponse(
        `Entendi: ${recognizedDescription}.`,
        preferences,
        missingField,
        genresConfirmed,
        moodsConfirmed,
      );
    }

    if (isGreeting(text)) {
      return createQuestionResponse(
        "Oi! Que bom ter voc\u00ea por aqui.",
        preferences,
        missingField,
        genresConfirmed,
        moodsConfirmed,
      );
    }

    return createQuestionResponse(
      "N\u00e3o consegui identificar essa prefer\u00eancia ainda. Tente responder de outra forma ou escolha uma sugest\u00e3o.",
      preferences,
      missingField,
      genresConfirmed,
      moodsConfirmed,
    );
  }

  if (Object.keys(recognized).length === 0) {
    const reply = isThanks(text)
      ? "Fico feliz em ajudar! Se quiser, podemos ajustar a busca."
      : "Posso refazer a recomenda\u00e7\u00e3o se voc\u00ea quiser mudar os g\u00eaneros, os climas ou o tempo dispon\u00edvel.";

    return {
      reply,
      context: buildContext(preferences, null, true, true),
      quickReplies: POST_RECOMMENDATION_REPLIES,
      recommendations: [],
      complete: true,
    };
  }

  const recommendations = await recommendTitles(
    preferences,
    providedTitles,
  );

  return {
    reply: "Perfeito! Cruzei suas prefer\u00eancias com o cat\u00e1logo e encontrei estas op\u00e7\u00f5es para voc\u00ea:",
    context: buildContext(preferences, null, true, true),
    quickReplies: POST_RECOMMENDATION_REPLIES,
    recommendations,
    complete: true,
  };
}
