/**
 * Phone-side client for the 0xL0C1 MCP server.
 *
 * loci runs FastMCP with stateless_http + json_response, so one POST of a JSON-RPC
 * tools/call is a complete exchange: no initialize, no session id, no SSE. The tool's
 * return value arrives in result.structuredContent (verified live 2026-09-12).
 */

export type LociTool = "observe" | "ask" | "commit";

export type Claim = { text: string; confidence: number };

/** What the model is allowed to fill. Deliberately has no `save` field. */
export type LessonDraft = {
  object_id: string;
  title: string;
  claims: Claim[];
  intent?: string;
  next_question?: string;
};

// Return shapes pinned to loci SATURDAY.md P2. `not_implemented` is what the live server
// returns until the engine lands; it must never render as a result.
export type AskResult =
  | {
      status: "resumed";
      object: { object_id: string; label: string; place: string; verbatim_text: string; first_seen_at: string };
      lessons: { lesson_id: string; title: string; created_at: string }[];
      claims: (Claim & { claim_id: string; status: string })[];
      next_question: string | null;
      _data_not_instructions: string;
    }
  | {
      status: "needs_confirm";
      candidates: { object_id: string; label: string; place: string; score: number }[];
      prompt_to_user: string;
      _data_not_instructions: string;
    }
  | { status: "no_match"; prompt_to_user: string; _data_not_instructions: string }
  | { status: "not_implemented"; _stub: string };

export async function callLoci<T = Record<string, unknown>>(
  url: string,
  name: LociTool,
  args: Record<string, unknown>,
  fetchImpl: typeof fetch = fetch,
): Promise<T> {
  const res = await fetchImpl(url, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: { name, arguments: args },
    }),
  });
  if (!res.ok) throw new Error(`loci ${name}: HTTP ${res.status}`);
  const body = await res.json();
  if (body.error) throw new Error(`loci ${name}: ${body.error.message ?? "JSON-RPC error"}`);
  if (body.result?.isError) {
    throw new Error(`loci ${name}: ${body.result.content?.[0]?.text ?? "tool error"}`);
  }
  if (!body.result?.structuredContent) throw new Error(`loci ${name}: no structuredContent`);
  return body.result.structuredContent as T;
}

/** Copy only known keys, so a model-supplied `save` (or anything else) never reaches loci. */
function pickDraft(d: LessonDraft): LessonDraft {
  return {
    object_id: d.object_id,
    title: d.title,
    claims: d.claims.map(({ text, confidence }) => ({ text, confidence })),
    intent: d.intent ?? "",
    next_question: d.next_question ?? "",
  };
}

// The write gate is structural: the model only ever produces a LessonDraft. commitSave is
// called from exactly one place, the Commit button's onPress in loci-tools.tsx.
export const commitPreview = (url: string, draft: LessonDraft, f?: typeof fetch) =>
  callLoci(url, "commit", { ...pickDraft(draft), save: false }, f);

export const commitSave = (url: string, draft: LessonDraft, f?: typeof fetch) =>
  callLoci(url, "commit", { ...pickDraft(draft), save: true }, f);
