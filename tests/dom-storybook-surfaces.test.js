import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
const petNameCss = css.match(/\.pet-name-dialog\s*\{[\s\S]*?\.pet-name-owl\s*\{/u)?.[0] ?? '';

describe('DOM Storybook surfaces', () => {
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
});
