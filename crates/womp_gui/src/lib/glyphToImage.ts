import { Image } from '@tauri-apps/api/image';
import emojiRegex from 'emoji-regex';

type GlyphType = "emoji" | "fluent" | "other";

const FLUENT_PUA_RANGES = [
  { start: 0xe700, end: 0xe900 },
  { start: 0xea00, end: 0xec00 },
  { start: 0xed00, end: 0xef00 },
  { start: 0xf000, end: 0xf200 },
  { start: 0xf300, end: 0xf500 },
  { start: 0xf600, end: 0xf800 },
];

async function unicodeToPng(glyph: string, size: number, color: string): Promise<Uint8Array> {
  const codePoint = glyph.charCodeAt(0);
  const isFluentPua = FLUENT_PUA_RANGES.some(range => codePoint >= range.start && codePoint <= range.end);
  const isEmoji = emojiRegex().test(glyph);
  const glyphType: GlyphType = isFluentPua ? "fluent" : isEmoji ? "emoji" : "other";
  console.log(`Glyph ${glyph} is ${glyphType}`);

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.clearRect(0, 0, size, size);
  ctx.font = `16px "Segoe Fluent Icons", "Segoe UI Emoji", "Segoe UI Symbol", "Segoe UI"`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  ctx.fillText(glyph, size / 2, size / 2 - (glyphType === "emoji" ? 2 : 0));

  const dataUrl = canvas.toDataURL('image/png');

  const base64 = dataUrl.split(',')[1];
  const binaryString = atob(base64);
  const bytes = Uint8Array.from(binaryString, c => c.charCodeAt(0));

  return bytes;
}

export async function glyphToImage(glyph = "\uE7F4", size = 16, color = "white"): Promise<Image> {
  try {
    const pngData = await unicodeToPng(glyph, size, color);

    if (!pngData) {
      throw new Error('Failed to convert glyph to PNG');
    }

    return await Image.fromBytes(pngData);
  } catch (error) {
    console.error(`Failed to load icon: ${error}`);
    throw error;
  }
}
