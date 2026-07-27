# Permissions Rationale

Every entry in `manifest.json` under `permissions` and `host_permissions` must
have a matching `## <permission>` section below. The `store:check` tests fail
if a permission is added to the manifest without a documented rationale, or if
a rationale is shorter than 60 characters.

The text in each section is what we paste into the Chrome Web Store
"Justification" fields at submission time, so write it for a human reviewer,
not for ourselves.

## storage

The extension persists the most recent usage snapshot, the cached Claude
organization id, and the user's overlay preferences in `chrome.storage.local`
so they survive service worker restarts and tab reloads. Nothing is read from
or written to any other storage backend.

## alarms

A single recurring `chrome.alarms` entry wakes the service worker every five
minutes to re-fetch the usage limits. Without it the on-page overlay would
only update while the popup was open, which defeats the at-a-glance use case.

## cookies

Used to read the `lastActiveOrg` cookie from Claude and the `kimi-auth` cookie
from Kimi Code, solely to make authenticated usage requests for the signed-in
user. Cookie values are never copied off-device and are only read, never written.

## host: https://claude.ai/*

Required to call the authenticated Claude usage endpoints
(`/api/organizations` and `/api/organizations/{id}/usage`) with the user's
existing session cookies, and to mount the on-page overlay next to the chat
input. No requests are made to any other path on this host.

## host: https://chatgpt.com/*

Required to call `/api/auth/session` (to obtain the short-lived access token
the chatgpt.com web app already uses) and `/backend-api/wham/usage` (the rate
limit endpoint), and to mount the on-page overlay on the Codex chat surface.
No other endpoints are accessed.

## host: https://chat.openai.com/*

The legacy ChatGPT host that still resolves for some accounts. Same usage as
`chatgpt.com` above: reading the user's own rate-limit data via their existing
session and rendering the on-page overlay. Kept so signed-in users who land on
the legacy domain see the same experience.

## host: https://platform.minimax.io/*

Required to read the signed-in user's MiniMax Token Plan quota from its own
`/backend/account/token_plan/remains_percent` endpoint using existing browser
cookies. The extension reads quota counters only and sends no prompts or chats.

## host: https://platform.minimaxi.com/*

Required for the China mainland MiniMax Token Plan surface, which uses the
same authenticated quota endpoint and existing browser session as the global
host. It is limited to usage data and never accesses model-generation routes.

## host: https://www.kimi.com/*

Required to read the existing Kimi Code session and fetch its coding-plan
usage endpoint. The extension uses the short-lived authenticated web request
only for quota data and never transmits the session token to another domain.

## host: https://cursor.com/*

Required to call Cursor's signed-in `/api/usage-summary` endpoint with the
user's existing web session. The response contains plan and quota figures only;
the extension neither reads source code nor sends editor or chat content.

## host: https://platform.xiaomimimo.com/*

Required to read the signed-in Xiaomi MiMo balance and token-plan usage from
its console API using existing browser cookies. Requests are limited to balance,
plan detail, and usage endpoints; no generation API is called.
