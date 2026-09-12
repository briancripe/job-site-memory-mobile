const asArray = (value) => (Array.isArray(value) ? value : []);

const objectId = (value = {}) => String(value.object_id || value.id || "");

const candidate = (value = {}) => ({
  object_id: objectId(value),
  label: String(value.label || value.user_label || value.canonical_class || "Unlabelled object"),
  place: String(value.place || value.place_label || ""),
  score: Number(value.score || 0),
});

const lessonQuestion = (lessons) => {
  const active = lessons.find((lesson) => lesson?.is_cursor_active && lesson?.next_question);
  return String(active?.next_question || lessons.find((lesson) => lesson?.next_question)?.next_question || "");
};

const claimText = (claim) => String(claim?.text || claim?.claim || "").trim();

export function normalizeAskResult(input) {
  const raw = input && typeof input === "object" ? input : {};
  const lessons = asArray(raw.lessons);
  const claims = asArray(raw.claims);

  if (raw.status === "needs_confirm" || raw.needs_confirm === true) {
    const choices = asArray(raw.candidates).length ? asArray(raw.candidates) : asArray(raw.matches);
    return {
      status: "needs_confirm",
      prompt_to_user: String(raw.prompt_to_user || "I found similar objects. Which one is this?"),
      matches: choices.map(candidate).filter((item) => item.object_id),
    };
  }

  const match = raw.match || raw.object || asArray(raw.matches)[0];
  if ((raw.status === "ok" || raw.status === "resumed") && match) {
    const object = {
      ...candidate(match),
      description: String(match.description || match.detail || ""),
      material: String(match.material || ""),
      mounting: String(match.mounting || ""),
      verbatim_text: String(match.verbatim_text || match.visible_verbatim_text || ""),
    };
    const texts = claims.map(claimText).filter(Boolean);
    const diagnosis = texts.find((text) => /diagnos|cause|leak|fail|damage|problem/i.test(text))
      || String(lessons[0]?.title || texts[0] || "Not recorded");
    const requiredPart = texts.find((text) => /\b(part|required|replace|replacement|bring|order|size|fitting|valve)\b/i.test(text) && text !== diagnosis)
      || texts.find((text) => text !== diagnosis)
      || "None recorded";
    return {
      status: "resumed",
      object,
      lessons,
      claims,
      diagnosis,
      required_part: requiredPart,
      open_question: String(raw.next_question || lessonQuestion(lessons) || "None recorded"),
    };
  }

  if (raw.status === "no_match") {
    return {
      status: "no_match",
      prompt_to_user: String(raw.prompt_to_user || "I have no record of this object."),
      matches: [],
    };
  }

  return {
    status: "error",
    message: String(raw.error || raw.message || `Unexpected Loci response (${raw.status || "missing status"})`),
  };
}

function parseJson(value) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    const fenced = value.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (!fenced) return undefined;
    try {
      return JSON.parse(fenced[1]);
    } catch {
      return undefined;
    }
  }
}

function findLociPayload(value) {
  const parsed = parseJson(value);
  if (!parsed) return undefined;
  if (Array.isArray(parsed)) {
    for (const item of parsed) {
      const found = findLociPayload(item);
      if (found) return found;
    }
    return undefined;
  }
  if (typeof parsed !== "object") return undefined;
  if (["ok", "resumed", "needs_confirm", "no_match"].includes(parsed.status)) return parsed;
  for (const key of ["structuredContent", "result", "content", "data"]) {
    const found = findLociPayload(parsed[key]);
    if (found) return found;
  }
  return undefined;
}

export function readRuntimeEvents(sse) {
  const toolNames = new Map();
  const answers = new Map();
  let loci;
  for (const line of String(sse).split(/\r?\n/)) {
    if (!line.startsWith("data:")) continue;
    const event = parseJson(line.slice(5).trim());
    if (!event || typeof event !== "object") continue;
    if (event.type === "TOOL_CALL_START") toolNames.set(event.toolCallId, event.toolCallName);
    if (event.type === "TOOL_CALL_RESULT" && /(^|_)ask$/i.test(toolNames.get(event.toolCallId) || event.toolCallName || "")) {
      loci = findLociPayload(event.content ?? event.result) || loci;
    }
    if (event.type === "TEXT_MESSAGE_CONTENT") {
      answers.set(event.messageId, (answers.get(event.messageId) || "") + String(event.delta || ""));
    }
  }
  return { loci, answer: [...answers.values()].at(-1) || "" };
}

export const visionPrompt = (place) => `The technician supplied this exact place: ${JSON.stringify(place)}.
Inspect the attached image. Use the Loci ask tool once, read-only, to identify the physical object and recall its handoff.
Send description, visible_verbatim_text (every visible stamp exactly), material, mounting, and place_label exactly as supplied above.
Do not invent or broaden the place. Do not require a QR or tag. Do not call observe or commit. If similar objects are ambiguous, return needs_confirm and let the technician choose.`;
