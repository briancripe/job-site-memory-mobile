# S1: Do camera images reach the model through CopilotKit RN 1.70?

**Time-box:** 45 min · **Blocks:** S2, S3, S4 · **Design risk #1**

## Question

When the Expo app calls `agent.addMessage` with an image content part and `copilotkit.runAgent`,
does the model behind the kit's `/api/mobile-copilotkit` route (a `BuiltInAgent`) actually get the
pixels?

## Why it blocks

The whole mobile pitch is "snap the valve". If images don't flow, the phone is just a chat window
and the Claude app is the better field surface.

## Method

1. Run the unmodified kit: `apps/web` (runtime) plus `apps/mobile` in the iOS simulator. Use a
   vision-capable `MODEL_PROVIDER`/`MODEL`.
2. Hardcode one base64 JPEG of a stamped valve (`3/4 600 WOG`). No camera yet, so this only tests transport.
3. Send the text "Transcribe every stamp on this valve exactly", trying each shape in turn:
   - `{ type: "image", source: { type: "data", value, mimeType: "image/jpeg" } }` (current AG-UI docs)
   - `{ type: "binary", mimeType: "image/jpeg", data }` (older AG-UI)
4. For each shape, record whether it type-checks, whether the runtime rejects it, whether the
   provider request contains the image (log in the route), and whether the reply contains the stamp.
5. If one shape works, replace the hardcoded image with `expo-camera` `takePictureAsync({ base64: true, quality: 0.5 })`
   and note the payload size and round-trip time.

## Go / no-go

- **Go:** the reply transcribes the stamp from a real camera capture, with round-trip under ~10 s on wifi.
- **No-go:** neither shape reaches the model.

## Fallbacks, in order

1. Upload the JPEG to a small route next to the runtime and send a URL-source image part.
2. Text-only phone app. The tech describes the object or reads the stamp aloud, and vision stays
   in the Claude app, as loci's §4b script already does.

## Verdict

_Fill in: shape that worked, payload size, latency, model used._
