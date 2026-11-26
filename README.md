# Unmei Tarot integrations

Draw cards, look up their upright and reversed meanings, or choose a spread for the question you want to ask. The reference meanings come from the Rider–Waite–Smith card guides at [Unmei Tarot](https://www.unmei-tarot.com/en) / [運命タロット](https://www.unmei-tarot.com/ja).

## Agent Skill

```sh
npx skills add TJLDC/unmei-tarot-integrations --skill tarot-reading-guide
```

Use the skill to turn a broad question into a reading, choose a spread, or interpret cards you've drawn.

For Claude Code, add the marketplace and install the guide:

```text
/plugin marketplace add TJLDC/unmei-tarot-integrations
/plugin install unmei-tarot@unmei-tarot
```

## MCP server

The stdio server runs locally on Node.js 20+. It needs no account, API key or hosted endpoint. It works offline after installation.

```sh
git clone https://github.com/TJLDC/unmei-tarot-integrations.git
cd unmei-tarot-integrations
npm ci
```

Set the MCP host's command to `node` and its first argument to the absolute path to `server.mjs` in the clone. For a host that uses an `mcpServers` block:

```json
{
  "mcpServers": {
    "unmei-tarot": {
      "command": "node",
      "args": ["/absolute/path/to/unmei-tarot-integrations/server.mjs"]
    }
  }
}
```

- `lookup_tarot_card` accepts a card name in either language or a card ID, such as `the-fool`, plus optional `locale` (`en` or `ja`).
- `draw_tarot_cards` takes optional `spread` (`one-card` or `past-present-future`), `locale`, and `includeReversals`. Cards are drawn without replacement.

Results include links to the relevant card entries or reading page. The server does not collect or transmit questions or personal information. A reading page opens the separate web experience.

Browse the reference guides in [English](https://www.unmei-tarot.com/en/tarot-card-meanings) or [日本語](https://www.unmei-tarot.com/ja/tarot-card-ichiran).
