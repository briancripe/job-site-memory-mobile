# S1 image transport verdict

## Question

Can this repository send one real camera JPEG through CopilotKit React Native 1.70.1 and its
`/api/mobile-copilotkit` runtime to a vision-capable model, then transcribe the image in under
about 10 seconds?

## Method

This was a deliberately narrow package-boundary probe because no physical camera, model
credential, or live runtime was available.

1. Installed the locked workspace dependencies offline and inspected the exact shipped sources
   for `@copilotkit/react-native@1.70.1`, `@ag-ui/core@0.0.59`, and
   `@ag-ui/client@0.0.59`.
2. Parsed a user message containing each planned shape with the shipped
   `UserMessageSchema`: image/data, legacy binary/data, and image/URL.
3. Added each message to a real `HttpAgent` and captured its generated POST body with a fake
   `fetch`. The fetch stopped before any network request; this tested serialization only.
4. Checked the repository and execution environment for the runtime route, camera package,
   device tooling, model selection, credentials, and runtime URL.

No product code, camera feature, provider request, or broad test matrix was added.

## Evidence

### Transport shape supported

The preferred shape is:

```ts
{
  type: "image",
  source: { type: "data", value: base64Jpeg, mimeType: "image/jpeg" },
}
```

- The installed AG-UI schema declares image inputs with either a base64 `data` source or a
  `url` source (`@ag-ui/core/dist/index.d.ts`, lines 134-184).
- CopilotKit RN's own submit path builds the same `InputContent[]`, calls
  `agent.addMessage`, then `copilotkit.runAgent` (`@copilotkit/react-native/src/CopilotChat.tsx`,
  lines 238-269). Its shipped integration test asserts the same image/data shape
  (`src/__tests__/attachments-integration.test.tsx`, lines 251-274).
- The schema probe accepted all three planned candidates. A real `HttpAgent` retained their
  MIME type and payload location in the JSON request body:

  | Candidate | Schema | Captured POST body |
  | --- | --- | --- |
  | `image` + `source.data` | accepted | `type=image`, sentinel base64 retained, `image/jpeg` retained |
  | legacy `binary` + `data` | accepted | `type=binary`, sentinel base64 retained, `image/jpeg` retained |
  | `image` + `source.url` | accepted | `type=image`, URL retained, `image/jpeg` retained |

The sentinel was only a short JPEG-header base64 string (`/9j/4AAQSkZJRg==`), not a real image.
This proves the client-side shape and HTTP serialization boundary, not that model-visible pixels
arrive at a provider.

### Real-camera/live-model GO unproven

- `apps/web` is absent, so this repository has no `/api/mobile-copilotkit` route to receive the
  captured POST.
- `expo-camera` is absent. No `xcrun`, `adb`, or `/dev/video*` camera device was available.
- `MODEL_PROVIDER`, `MODEL`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `NVIDIA_API_KEY`, and
  `EXPO_PUBLIC_RUNTIME_URL` were all unset.
- Therefore no camera payload size, model name, provider-side pixel observation, transcription,
  or round-trip latency exists to report. In particular, the under-10-second target was not
  measured.

## Verdict

**NO-GO for the current hackathon camera/vision path.** The transport shape is supported through
CopilotKit RN's client-side HTTP boundary, but the required real-camera/live-model GO is unproven
and cannot be claimed from this baseline. This is an environment/runtime NO-GO, not evidence that
the image/data protocol shape fails.

## Recommendation

Proceed with S2 and the hackathon MVP as text-first. Use the preferred image/data shape above when
the runtime shell and a device become available; then perform exactly one manual camera smoke run
to record real JPEG size, model, provider pixel receipt, transcription, and latency. Keep the URL
shape as the first fallback. Do not spend hackathon time on the legacy binary shape or a larger
image test matrix unless that single smoke run fails.
