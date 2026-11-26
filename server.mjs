#!/usr/bin/env node

import { randomInt } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';

const cards = JSON.parse(readFileSync(new URL('./cards.json', import.meta.url), 'utf8'));
const version = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version;
const origin = 'https://www.unmei-tarot.com';
const locale = z.enum(['en', 'ja']).default('en');
const spreads = {
  en: {
    'one-card': { positions: ['Message'], path: 'one-card-tarot' },
    'past-present-future': { positions: ['Past', 'Present', 'Future'], path: 'spreads/time-flow' },
  },
  ja: {
    'one-card': { positions: ['メッセージ'], path: 'one-card-tarot' },
    'past-present-future': { positions: ['過去', '現在', '未来'], path: 'spreads/time-flow' },
  },
};
const readOnly = { readOnlyHint: true, destructiveHint: false, openWorldHint: false };
const normalize = (name) => name.normalize('NFKC').trim().toLowerCase().replace(/^the\s+/, '').replace(/[\s_-]+/g, '');
const cardAliases = Object.fromEntries(cards.flatMap((card) => [
  [card.id, card],
  [card.en.name, card],
  [card.ja.name, card],
  ...card.ja.name.split(/[〈〉]/).filter(Boolean).map((name) => [name, card]),
]).map(([alias, card]) => [normalize(alias), card]));

function response(data, isError = false) {
  return { content: [{ type: 'text', text: JSON.stringify(data) }], ...(isError && { isError: true }) };
}

function createServer() {
  const server = new McpServer(
    { name: 'unmei-tarot', version, websiteUrl: `${origin}/en` },
    { instructions: 'Use the meanings as reference. The optional reading URLs open Unmei Tarot in a browser.' },
  );

  server.registerTool('lookup_tarot_card', {
    title: 'Look Up a Tarot Card',
    description: 'Find the upright and reversed meanings of a Rider–Waite–Smith card by English name, Japanese name or card ID.',
    inputSchema: z.object({ card: z.string().trim().min(1).max(100), locale }),
    annotations: { ...readOnly, idempotentHint: true },
  }, ({ card, locale: language }) => {
    const match = Object.hasOwn(cardAliases, normalize(card)) ? cardAliases[normalize(card)] : undefined;
    if (!match) {
      return response({
        message: language === 'ja' ? 'カードが見つかりませんでした。カードの正式名を試してください。' : 'Card not found. Try the full card name.',
        guideUrl: `${origin}/${language}/${language === 'ja' ? 'tarot-card-ichiran' : 'tarot-card-meanings'}`,
      }, true);
    }
    return response({ id: match.id, ...match[language] });
  });

  server.registerTool('draw_tarot_cards', {
    title: 'Draw Tarot Cards',
    description: 'Draw one card or a past–present–future spread. Returns unique cards, their orientations and concise meanings.',
    inputSchema: z.object({
      spread: z.enum(['one-card', 'past-present-future']).default('one-card'),
      includeReversals: z.boolean().default(false),
      locale,
    }),
    annotations: { ...readOnly, idempotentHint: false },
  }, ({ spread, includeReversals, locale: language }) => {
    const layout = spreads[language][spread];
    const remaining = [...cards];
    const drawn = layout.positions.map((position) => {
      const [card] = remaining.splice(randomInt(remaining.length), 1);
      const orientation = includeReversals && randomInt(2) ? 'reversed' : 'upright';
      const details = card[language];
      return { position, id: card.id, name: details.name, orientation, meaning: details[orientation], url: details.url };
    });
    return response({ spread, cards: drawn, readingUrl: `${origin}/${language}/${layout.path}` });
  });
  return server;
}

await serveStdio(createServer);
