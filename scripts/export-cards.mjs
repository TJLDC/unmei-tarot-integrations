import { readFileSync, writeFileSync } from 'node:fs';

const origin = 'https://www.unmei-tarot.com';
const guides = {
  en: 'en/topics/tarot-card-meanings.md',
  ja: 'ja/topics/tarot-card-ichiran.md',
};
const source = process.argv[2];
if (!source) throw new Error('Pass the path to frontend/src/content/landing');

function readGuide(locale, guide) {
  const markdown = readFileSync(`${source}/${guide}`, 'utf8');
  const entries = new Map();
  for (const line of markdown.split('\n')) {
    const row = line.match(/^\| \[([^\]]+)\]\((\/[^)]+-tarot-card-meaning)\) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|$/);
    if (!row) continue;
    const [, label, path, , upright, reversed] = row;
    const id = path.split('/').pop().replace(/-tarot-card-meaning$/, '');
    if (!path.startsWith(`/${locale}/articles/`) || entries.has(id)) {
      throw new Error(`Invalid or duplicate path: ${path}`);
    }
    entries.set(id, {
      name: label.replace(/^\d+\s+/, '').split('／')[0],
      upright: upright.trim(),
      reversed: reversed.trim(),
      url: new URL(path, origin).href,
    });
  }
  if (entries.size !== 78) throw new Error(`${guide}: found ${entries.size} unique cards`);
  return entries;
}

const en = readGuide('en', guides.en);
const ja = readGuide('ja', guides.ja);
const cards = Array.from(en, ([id, meaning]) => {
  if (!ja.has(id)) throw new Error(`Missing Japanese card: ${id}`);
  return { id, en: meaning, ja: ja.get(id) };
});
writeFileSync(new URL('../cards.json', import.meta.url), JSON.stringify(cards, null, 2) + '\n');
