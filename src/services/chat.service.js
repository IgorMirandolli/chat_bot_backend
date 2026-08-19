import { recommendTitles } from "./recommendation.service.js";

const FIELDS = ["type", "genre", "mood", "maxDuration"];

const OPTIONS = {
  type: {
    movie: ["filme", "filmes", "longa", "longas", "movie"],
    series: ["serie", "series", "seriado", "seriados"],
  },
  genre: {
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
  mood: {
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
  genre: Object.entries(LABELS.genre).map(([value, label]) => ({
    label,
    message: label,
    value,
  })),
  mood: Object.entries(LABELS.mood).map(([value, label]) => ({
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
  genre: "Qual g\u00eanero combina mais com voc\u00ea agora?",
  mood: "E qual clima voc\u00ea procura: algo divertido, emocionante, reflexivo, relaxante ou tenso?",
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
  genre: [
    "mudar genero",
    "mudar o genero",
    "trocar genero",
    "trocar o genero",
    "outro genero",
  ],
  mood: [
    "mudar clima",
    "mudar o clima",
    "trocar clima",
    "trocar o clima",
    "outro clima",
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

const POST_RECOMMENDATION_REPLIES = [
  { label: "Nova busca", message: "Quero come\u00e7ar de novo" },
  { label: "Mudar g\u00eanero", message: "Quero mudar o g\u00eanero" },
  { label: "Mudar clima", message: "Quero mudar o clima" },
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
  const genre = findLastOption(text, OPTIONS.genre);
  const mood = findLastOption(text, OPTIONS.mood);
  const maxDuration = extractDuration(text);

  if (type) preferences.type = type;
  if (genre) preferences.genre = genre;
  if (mood) preferences.mood = mood;
  if (maxDuration) preferences.maxDuration = maxDuration;

  return preferences;
}

function sanitizeContext(rawContext) {
  const rawPreferences = rawContext?.preferences || {};
  const preferences = {};

  if (Object.hasOwn(OPTIONS.type, rawPreferences.type)) {
    preferences.type = rawPreferences.type;
  }

  if (Object.hasOwn(OPTIONS.genre, rawPreferences.genre)) {
    preferences.genre = rawPreferences.genre;
  }

  if (Object.hasOwn(OPTIONS.mood, rawPreferences.mood)) {
    preferences.mood = rawPreferences.mood;
  }

  const duration = Number(rawPreferences.maxDuration);
  if (Number.isFinite(duration) && duration > 0 && duration <= 600) {
    preferences.maxDuration = duration;
  }

  return { preferences };
}

function getMissingField(preferences) {
  return FIELDS.find((field) => preferences[field] === undefined);
}

function findChangeCommand(text) {
  return FIELDS.find((field) =>
    CHANGE_COMMANDS[field].some((command) => containsPhrase(text, command)),
  );
}

function getQuickReplies(field) {
  return QUICK_REPLIES[field] || [];
}

function buildContext(preferences, awaiting = null) {
  return { preferences, awaiting };
}

function createQuestionResponse(reply, preferences, field) {
  return {
    reply: `${reply} ${QUESTIONS[field]}`.trim(),
    context: buildContext(preferences, field),
    quickReplies: getQuickReplies(field),
    recommendations: [],
    complete: false,
  };
}

function describeRecognizedPreferences(recognized) {
  const descriptions = [];

  if (recognized.type) {
    descriptions.push(recognized.type === "movie" ? "um filme" : "uma s\u00e9rie");
  }

  if (recognized.genre) {
    descriptions.push(`g\u00eanero ${LABELS.genre[recognized.genre].toLowerCase()}`);
  }

  if (recognized.mood) {
    descriptions.push(`clima ${LABELS.mood[recognized.mood].toLowerCase()}`);
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
  const { preferences } = sanitizeContext(rawPayload.context);

  if (RESET_COMMANDS.some((command) => containsPhrase(text, command))) {
    return createQuestionResponse(
      "Combinado, vamos fazer uma nova busca.",
      {},
      "type",
    );
  }

  if (text === "" && Object.keys(preferences).length === 0) {
    return createQuestionResponse(
      "Oi! Eu sou o Cine, seu assistente de filmes e s\u00e9ries. Voc\u00ea pode responder com suas palavras ou usar as sugest\u00f5es abaixo.",
      preferences,
      "type",
    );
  }

  const changeField = findChangeCommand(text);
  if (changeField) {
    delete preferences[changeField];
  }

  const recognized = extractPreferences(text);
  Object.assign(preferences, recognized);

  const missingField = changeField && recognized[changeField] === undefined
    ? changeField
    : getMissingField(preferences);

  if (missingField) {
    if (changeField && recognized[changeField] === undefined) {
      return createQuestionResponse("Claro, podemos alterar essa escolha.", preferences, missingField);
    }

    const recognizedDescription = describeRecognizedPreferences(recognized);
    if (recognizedDescription) {
      return createQuestionResponse(
        `Entendi: ${recognizedDescription}.`,
        preferences,
        missingField,
      );
    }

    if (isGreeting(text)) {
      return createQuestionResponse("Oi! Que bom ter voc\u00ea por aqui.", preferences, missingField);
    }

    return createQuestionResponse(
      "N\u00e3o consegui identificar essa prefer\u00eancia ainda. Tente responder de outra forma ou escolha uma sugest\u00e3o.",
      preferences,
      missingField,
    );
  }

  if (Object.keys(recognized).length === 0) {
    const reply = isThanks(text)
      ? "Fico feliz em ajudar! Se quiser, podemos ajustar a busca."
      : "Posso refazer a recomenda\u00e7\u00e3o se voc\u00ea quiser mudar o g\u00eanero, o clima ou o tempo dispon\u00edvel.";

    return {
      reply,
      context: buildContext(preferences),
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
    context: buildContext(preferences),
    quickReplies: POST_RECOMMENDATION_REPLIES,
    recommendations,
    complete: true,
  };
}
