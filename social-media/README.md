# Bhadaa Social Autopilot (no additional subscription)

**Not enabled until you explicitly opt in.** This is an independent add-on, not part of Bhadaa's application runtime. The production application does not have to be redeployed.

## One-time configuration

1. Sign up to [Buffer](https://buffer.com/), using its free plan. Connect your **X** account and an **Instagram Professional** account supported by Buffer for direct publishing. No passwords or tokens in ChatGPT.
2. Generate a **personal Buffer API key** in Buffer's API settings, and copy the X and Instagram **channel IDs** from the API / your account.
3. Open [Google AI Studio](https://aistudio.google.com/apikey), create an API key in a project with **no billing account / no paid tier**, and verify that `gemini-3.5-flash-lite` is available on its free tier in your project. Google AI Pro consumer subscription does **not** pay for API requests.
4. In your GitHub repo Settings → Secrets and variables → Actions, create repository secrets `GEMINI_API_KEY` and `BUFFER_API_KEY`. Under **Variables**, create `BUFFER_X_CHANNEL_ID` and `BUFFER_INSTAGRAM_CHANNEL_ID`. Do **not** paste secrets into issues, README files, commits, or chats.
5. Set variable `SOCIAL_AUTOPILOT_ENABLED` to `true` to enable daily generation **only**. Leave `SOCIAL_PUBLISH_ENABLED` unset until you've reviewed the generated captions and graphics and verified Buffer channel mapping.
6. Run the workflow manually once from Actions and inspect the `social-media/content/YYYY-MM-DD.json` and `generated/YYYY-MM-DD.png`. After a successful channel-specific test, set `SOCIAL_PUBLISH_ENABLED` to `true` to turn on automatic Buffer scheduling.

## Posting

At 08:40 IST, GitHub Actions prepares one graphic and three distinct pieces of copy, commits the public graphic to the repository, verifies its public URL, then schedules two X posts (10:00 AM and 7:00 PM) and one Instagram image post (2:00 PM) in India Standard Time. The generator deliberately avoids unverified marketing claims and keeps a history of headlines. Buffer's free queue limit applies. Github Actions schedules may run late or be skipped occasionally.

## Cost protection

This workflow never calls paid generative-media endpoints. It generates the graphic with Pillow, not Imagen/Veo. Use **only an unbilled Gemini API project**; requests exceeding the free tier should fail rather than charge you. API access and quotas may vary by region/project, and provider free plans can change.

## Safety and limits

- Publishing starts disabled. The first run is intentionally preview-only.
- Only verified product features are included in prompting; **AI output is not a fact-check**.
- AI-based posts are labeled in the Buffer request. Don't fabricate user testimonials or regulatory advice.
- Post receipts are committed on a best-effort basis. If GitHub fails before receipt persistence, a rerun could create duplicates; check Buffer before rerunning.
- Buffer fetches hosted image URLs later, so keep committed media public until published.
- A static visual accompanies Instagram. Full AI image and cinematic reel generation are **not included** at ₹0 additional guaranteed cost.
- Running X and Instagram consumes 2 of Buffer Free's 3 social channels. Additional separate brand profiles may exceed the free plan.
- For practical troubleshooting, see [Buffer API documentation](https://developers.buffer.com/guides/posts-and-scheduling.html) and [Gemini API model list](https://ai.google.dev/gemini-api/docs/models).

No social connection or API key has been configured by this pull request.
