import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const harnessHtml = readFileSync(new URL('../harness.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
const visualVerification = readFileSync(
  new URL('../src/game/content/visualVerification.js', import.meta.url),
  'utf8',
);
const saveTransferCss = css.match(
  /\.save-transfer-backdrop\s*\{[\s\S]*?(?=\.pet-name-backdrop\s*\{)/u,
)?.[0] ?? '';
const saveTransferChecklist = visualVerification.match(
  /'save-transfer':\s*\[[\s\S]*?\n  \],/u,
)?.[0] ?? '';
const petNameCss = css.match(/\.pet-name-dialog\s*\{[\s\S]*?\.pet-name-owl\s*\{/u)?.[0] ?? '';

describe('DOM Storybook surfaces', () => {
  it('uses the painted owl favicon in both browser entrypoints', () => {
    const favicon = '<link rel="icon" type="image/png" sizes="64x64" href="./assets/art/ui/browser/owl-clasp-icon-v2-64.png" />';
    expect(html).toContain(favicon);
    expect(harnessHtml).toContain(favicon);
  });

  it('uses the painted owl iPad icon with its versioned PNG path', () => {
    expect(html).toContain(
      '<link rel="apple-touch-icon" type="image/png" sizes="180x180" href="./assets/art/ui/browser/owl-clasp-icon-v2-180.png" />',
    );
  });

  it('builds the update owl entirely from layered organic paths', () => {
    const owl = html.match(/<svg class="version-reload-owl"[\s\S]*?<\/svg>/u)?.[0] ?? '';
    expect(owl).not.toBe('');
    expect(owl).not.toMatch(/<(?:circle|ellipse)\b/u);
    for (const layer of [
      'shadow', 'body', 'wing', 'eye', 'iris', 'catchlight', 'beak', 'feathers',
    ]) expect(owl).toContain(`version-reload-owl-${layer}`);
  });

  it('uses asymmetric hand-placed controls instead of perfect rounded DOM pills', () => {
    expect(css).toContain('border-radius: 19px 8px 17px 10px;');
    expect(css).toContain('border-radius: 25px 10px 22px 12px;');
    expect(css).toContain('border-radius: 23px 9px 20px 11px;');
    expect(petNameCss).not.toBe('');
    expect(petNameCss).not.toContain('radial-gradient(circle at 15% 15%');
    expect(petNameCss).not.toContain('content: "✦";');
  });

  it('styles save transfer as tactile storybook materials without clipped geometry or glyph ornament', () => {
    expect(saveTransferCss).not.toBe('');
    expect(saveTransferCss).not.toMatch(/clip-path\s*:|polygon\s*\(/u);
    expect(saveTransferCss).not.toMatch(/content:\s*["'][✦★☆]["']/u);
    expect(saveTransferCss).not.toMatch(/#(?:fff|ffffff)(?![0-9a-f])/iu);
    expect(saveTransferCss).toContain('.save-transfer-dialog::before');
    expect(saveTransferCss).toContain('.save-transfer-dialog::after');
    expect(saveTransferCss).toContain('radial-gradient(ellipse at');
    expect(saveTransferCss).toContain('repeating-linear-gradient');
    expect(saveTransferCss).toContain('border-radius: 38px 12px 34px 16px');
    expect(saveTransferCss).toContain('min-height: 88px;');
    expect(saveTransferCss).toContain('user-select: text;');

    expect(saveTransferChecklist).not.toBe('');
    for (const material of ['organically curved', 'parchment', 'leather', 'brass', 'owl']) {
      expect(saveTransferChecklist).toContain(material);
    }
  });
});
