import React from 'react';
import { CustomTextHighlight } from '../utils/storage';

interface HighlightableTextProps {
  text?: string;
  highlights?: CustomTextHighlight[];
  className?: string;
  style?: React.CSSProperties;
}

// Helper to check if a character is a letter or number (supports English & Vietnamese unicode)
const isWordChar = (char: string | undefined): boolean => {
  if (!char) return false;
  return /[\p{L}\p{N}]/u.test(char);
};

// Expand a highlight item into all candidate search terms (full text + any cross-element subParts / '=' splits)
function getCandidateTerms(h: CustomTextHighlight): string[] {
  const candidates: string[] = [];
  const main = h.text?.replace(/[\u00a0\r\n\t]/g, ' ').replace(/\s+/g, ' ').trim();
  if (main && main.length >= 2) {
    candidates.push(main);
  }
  if (h.subParts && h.subParts.length > 0) {
    for (const part of h.subParts) {
      const clean = part.trim();
      if (clean.length >= 2 && !candidates.some(c => c.toLowerCase() === clean.toLowerCase())) {
        candidates.push(clean);
      }
    }
  } else if (main && main.includes('=')) {
    for (const part of main.split('=')) {
      const clean = part.trim();
      if (clean.length >= 3 && !candidates.some(c => c.toLowerCase() === clean.toLowerCase())) {
        candidates.push(clean);
      }
    }
  }
  return candidates;
}

export const HighlightableText: React.FC<HighlightableTextProps> = ({
  text,
  highlights = [],
  className = '',
  style
}) => {
  if (!text) return null;
  if (!highlights || highlights.length === 0) {
    return <span className={className} style={style}>{text}</span>;
  }

  const lowerText = text.toLowerCase();

  // Assign highlights per character in chronological order so newer highlights cleanly replace overlapping portions
  const charHighlights: (CustomTextHighlight | null)[] = new Array(text.length).fill(null);
  let hasAnyMatch = false;

  for (const h of highlights) {
    const terms = getCandidateTerms(h);
    for (const term of terms) {
      const lowerH = term.toLowerCase();
      if (!lowerText.includes(lowerH)) continue;

      const needsStrictBoundary = lowerH.length <= 3 && !lowerH.includes(' ');
      let startIndex = 0;
      while ((startIndex = lowerText.indexOf(lowerH, startIndex)) !== -1) {
        const endIndex = startIndex + lowerH.length;

        if (needsStrictBoundary) {
          const charBefore = startIndex > 0 ? text[startIndex - 1] : undefined;
          const charAfter = endIndex < text.length ? text[endIndex] : undefined;
          const hasBoundaryBefore = !charBefore || !isWordChar(charBefore);
          const hasBoundaryAfter = !charAfter || !isWordChar(charAfter);
          if (hasBoundaryBefore && hasBoundaryAfter) {
            hasAnyMatch = true;
            for (let i = startIndex; i < endIndex; i++) {
              charHighlights[i] = h;
            }
          }
        } else {
          hasAnyMatch = true;
          for (let i = startIndex; i < endIndex; i++) {
            charHighlights[i] = h;
          }
        }

        startIndex += lowerH.length;
      }
    }
  }

  if (!hasAnyMatch) {
    return <span className={className} style={style}>{text}</span>;
  }

  // Coalesce contiguous characters sharing the same highlight object into flat segments
  const segments: React.ReactNode[] = [];
  let segStart = 0;

  while (segStart < text.length) {
    const currentHl = charHighlights[segStart];
    let segEnd = segStart + 1;
    while (segEnd < text.length && charHighlights[segEnd] === currentHl) {
      segEnd++;
    }

    const sliceStr = text.slice(segStart, segEnd);
    if (!currentHl) {
      segments.push(sliceStr);
    } else {
      const hasBg = currentHl.bgColor && currentHl.bgColor !== 'transparent';
      segments.push(
        <span
          key={`hl-${segStart}`}
          title={currentHl.note ? `📝 Ghi chú: ${currentHl.note}` : undefined}
          style={{
            backgroundColor: hasBg ? currentHl.bgColor : undefined,
            color: hasBg ? currentHl.textColor : (currentHl.textColor && currentHl.textColor !== 'inherit' ? currentHl.textColor : undefined),
            padding: hasBg ? '1px 3px' : undefined,
            borderRadius: hasBg ? '3px' : undefined,
            display: 'inline',
            boxDecorationBreak: 'clone',
            WebkitBoxDecorationBreak: 'clone',
            fontWeight: currentHl.isBold ? 700 : undefined,
            textDecoration: currentHl.isUnderline ? 'underline' : (currentHl.note ? 'underline dotted' : undefined),
            textUnderlineOffset: (currentHl.isUnderline || currentHl.note) ? '2.5px' : undefined,
            fontStyle: currentHl.isItalic ? 'italic' : undefined,
            lineHeight: 'inherit'
          }}
          className={`highlighted-text transition-colors select-word-styled ${
            currentHl.isUnderline
              ? 'decoration-emerald-500 decoration-2'
              : currentHl.note
              ? 'decoration-amber-500'
              : ''
          }`}
        >
          {sliceStr}
        </span>
      );
    }

    segStart = segEnd;
  }

  return (
    <span className={className} style={style}>
      {segments}
    </span>
  );
};
