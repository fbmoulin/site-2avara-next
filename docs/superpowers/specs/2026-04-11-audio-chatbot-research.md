# Audio Chatbot Research — site-2avara-next

**Date:** 2026-04-11
**Status:** Research complete, ready for brainstorming + planning
**Context:** 5-10 users first 2 months. Primary: accessibility (hearing/vision impaired). Secondary: any user who prefers voice.

## Speech-to-Text (STT) API Comparison

| Provider | Model | Pricing | PT-BR Support | Real-time | Latency | Key Feature |
|----------|-------|---------|---------------|-----------|---------|-------------|
| **OpenAI Whisper** | whisper-1 | $0.006/min | Good (8-15% WER) | No (batch only) | 2-5s | Highest accuracy, simplest API. Already in stack (OpenAI SDK). |
| **Deepgram** | Nova-3 | $0.0077/min (mono), $0.0092/min (multi) | Good (code-switching) | Yes (streaming) | <300ms | $200 free credits (~433hrs). Real-time streaming. Per-second billing. |
| **Gladia** | Solaria-1 | $0.0092/min (starter) | Good (94% WAR, 6% WER) | Yes (103ms partial) | 103ms | Fastest real-time. 100+ languages. Bundled diarization. |
| **AssemblyAI** | Universal-2 | $0.012/min | Good | Yes (300ms) | 300ms | 30% fewer hallucinations than Whisper v3. Best formatting. |
| **Google Cloud STT** | Chirp 2 | $0.016/min | Good | Yes | ~200ms | Enterprise SLA. Best for regulated environments. |
| **Web Speech API** | Browser native | FREE | Varies by browser | Yes | <100ms | Zero cost, no API key. Chrome/Edge only. Requires internet. |

### Recommendation for STT
**Primary: OpenAI Whisper** — already in the stack (SDK installed), simplest integration, excellent PT-BR accuracy. Batch-only is fine for short messages (5-15 sec).
**Fallback/future: Deepgram Nova-3** — if real-time streaming needed, $200 free credits, best price/performance for PT-BR.
**Zero-cost option: Web Speech API** — free, no API, but Chrome-only and unreliable for PT-BR.

## Text-to-Speech (TTS) API Comparison

| Provider | Model | Pricing | PT-BR Quality | Streaming | Voices | Key Feature |
|----------|-------|---------|---------------|-----------|--------|-------------|
| **OpenAI TTS** | tts-1 / tts-1-hd | $15/1M chars | Decent (English-optimized voices) | Yes (audio/mpeg) | 9 (alloy, nova, echo...) | Already in stack. Simplest integration. |
| **ElevenLabs** | Multilingual v2 | $0.30/1K chars ($99/mo Pro) | Good (native PT-BR voices) | Yes | 380+ | Best voice quality. Voice cloning. Next.js starter kit. Free: ~10min/mo. |
| **Fish Audio** | Fish Speech S1 | $15/1M UTF-8 bytes | Tier 2 support | Yes | 2M+ community | 15-sec voice cloning. Cheapest cloning option. Free: ~7min/mo. |
| **Google Cloud TTS** | WaveNet/Neural2 | $16/1M chars | Good (native PT-BR voices) | Yes | 380+ across 50+ langs | Best multilingual coverage. Strongest PT-BR natural voices. |
| **Amazon Polly** | Neural | $16/1M chars | Decent | Yes | Limited | Reliable but mechanical. AWS ecosystem lock-in. |
| **Web Speech API** | Browser native | FREE | System-dependent | No (synchronous) | OS voices | Zero cost. Quality varies wildly by OS/browser. |

### Recommendation for TTS
**Primary: OpenAI TTS (tts-1)** — already in stack, streaming supported, ~$0.03 per response. Good enough for short judicial responses.
**Upgrade: ElevenLabs** — if voice quality feedback is negative. Next.js starter available. $99/mo Pro tier.
**Zero-cost: Web Speech API** — browser's built-in SpeechSynthesis. Free but inconsistent PT-BR quality.

## Voice Conversation (Speech-to-Speech) Options

| Provider | Model | Pricing | Latency | Key Feature |
|----------|-------|---------|---------|-------------|
| **xAI Grok Voice** | grok-voice-agent | $0.05/min (all-in) | <1s TTFA | #1 Big Bench Audio. OpenAI Realtime compatible. Legal terminology trained. 6x cheaper than OpenAI. |
| **OpenAI Realtime API** | gpt-realtime | $0.06/min input + $0.24/min output (~$0.30/min) | <500ms | Native speech-to-speech. WebSocket. Function calling mid-conversation. Non-verbal cue detection. |
| **ElevenLabs Agents** | Conversational AI | $99/mo (Pro) | <300ms | Full voice agent platform. Next.js SDK. Built-in tool calling. |

### Not recommended for Phase 1 — overkill for 5-10 users. Consider after usage validation.

## xAI Grok Voice Agent API (NEW — April 2026)

| Feature | Detail |
|---------|--------|
| **Pricing** | $0.05/min (voice), text: $0.20/1M input + $0.50/1M output (Grok 4.1 Fast) |
| **Latency** | <1 sec time-to-first-audio (5x faster than nearest competitor) |
| **Quality** | #1 on Big Bench Audio benchmark. In-house VAD + tokenizer + audio models |
| **Voices** | Ara, Eve, Leo — natural, domain-specific pronunciation (healthcare, finance, legal) |
| **Languages** | 100+ languages (Portuguese not explicitly confirmed but likely included) |
| **Protocol** | OpenAI Realtime API compatible — `wss://api.x.ai/v1/realtime` (just change base URL) |
| **Integration** | Works with OpenAI client SDKs, LiveKit plugin, LiteLLM. Max 30 min/session, 100 concurrent. |
| **Upcoming** | Standalone STT + TTS endpoints coming soon |

### Why Grok Voice is interesting for this project:
1. **OpenAI compatible** — swap base URL to `wss://api.x.ai/v1/realtime`, use same SDK
2. **Legal domain pronunciation** — explicitly trained for healthcare/finance/legal terminology
3. **Cheapest voice agent** — $0.05/min vs OpenAI Realtime's $0.30/min (6x cheaper)
4. **LiteLLM compatible** — already in the broader stack (kratos projects use LiteLLM)
5. **Performance** — fastest time-to-first-audio in market

### Consideration:
- PT-BR not explicitly confirmed (but 100+ languages, high likelihood)
- Realtime API approach (Option C) — more complex than Option B
- 30 min session limit (fine for chatbot conversations)
- Need to test PT-BR voice quality before committing

## Architecture Recommendation: Option B (Voice Input + TTS Output)

```
User clicks 🎤 → MediaRecorder captures WebM
    → POST /api/transcribe (Whisper) → text
    → existing chat pipeline (GPT-4o-mini SSE)
    → response text → POST /api/synthesize (TTS) → audio/mpeg
    → Web Audio API playback + text displayed simultaneously
```

### Files to create:
1. `app/api/transcribe/route.ts` — Whisper endpoint (~50 lines)
2. `app/api/synthesize/route.ts` — TTS endpoint (~40 lines)
3. `components/voice-recorder.tsx` — MediaRecorder wrapper + mic UI (~120 lines)
4. `components/audio-player.tsx` — Web Audio playback + controls (~80 lines)
5. Extend `lib/openai.ts` — `transcribeAudio()` + `synthesizeSpeech()` functions
6. Extend `components/chatbot.tsx` — voice toggle button + audio states

### Dependencies: NONE new. OpenAI SDK (v6.34.0) already installed. Browser APIs native.

## Cost Estimate (5-10 users, 2 months)

| Component | Calculation | Monthly Cost |
|-----------|-------------|-------------|
| Whisper STT | ~5 conversations/day × 5 msgs × 10 sec = 250 min/mo | $1.50 |
| TTS Output | ~500 responses/mo × 100 chars avg = 50K chars | $0.75 |
| GPT-4o-mini | Already paid (text pipeline unchanged) | $0 incremental |
| **Total** | | **~$2.25/mo** |

Realistic upper bound (20 conv/day): ~$10-15/mo

### Option C alternative cost (xAI Grok Voice Agent):
| Component | Calculation | Monthly Cost |
|-----------|-------------|-------------|
| Grok Voice Agent | ~5 conv/day × 3 min avg = 15 min/day × 30 = 450 min/mo | $22.50 |

More expensive than Option B but delivers real-time bidirectional voice with zero latency gap.

## Strategy Summary

| Phase | Approach | Cost/mo | Complexity |
|-------|----------|---------|------------|
| **Phase 1 (now)** | Option B: Whisper + TTS (OpenAI only) | ~$2-15 | Low — 6 files, 0 new deps |
| **Phase 2 (if latency complaint)** | Option C: xAI Grok Voice Agent | ~$22-45 | Medium — WebSocket, new API key |
| **Phase 3 (if quality complaint)** | Upgrade TTS to ElevenLabs | +$99/mo | Low — swap TTS provider |

## WCAG Accessibility Requirements

- **1.4.2 Audio Control**: TTS >3 sec must have pause/stop button
- **2.1.1 Keyboard**: All voice UI accessible via Tab + Enter
- **2.4.7 Focus Visible**: Clear focus indicators on voice controls
- **Multimodal**: Text always displayed alongside audio (already done by text chat)
- **Error recovery**: Mic permission denied → clear message + text fallback
- **Visual feedback**: Recording (animated mic + timer), Processing (spinner), Playback (play/pause + progress)
- **ARIA**: `aria-label` on all audio controls, `aria-live="polite"` for status announcements

## Government Compliance Note
- ADA Title II WCAG 2.1 AA compliance deadline: April 24, 2026
- Legal/judicial services specifically mentioned as required accessible services
- Voice interface is a strong accessibility signal for court portals

## Sources

### STT
- [Deepgram Best STT APIs 2026](https://deepgram.com/learn/best-speech-to-text-apis-2026)
- [AssemblyAI Real-time STT 2026](https://www.assemblyai.com/blog/best-api-models-for-real-time-speech-recognition-and-transcription)
- [Deepgram Nova-3 Pricing](https://deepgram.com/pricing)
- [Deepgram Portuguese Model](https://deepgram.com/learn/ola-enhanced-portuguese-beta-speech-to-text-language-model-now-available)
- [Gladia Pricing](https://www.gladia.io/pricing)
- [Gladia vs Whisper](https://www.gladia.io/blog/openai-whisper-api-vs-gladia-a-technical-comparison-for-production-speech-to-text)
- [Web Speech API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [SpeechRecognition Browser Support](https://caniuse.com/speech-recognition)

### TTS
- [Speechmatics Best TTS 2026](https://www.speechmatics.com/company/articles-and-news/best-tts-apis-in-2025-top-12-text-to-speech-services-for-developers)
- [Gladia Best TTS 2026](https://www.gladia.io/blog/best-tts-apis-for-developers-in-2026-top-7-text-to-speech-services)
- [ElevenLabs API Pricing](https://elevenlabs.io/pricing/api)
- [ElevenLabs Next.js Guide](https://elevenlabs.io/docs/eleven-agents/guides/quickstarts/next-js)
- [Fish Audio TTS Pricing](https://fish.audio/blog/text-to-speech-api-comparison-pricing-features/)
- [Fish Audio Blog Comparison](https://fish.audio/blog/cheapest-text-to-speech-api-developers/)

### Realtime Voice
- [OpenAI Realtime API Docs](https://platform.openai.com/docs/guides/realtime)
- [OpenAI gpt-realtime Announcement](https://openai.com/index/introducing-gpt-realtime/)
- [OpenAI Pricing](https://developers.openai.com/api/docs/pricing)
- [Inworld Best Speech-to-Speech 2026](https://inworld.ai/resources/best-speech-to-speech)

### xAI Grok Voice
- [Grok Voice Agent API Announcement](https://x.ai/news/grok-voice-agent-api)
- [Voice Agent API Docs](https://docs.x.ai/developers/model-capabilities/audio/voice-agent)
- [Voice API Guide](https://docs.x.ai/docs/guides/voice)
- [xAI Models & Pricing](https://docs.x.ai/developers/models)
- [LiteLLM xAI Realtime Support](https://docs.litellm.ai/docs/providers/xai_realtime)
- [LiveKit xAI Plugin](https://docs.livekit.io/agents/models/realtime/plugins/xai/)
- [xAI Pricing Comparison](https://intuitionlabs.ai/articles/ai-api-pricing-comparison-grok-gemini-openai-claude)

### Accessibility
- [SiteLint Accessible Chatbots](https://www.sitelint.com/blog/making-chatbots-accessible-a-guide-to-enhance-usability-for-users-with-disabilities)
- [Inaza WCAG Voice/Chat](https://www.inaza.com/blog/accessibility-in-ai-customer-service-wcag-for-voice-chat)
- [ADA Title II 2026 Compliance](https://www.sdettech.com/blogs/ada-title-ii-digital-accessibility-2026-wcag-2-1-aa)
- [WCAG 2.1 AA Standards](https://www.levelaccess.com/compliance-overview/wcag-web-content-accessibility-guidelines/)
