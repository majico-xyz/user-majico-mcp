# user-majico MCP server

MCP server for [Majico.xyz](https://majico.xyz): read (and limited write) tools so coding agents can pull brand guidelines, design tokens, studio canvas, and export manifests.

**Requirements:** Majico account with tokens. Cursor humans connect via **OAuth** (no API key in `mcp.json`). API keys are for automation/stdio only.

## Install

```bash
npx -y user-majico-mcp@0.4.1
```

## Environment variables (v0.2+)

Set once in MCP config — tools do not require `projectId` / `apiKey` on every call:

| Variable            | Description                                                                     |
| ------------------- | ------------------------------------------------------------------------------- |
| `MAJICO_API_URL`    | API base (default `http://localhost:3000`; production `https://api.majico.xyz`) |
| `MAJICO_PROJECT_ID` | Project UUID                                                                    |
| `MAJICO_API_KEY`    | Project API key                                                                 |

Per-call overrides in tool arguments still work.

## Tools

| Tool                       | Description                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `get_brand_profile`        | Archetypes, niche intent                                                                              |
| `get_design_tokens`        | Palette and fonts                                                                                     |
| `get_logo_svg`             | Selected logo SVG                                                                                     |
| `get_guidelines`           | Markdown + LLM prompt                                                                                 |
| `get_design_md`            | DESIGN.md markdown                                                                                    |
| `get_studio_canvas`        | Studio canvas snapshot                                                                                |
| `get_export_manifest`      | Export file list                                                                                      |
| `download_export_zip`      | Full BRAND.md / DESIGN.md / tokens ZIP (base64 in MCP response)                                       |
| `submit_brief`             | Submit product brief + enqueue niche research                                                         |
| `update_studio_html_frame` | Patch one `htmlFrame` (requires `elementId`, `html`)                                                  |
| `generate_asset`           | Enqueue harness jobs (`landing-page`, `investor-pack`, `investor-one-pager`, `investor-data-room`, …) |
| `get_asset_status`         | Poll harness job status                                                                               |

### Cursor agent example: `generate_asset` for investor pack

After brand chain, palette, GTM, team, and traction are ready:

```json
{
  "tool": "generate_asset",
  "arguments": {
    "skillId": "investor-pack",
    "params": {
      "team": {
        "members": [
          { "name": "Alex Kim", "role": "CEO", "bio": "ex-Stripe PM" }
        ]
      },
      "traction": {
        "metrics": [{ "label": "Waitlist", "value": "1,200" }]
      },
      "includeSlides": ["financials"]
    }
  }
}
```

Poll with `get_asset_status({ jobId })`. Preflight failures return HTTP 422 with `code: "investor_pack_preflight_blocked"` and a `blocked` reason (`brand`, `gtm`, `team`, `traction`, …).

### Phase 2: one-pager and data room (after deck exists on canvas)

```json
{
  "tool": "generate_asset",
  "arguments": {
    "skillId": "investor-one-pager"
  }
}
```

```json
{
  "tool": "generate_asset",
  "arguments": {
    "skillId": "investor-data-room"
  }
}
```

Both require a `harness-investor-pack` element on the Studio canvas (generate `investor-pack` first). Without a deck, jobs return a stub with `canvasUrl` pointing to finish the deck.

## Cursor `.cursor/mcp.json` (OAuth — preferred)

```json
{
  "mcpServers": {
    "majico": {
      "url": "https://api.majico.xyz/mcp"
    }
  }
}
```

Complete **Connect** in Cursor Settings → MCP. Use `list_projects` and pass `projectId` on tool calls to switch scope.

## Cursor `.cursor/mcp.json` (stdio — automation / local)

```json
{
  "mcpServers": {
    "majico": {
      "command": "npx",
      "args": ["-y", "user-majico-mcp@0.4.1"],
      "env": {
        "MAJICO_API_URL": "https://api.majico.xyz",
        "MAJICO_PROJECT_ID": "<uuid>",
        "MAJICO_API_KEY": "<key>"
      }
    }
  }
}
```

## HTTP MCP (hosted)

**OAuth (Cursor humans):** `https://api.majico.xyz/mcp` — Connect in Cursor; no headers in `mcp.json`.

**API key (automation only):**

```
Authorization: Bearer <project_api_key>
X-Majico-Project-Id: <uuid>
```

## Development

```bash
cd packages/user-majico-mcp
npm install
npm run build
npm test
```

## License

MIT
