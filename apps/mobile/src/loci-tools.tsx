/**
 * Drop-in replacement for the starter kit's apps/mobile/src/tools.tsx: mount <LociTools />
 * where chat.tsx mounts <Tools />.
 *
 * All three loci tools run on the phone rather than as runtime mcpServers, so the model
 * can never reach commit(save=true). See docs/DESIGN.md.
 */
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  useAgent,
  useCopilotKit,
  useFrontendTool,
  useHumanInTheLoop,
} from "@copilotkit/react-native/headless";
import { z } from "zod";
import { callLoci, commitPreview, commitSave, type AskResult, type LessonDraft } from "@/loci";
import { createUserMessageId } from "@/message-id";
import { styles } from "@/styles";

function lociUrl(): string {
  const url = process.env.EXPO_PUBLIC_LOCI_URL;
  if (!url) throw new Error("EXPO_PUBLIC_LOCI_URL is not set (the loci /loci-<token>/mcp URL).");
  return url;
}

// ponytail: copied from loci server.py; read them from loci tools/list if they start to drift.
const material = z.enum([
  "metal_chrome_or_steel", "metal_brass_or_bronze", "metal_matte_black", "plastic_molded",
  "wood_finished", "wood_unfinished", "ceramic_or_porcelain", "glass", "fabric_or_upholstery",
  "paper_or_fiber", "composite_or_other",
]);
const mounting = z.enum([
  "wall_mounted", "ceiling_mounted", "freestanding_floor", "tabletop_or_counter",
  "recessed_or_built_in", "handheld_portable",
]);
const verbatim = z.string().describe("ALL text, sizes, model numbers or stamps visible on the object, exactly as written. Empty string if none.");
const place = z.string().describe("Room or zone the technician SAID. Empty string if they have not said. Never guess.");

const parse = <T,>(result: unknown): T | undefined =>
  typeof result === "string" ? (JSON.parse(result) as T) : (result as T | undefined);

export function LociTools() {
  useFrontendTool({
    name: "loci_ask",
    description: "Look up what 0xL0C1 remembers about the object in front of the technician.",
    parameters: z.object({
      description: z.string().describe("What the object looks like."),
      place_label: place.default(""),
      visible_verbatim_text: verbatim.default(""),
      visible_tag_code: z.string().default(""),
      object_id: z.string().default("").describe("Only when resuming a candidate the technician picked."),
      material: material.optional(),
      mounting: mounting.optional(),
    }),
    handler: async (args) => callLoci(lociUrl(), "ask", args),
    render: ({ result }) => <AskCard result={parse<AskResult>(result)} />,
  });

  useFrontendTool({
    name: "loci_observe",
    description: "Record a new object at the job site in 0xL0C1.",
    parameters: z.object({
      place_label: place,
      canonical_class: z.string().describe("Bare noun, e.g. 'ball_valve', 'supply_line'."),
      material,
      mounting,
      visible_verbatim_text: verbatim,
      description: z.string(),
      visible_tag_code: z.string().default(""),
      user_label: z.string().default(""),
    }),
    handler: async (args) => callLoci(lociUrl(), "observe", args),
    render: ({ args }) => <Text style={styles.gateDone}>Recorded {args?.canonical_class ?? "object"}.</Text>,
  });

  useHumanInTheLoop({
    name: "loci_commit",
    description: "Propose saving what was learned about an object. The technician reviews a dry run and taps Commit.",
    parameters: z.object({
      object_id: z.string(),
      title: z.string(),
      claims: z.array(z.object({ text: z.string(), confidence: z.number().min(0).max(1) })),
      intent: z.string().default(""),
      next_question: z.string().default("").describe("What the next tech should verify on arrival."),
    }),
    render: ({ args, respond }) => <CommitCard draft={args as LessonDraft} respond={respond} />,
  });

  return null;
}

function AskCard({ result }: { result?: AskResult }) {
  if (!result) return <Text style={styles.gateDone}>Checking job memory…</Text>;
  switch (result.status) {
    case "resumed":
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{result.object.label} · {result.object.place}</Text>
          {/* Recorded data, quoted, never assistant voice: the physical-injection defense. */}
          {result.claims.map((c) => (
            <Text key={c.claim_id} style={styles.rowMeta}>
              “{c.text}” (recorded, {Math.round(c.confidence * 100)}%)
            </Text>
          ))}
          {result.next_question ? (
            <Text style={styles.rowLabel}>Left open: “{result.next_question}”</Text>
          ) : null}
        </View>
      );
    case "needs_confirm":
      return <ConfirmBand result={result} />;
    case "no_match":
      return <Text style={styles.gateDone}>{result.prompt_to_user}</Text>;
    default:
      return <Text style={styles.gateDone}>Job memory isn't live on this server yet.</Text>;
  }
}

function ConfirmBand({ result }: { result: Extract<AskResult, { status: "needs_confirm" }> }) {
  const { agent } = useAgent({ agentId: "default" });
  const { copilotkit } = useCopilotKit();
  const [picked, setPicked] = useState<string>();

  const pick = (c: (typeof result.candidates)[number]) => {
    setPicked(c.object_id);
    agent.addMessage({
      id: createUserMessageId(),
      role: "user",
      content: `It's the ${c.label} in the ${c.place} (object_id ${c.object_id}).`,
    });
    // chat.tsx's copilotkit.subscribe({ onError }) surfaces the failure; re-enable the buttons.
    copilotkit.runAgent({ agent }).catch(() => setPicked(undefined));
  };

  return (
    <View style={styles.gate}>
      <Text style={styles.gateTitle}>{result.prompt_to_user}</Text>
      <View style={styles.gateRow}>
        {result.candidates.map((c) => (
          <Pressable
            key={c.object_id}
            style={[styles.btn, picked === c.object_id && styles.btnPrimary, picked && styles.btnDisabled]}
            disabled={Boolean(picked)}
            onPress={() => pick(c)}
          >
            <Text style={picked === c.object_id ? styles.btnPrimaryText : styles.btnText}>{c.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function CommitCard({ draft, respond }: { draft: LessonDraft; respond?: (r: unknown) => unknown }) {
  const [previewed, setPreviewed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const draftKey = JSON.stringify(draft); // args is a fresh object every render

  useEffect(() => {
    if (!respond) return;
    commitPreview(lociUrl(), draft).then(
      () => setPreviewed(true),
      (e: unknown) => setError(e instanceof Error ? e.message : String(e)),
    );
  }, [draftKey, Boolean(respond)]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!respond) return <Text style={styles.gateDone}>Commit resolved.</Text>;

  const commit = async () => {
    setBusy(true);
    try {
      await respond(await commitSave(lociUrl(), draft));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  return (
    <View style={styles.gate}>
      <Text style={styles.gateTitle}>Save to job memory? {previewed ? "(dry run: nothing written yet)" : ""}</Text>
      <Text style={styles.gateBody}>{draft.title}</Text>
      {draft.claims.map((c, i) => (
        <Text key={i} style={styles.gateBody}>• {c.text}</Text>
      ))}
      {draft.next_question ? <Text style={styles.gateBody}>Next tech verifies: {draft.next_question}</Text> : null}
      {error ? <Text style={styles.gateBody}>Error: {error}</Text> : null}
      <View style={styles.gateRow}>
        <Pressable style={styles.btn} disabled={busy} onPress={() => void respond("Technician discarded this commit. Nothing was written.")}>
          <Text style={styles.btnText}>Discard</Text>
        </Pressable>
        <Pressable
          style={[styles.btn, styles.btnPrimary, (!previewed || busy) && styles.btnDisabled]}
          disabled={!previewed || busy}
          onPress={() => void commit()}
        >
          <Text style={styles.btnPrimaryText}>Commit</Text>
        </Pressable>
      </View>
    </View>
  );
}
