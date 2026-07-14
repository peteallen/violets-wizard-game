import { isSupportedCaption } from './vocabulary.js';

const VISIBLE_UI_WORD = /[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu;

export function isAllowedChildFacingUiText(text, role) {
  const value = String(text ?? '').trim();
  if (!value) return false;
  if (role === 'parent' || role === 'story-object' || role === 'proper-name') return true;

  const wordCount = value.match(VISIBLE_UI_WORD)?.length ?? 0;
  if (role === 'symbol') return wordCount === 0;
  return (role === 'caption' || role === 'action') && isSupportedCaption(value);
}

export function childFacingUiText(text, role) {
  const value = String(text ?? '').trim();
  return isAllowedChildFacingUiText(value, role) ? value : '';
}
