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

## host: https://z.ai/*

Required to run a small content script on the signed-in z.ai console that reads
the bearer token the page already keeps in its own `localStorage`, so the
extension can query the user's GLM Coding Plan quota. The token stays on the
device and is only ever sent back to z.ai's own API host.

## host: https://api.z.ai/*

Required to call z.ai's `/api/monitor/usage/quota/limit` endpoint — the same one
the z.ai console itself uses — to read the signed-in user's GLM Coding Plan
5-hour and weekly quotas. Only usage counters are read; no model, chat, or
completion endpoint is ever called.

## host: https://open.bigmodel.cn/*

The China mainland host for the same GLM Coding Plan quota endpoint, used when
the account is registered on BigModel rather than the global z.ai platform. Its
access is identical: read-only quota figures for the signed-in user.

## host: https://home.qwencloud.com/*

Required to read the signed-in Qwen Cloud console session token from
`/tool/user/info.json`, which the console's own gateway requires alongside the
existing cookies before it will return the account's Coding Plan quota. Nothing
else on this host is read and the token never leaves the device.

## host: https://cs-data.qwencloud.com/*

The Qwen Cloud data gateway. Required to call the same three read-only
token-plan endpoints the console's billing page uses — subscription, usage, and
quota-config — so the extension can show the account's 5-hour and weekly quota.
No model or generation endpoint is ever called.

## host: https://platform-home.qianwenai.com/*

The China mainland equivalent of the Qwen Cloud console host, used when the
account is registered there instead of on the global site. Access is identical:
reading the console session token needed to authenticate the quota request.

## host: https://cs-data.qianwenai.com/*

The China mainland Qwen data gateway, serving the same read-only token-plan
quota endpoints as the global host for accounts registered in that region.
