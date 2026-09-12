import assert from "node:assert/strict";
import test from "node:test";
import { normalizeAskResult, readRuntimeEvents, visionPrompt } from "./loci-response.mjs";

test("normalizes deployed ok response into an arrival handoff", () => {
  const result = normalizeAskResult({
    status: "ok",
    match: { id: "valve-a", label: "3/4 main shutoff", place: "Basement utility closet" },
    matches: [{ id: "valve-a" }],
    lessons: [{ title: "Packing nut leak", next_question: "Is pressure stable?", is_cursor_active: true }],
    claims: [
      { text: "Diagnosis: packing nut seep", status: "untrusted" },
      { text: "Bring a 3/4 inch replacement valve", status: "untrusted" },
    ],
  });
  assert.equal(result.status, "resumed");
  assert.equal(result.object.object_id, "valve-a");
  assert.match(result.diagnosis, /packing nut seep/);
  assert.match(result.required_part, /replacement valve/);
  assert.equal(result.open_question, "Is pressure stable?");
});

test("never chooses deployed needs_confirm matches", () => {
  const result = normalizeAskResult({
    status: "needs_confirm",
    matches: [{ id: "a", label: "Main" }, { object_id: "b", label: "Branch" }],
  });
  assert.equal(result.status, "needs_confirm");
  assert.deepEqual(result.matches.map((item) => item.object_id), ["a", "b"]);
  assert.equal(result.object, undefined);
});

test("accepts original resumed/candidates shapes", () => {
  assert.equal(normalizeAskResult({ status: "resumed", object: { object_id: "old" }, claims: [], lessons: [] }).object.object_id, "old");
  assert.equal(normalizeAskResult({ status: "needs_confirm", candidates: [{ object_id: "old" }] }).matches[0].object_id, "old");
});

test("extracts the ask result from CopilotKit SSE", () => {
  const sse = [
    'data: {"type":"TOOL_CALL_START","toolCallId":"t1","toolCallName":"ask"}',
    'data: {"type":"TOOL_CALL_RESULT","toolCallId":"t1","content":"{\\"status\\":\\"ok\\",\\"match\\":{\\"id\\":\\"a\\"},\\"matches\\":[],\\"lessons\\":[],\\"claims\\":[]}"}',
    'data: {"type":"TEXT_MESSAGE_CONTENT","messageId":"m1","delta":"Found it."}',
  ].join("\n\n");
  const result = readRuntimeEvents(sse);
  assert.equal(result.loci.match.id, "a");
  assert.equal(result.answer, "Found it.");
});

test("vision prompt preserves the user place and forbids writes", () => {
  const prompt = visionPrompt("Closet B");
  assert.match(prompt, /"Closet B"/);
  assert.match(prompt, /visible_verbatim_text/);
  assert.match(prompt, /Do not call observe or commit/);
});
