import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
const petNameDialogSource = readFileSync(
  new URL('../src/game/core/PetNameDialog.js', import.meta.url),
  'utf8',
);

function rule(selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  return css.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`, 'u'))?.[1] ?? '';
}

describe('painted accessible DOM dialogs', () => {
  it('nine-slices the Field Kit folio without replacing viewport or fallback behavior', () => {
    for (const selector of ['.save-transfer-dialog', '.pet-name-dialog']) {
      const declarations = rule(selector);
      expect(declarations).not.toBe('');
      expect(declarations).toContain('width: min(');
      expect(declarations).toContain('max-height: 100%;');
      expect(declarations).toContain('overflow: auto;');
      expect(declarations).toContain(
        'border-image-source: url("/assets/art/ui/dom/dialog-folio-v2.webp");',
      );
      expect(declarations).toContain('border-image-slice: 18% fill;');
      expect(declarations).toContain('border-image-repeat: stretch;');
      expect(declarations).toContain('#f3e6ca;');
    }

    for (const selector of ['.save-transfer-backdrop', '.pet-name-backdrop']) {
      const declarations = rule(selector);
      expect(declarations).toContain('env(safe-area-inset-top)');
      expect(declarations).toContain('env(safe-area-inset-right)');
      expect(declarations).toContain('env(safe-area-inset-bottom)');
      expect(declarations).toContain('env(safe-area-inset-left)');
      expect(declarations).toContain('overflow: auto;');
    }
  });

  it('uses textless action notes under every live DOM action at the Field Kit target size', () => {
    expect(petNameDialogSource).toContain(
      "submitButton.className = 'pet-name-button pet-name-button-primary';",
    );
    expect(petNameDialogSource).toContain(
      "cancelButton.className = 'pet-name-button pet-name-button-secondary';",
    );

    for (const selector of ['.save-transfer-button', '.pet-name-button']) {
      const declarations = rule(selector);
      expect(declarations).toContain('min-height: 88px;');
      expect(declarations).toContain(
        'url("/assets/art/ui/story-surfaces/action-note-v2.webp")',
      );
      expect(declarations).toContain('background-color:');
      expect(declarations).toContain('background-size: 100% 100%;');
      expect(declarations).not.toContain('filter:');
      expect(declarations).not.toContain('transition:');
    }

    for (const selector of [
      '.save-transfer-button-primary',
      '.save-transfer-button-secondary',
      '.pet-name-button-primary',
      '.pet-name-button-secondary',
    ]) {
      const declarations = rule(selector);
      expect(declarations).toContain('--action-note-overlay:');
      expect(declarations).toContain('color:');
      expect(declarations).toContain('background-color:');
    }
  });

  it('keeps focus, pressed, and semantic feedback independent from the painted pixels', () => {
    for (const selector of [
      '.save-transfer-button:focus-visible',
      '.pet-name-button:focus-visible',
    ]) {
      const declarations = rule(selector);
      expect(declarations).toContain('outline:');
      expect(declarations).toContain('outline-offset:');
      expect(declarations).toContain('box-shadow:');
    }

    for (const selector of ['.save-transfer-button:active', '.pet-name-button:active']) {
      const declarations = rule(selector);
      expect(declarations).toContain('transform: translateY(4px);');
      expect(declarations).toContain('inset 0 -2px 0');
      expect(declarations).toContain('0 1px 0');
      expect(declarations).not.toContain('transition:');
    }

    const success = rule('.save-transfer-status[data-tone="success"]');
    const errors = [
      rule('.save-transfer-status[data-tone="error"]'),
      rule('.pet-name-status[data-tone="error"]'),
      rule('.save-transfer-data[aria-invalid="true"]'),
      rule('.pet-name-input[aria-invalid="true"]'),
    ].join('\n');
    expect(success).toContain('#365d2c;');
    expect(errors).toMatch(/#(?:8b2039|8a2036|9e263d|a33245);/u);
    expect(`${success}\n${errors}`).not.toMatch(/#(?:d6a142|f6d77d);/u);
    expect(css).not.toMatch(/\bfilter\s*:/u);
  });
});
