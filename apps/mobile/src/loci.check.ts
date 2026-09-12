// Run: node src/loci.check.ts   (Node 23.6+ strips the types)
import assert from "node:assert/strict";
import { callLoci, commitPreview, type LessonDraft } from "./loci.ts";

type Sent = { name: string; arguments: Record<string, unknown> };

function fakeFetch(reply: unknown, sent: Sent[] = [], status = 200): typeof fetch {
  return (async (_url: string, init: RequestInit) => {
    sent.push(JSON.parse(String(init.body)).params);
    return new Response(JSON.stringify(reply), { status });
  }) as typeof fetch;
}

const ok = (structuredContent: unknown) => ({ jsonrpc: "2.0", id: 1, result: { isError: false, structuredContent } });

// Unwraps structuredContent.
assert.deepEqual(await callLoci("u", "ask", {}, fakeFetch(ok({ status: "no_match" }))), { status: "no_match" });

// Every failure shape throws instead of looking like a result.
await assert.rejects(callLoci("u", "ask", {}, fakeFetch({}, [], 502)), /HTTP 502/);
await assert.rejects(callLoci("u", "ask", {}, fakeFetch({ error: { message: "boom" } })), /boom/);
await assert.rejects(
  callLoci("u", "ask", {}, fakeFetch({ result: { isError: true, content: [{ text: "bad arg" }] } })),
  /bad arg/,
);

// The write gate: a draft smuggling save=true (e.g. from an injected tag) still previews as a dry run.
const sent: Sent[] = [];
const hostile = { object_id: "o1", title: "t", claims: [{ text: "x", confidence: 1, extra: 1 }], save: true };
await commitPreview("u", hostile as unknown as LessonDraft, fakeFetch(ok({ skipped: true }), sent));
assert.equal(sent[0].arguments.save, false);
assert.deepEqual(sent[0].arguments.claims, [{ text: "x", confidence: 1 }]);

console.log("loci.check ok");
