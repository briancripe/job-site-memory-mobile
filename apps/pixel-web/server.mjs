import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { normalizeAskResult, readRuntimeEvents, visionPrompt } from "./loci-response.mjs";

const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 8787);
const lociUrl = process.env.LOCI_MCP_URL;
const runtimeUrl = process.env.COPILOTKIT_RUNTIME_URL || process.env.RUNTIME_URL;
const page = await readFile(new URL("./index.html", import.meta.url));
const objects = new Map();
const previewTokens = new Map();

const seed = (label, place, detail) => {
  const object_id = randomUUID();
  objects.set(object_id, { object_id, label, place, detail, lessons: [] });
};
seed('3/4" main shutoff', "Basement utility closet", "Chrome ball valve tagged MAIN");
seed('1/2" branch shutoff', "Basement utility closet", "Chrome ball valve on heater branch");

const json = (res, status, value) => {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(value));
};

async function body(req) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 12_000_000) throw new Error("Request too large");
  }
  return raw ? JSON.parse(raw) : {};
}

async function callLoci(name, args) {
  const response = await fetch(lociUrl, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method: "tools/call", params: { name, arguments: args } }),
  });
  const result = await response.json();
  if (!response.ok || result.error || result.result?.isError) throw new Error(result.error?.message || `Loci ${name} failed`);
  return result.result?.structuredContent;
}

async function inspectWithRuntime({ place, image }) {
  if (!runtimeUrl) throw new Error("COPILOTKIT_RUNTIME_URL is not configured on this server");
  if (!place?.trim()) throw new Error("Say or enter the room/zone before taking the photo");
  if (!image?.data || !String(image.mimeType || "").startsWith("image/")) throw new Error("Choose a camera image first");
  if (String(image.data).length > 10_000_000) throw new Error("Image is too large; use a smaller camera capture");
  const endpoint = runtimeUrl.endsWith("/run")
    ? runtimeUrl
    : `${runtimeUrl.replace(/\/$/, "")}/agent/default/run`;
  const threadId = randomUUID();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "text/event-stream" },
    body: JSON.stringify({
      threadId,
      runId: randomUUID(),
      state: {},
      tools: [],
      context: [],
      forwardedProps: {},
      messages: [{
        id: randomUUID(),
        role: "user",
        content: [
          { type: "text", text: visionPrompt(place.trim()) },
          { type: "image", source: { type: "data", value: String(image.data), mimeType: image.mimeType } },
        ],
      }],
    }),
  });
  const transcript = await response.text();
  if (!response.ok) throw new Error(`Vision runtime failed (HTTP ${response.status})`);
  const parsed = readRuntimeEvents(transcript);
  if (!parsed.loci) throw new Error(parsed.answer || "Vision runtime did not return a Loci ask result");
  return { memory: normalizeAskResult(parsed.loci), answer: parsed.answer };
}

function cleanDraft(input) {
  const claims = Array.isArray(input.claims)
    ? input.claims.slice(0, 8).map((claim) => ({ text: String(claim.text || "").slice(0, 500), confidence: Math.max(0, Math.min(1, Number(claim.confidence) || 0)) })).filter((claim) => claim.text)
    : [];
  return {
    object_id: String(input.object_id || ""),
    title: String(input.title || "Field lesson").slice(0, 120),
    claims,
    intent: String(input.intent || "").slice(0, 500),
    next_question: String(input.next_question || "").slice(0, 500),
  };
}

function demo(name, args) {
  if (name === "observe") {
    const object_id = randomUUID();
    const object = { object_id, label: args.user_label || args.description || "Observed object", place: args.place_label, detail: args.description, lessons: [] };
    objects.set(object_id, object);
    return { status: "observed", object };
  }
  if (name === "ask") {
    if (args.object_id && objects.has(args.object_id)) return { status: "resumed", object: objects.get(args.object_id) };
    const candidates = [...objects.values()].filter((item) => !args.place_label || item.place.toLowerCase().includes(args.place_label.toLowerCase()));
    if (!candidates.length) return { status: "no_match", prompt_to_user: "Nothing in demo memory matches yet. Observe it first." };
    if (candidates.length === 1) return { status: "resumed", object: candidates[0] };
    return { status: "needs_confirm", prompt_to_user: "Which object do you mean?", candidates: candidates.map(({ object_id, label, place }) => ({ object_id, label, place })) };
  }
  throw new Error(`Unsupported demo action: ${name}`);
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    if (req.method === "GET" && url.pathname === "/health") return json(res, 200, {
      ok: true,
      mode: runtimeUrl && lociUrl ? "vision+loci" : lociUrl ? "loci-only" : "throwaway-demo",
      vision_runtime: Boolean(runtimeUrl),
      loci: Boolean(lociUrl),
      host,
      port,
    });
    if (req.method === "GET" && url.pathname === "/") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      return res.end(page);
    }
    if (req.method !== "POST") return json(res, 404, { error: "Not found" });
    const input = await body(req);
    if (url.pathname === "/api/bridge") return json(res, 200, await inspectWithRuntime(input));
    if (url.pathname === "/api/observe" || url.pathname === "/api/ask") {
      const name = url.pathname.slice(5);
      const result = lociUrl ? await callLoci(name, input) : demo(name, input);
      return json(res, 200, name === "ask" ? normalizeAskResult(result) : result);
    }
    if (url.pathname === "/api/preview") {
      const draft = cleanDraft(input);
      if (!draft.object_id || !draft.claims.length) return json(res, 400, { error: "Choose an object and add a lesson first." });
      const preview = lociUrl ? await callLoci("commit", { ...draft, save: false }) : { status: "preview", draft };
      const token = randomUUID();
      previewTokens.set(token, { draft, expires: Date.now() + 10 * 60_000 });
      return json(res, 200, { ...preview, preview_token: token, draft });
    }
    if (url.pathname === "/api/discard") {
      previewTokens.delete(String(input.preview_token || ""));
      return json(res, 200, { status: "discarded", saved: false });
    }
    if (url.pathname === "/api/commit") {
      const token = String(input.preview_token || "");
      const pending = previewTokens.get(token);
      previewTokens.delete(token);
      if (!pending || pending.expires < Date.now()) return json(res, 409, { error: "Preview expired or missing. Preview again before Commit." });
      const result = lociUrl ? await callLoci("commit", { ...pending.draft, save: true }) : (() => {
        const object = objects.get(pending.draft.object_id);
        if (!object) throw new Error("Object is no longer in demo memory");
        object.lessons.push(pending.draft);
        return { status: "committed", saved: true, lesson_count: object.lessons.length };
      })();
      return json(res, 200, result);
    }
    return json(res, 404, { error: "Not found" });
  } catch (error) {
    return json(res, 400, { error: error instanceof Error ? error.message : String(error) });
  }
}).listen(port, host, () => console.log(`Pixel object bridge (${runtimeUrl ? "vision runtime" : "no vision"}; ${lociUrl ? "Loci proxy" : "throwaway memory"}) listening on http://${host}:${port}`));
