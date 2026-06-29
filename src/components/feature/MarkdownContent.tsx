import { useMemo, createElement, Fragment } from 'react';
import { Link } from 'react-router-dom';

// Generate a clean ID from heading text for anchor links
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

type InlineToken =
  | { type: 'text'; value: string }
  | { type: 'strong'; value: string }
  | { type: 'em'; value: string }
  | { type: 'code'; value: string }
  | { type: 'link'; value: string; href: string; isInternal: boolean };

function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    // Inline code `...`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      tokens.push({ type: 'code', value: codeMatch[1] });
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }
    // Link [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      const href = linkMatch[2];
      const isInternal = href.startsWith('/') || href.startsWith('#');
      tokens.push({ type: 'link', value: linkMatch[1], href, isInternal });
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }
    // Bold **...**
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch) {
      tokens.push({ type: 'strong', value: boldMatch[1] });
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }
    // Italic *...* (but not **)
    const emMatch = remaining.match(/^\*([^*]+)\*/);
    if (emMatch) {
      tokens.push({ type: 'em', value: emMatch[1] });
      remaining = remaining.slice(emMatch[0].length);
      continue;
    }
    // Plain text up to next special char
    const nextSpecial = remaining.search(/[`\[*]/);
    if (nextSpecial === -1) {
      tokens.push({ type: 'text', value: remaining });
      break;
    }
    if (nextSpecial > 0) {
      tokens.push({ type: 'text', value: remaining.slice(0, nextSpecial) });
    }
    remaining = remaining.slice(nextSpecial);
    if (remaining.length > 0 && nextSpecial === 0) {
      // If we're stuck (no match found at position 0), advance one char
      const ch = remaining[0];
      tokens.push({ type: 'text', value: ch });
      remaining = remaining.slice(1);
    }
  }
  return tokens;
}

function renderInlineTokens(tokens: InlineToken[]): React.ReactNode[] {
  return tokens.map((t, i) => {
    switch (t.type) {
      case 'text':
        return <Fragment key={i}>{t.value}</Fragment>;
      case 'strong':
        return <strong key={i} className="font-semibold text-brand-text">{t.value}</strong>;
      case 'em':
        return <em key={i}>{t.value}</em>;
      case 'code':
        return (
          <code key={i} className="rounded bg-brand-bg px-1.5 py-0.5 text-xs font-mono text-brand-orange">
            {t.value}
          </code>
        );
      case 'link':
        if (t.isInternal) {
          return (
            <Link
              key={i}
              to={t.href}
              className="font-medium text-brand-orange underline underline-offset-2 transition-colors hover:text-brand-orange/80"
            >
              {t.value}
            </Link>
          );
        }
        return (
          <a
            key={i}
            href={t.href}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="font-medium text-brand-orange underline underline-offset-2 transition-colors hover:text-brand-orange/80"
          >
            {t.value}
          </a>
        );
      default:
        return <Fragment key={i}>{t.value}</Fragment>;
    }
  });
}

interface TableOfContentsItem {
  id: string;
  text: string;
  level: 2 | 3;
}

export function extractTOC(content: string): TableOfContentsItem[] {
  const items: TableOfContentsItem[] = [];
  const lines = content.split('\n');
  for (const line of lines) {
    const h2 = line.match(/^## (.+)/);
    if (h2) {
      items.push({ id: slugify(h2[1]), text: h2[1], level: 2 });
      continue;
    }
    const h3 = line.match(/^### (.+)/);
    if (h3) {
      items.push({ id: slugify(h3[1]), text: h3[1], level: 3 });
    }
  }
  return items;
}

export default function MarkdownContent({ content }: { content: string }) {
  const elements = useMemo(() => {
    const lines = content.split('\n');
    const result: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // Empty line
      if (!trimmed) {
        i++;
        continue;
      }

      // Horizontal rule
      if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
        result.push(<hr key={result.length} className="my-6 border-brand-border" />);
        i++;
        continue;
      }

      // H2 heading
      const h2 = trimmed.match(/^## (.+)/);
      if (h2) {
        const text = h2[1];
        const id = slugify(text);
        result.push(
          <h2 key={result.length} id={id} className="font-heading mt-10 mb-4 text-2xl font-bold text-brand-text scroll-mt-24">
            {renderInlineTokens(parseInline(text))}
          </h2>
        );
        i++;
        continue;
      }

      // H3 heading
      const h3 = trimmed.match(/^### (.+)/);
      if (h3) {
        const text = h3[1];
        const id = slugify(text);
        result.push(
          <h3 key={result.length} id={id} className="font-heading mt-8 mb-3 text-xl font-bold text-brand-text scroll-mt-24">
            {renderInlineTokens(parseInline(text))}
          </h3>
        );
        i++;
        continue;
      }

      // H4 heading
      const h4 = trimmed.match(/^#### (.+)/);
      if (h4) {
        const text = h4[1];
        result.push(
          <h4 key={result.length} className="font-heading mt-6 mb-2 text-lg font-semibold text-brand-text">
            {renderInlineTokens(parseInline(text))}
          </h4>
        );
        i++;
        continue;
      }

      // Blockquote
      if (trimmed.startsWith('> ')) {
        const quoteLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('> ')) {
          quoteLines.push(lines[i].trim().slice(2));
          i++;
        }
        result.push(
          <blockquote key={result.length} className="my-4 border-l-4 border-brand-orange/40 pl-4 italic text-brand-text-secondary">
            {quoteLines.map((ql, qi) => (
              <p key={qi} className={qi > 0 ? 'mt-2' : ''}>
                {renderInlineTokens(parseInline(ql))}
              </p>
            ))}
          </blockquote>
        );
        continue;
      }

      // Unordered list
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const listItems: string[] = [];
        while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
          listItems.push(lines[i].trim().slice(2));
          i++;
        }
        result.push(
          <ul key={result.length} className="list-disc pl-5 space-y-2 my-3">
            {listItems.map((item, li) => (
              <li key={li} className="text-sm leading-relaxed text-brand-text-secondary">
                {renderInlineTokens(parseInline(item))}
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // Ordered list
      const olMatch = trimmed.match(/^(\d+)\. (.+)/);
      if (olMatch) {
        const listItems: string[] = [];
        while (i < lines.length) {
          const ol = lines[i].trim().match(/^(\d+)\. (.+)/);
          if (ol) {
            listItems.push(ol[2]);
            i++;
          } else {
            break;
          }
        }
        result.push(
          <ol key={result.length} className="list-decimal pl-5 space-y-2 my-3">
            {listItems.map((item, li) => (
              <li key={li} className="text-sm leading-relaxed text-brand-text-secondary">
                {renderInlineTokens(parseInline(item))}
              </li>
            ))}
          </ol>
        );
        continue;
      }

      // Table
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        const tableRows: string[][] = [];
        // Header row
        tableRows.push(
          trimmed
            .split('|')
            .filter(Boolean)
            .map((c) => c.trim())
        );
        i++;

        // Separator row (skip)
        if (i < lines.length && lines[i].trim().match(/^\|[\s\-:|]+\|$/)) {
          i++;
        }

        // Data rows
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          tableRows.push(
            lines[i]
              .trim()
              .split('|')
              .filter(Boolean)
              .map((c) => c.trim())
          );
          i++;
        }

        if (tableRows.length > 0) {
          result.push(
            <div key={result.length} className="my-4 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-brand-border">
                    {tableRows[0].map((cell, ci) => (
                      <th key={ci} className="px-3 py-2 text-left font-semibold text-brand-text">
                        {renderInlineTokens(parseInline(cell))}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.slice(1).map((row, ri) => (
                    <tr key={ri} className="border-b border-brand-border transition-colors hover:bg-brand-bg/50">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-3 py-2 text-brand-text-secondary">
                          {renderInlineTokens(parseInline(cell))}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        continue;
      }

      // Paragraph - accumulate lines until blank line or next block element
      const paraLines: string[] = [trimmed];
      i++;
      while (i < lines.length) {
        const nl = lines[i].trim();
        if (!nl) break;
        if (
          nl.startsWith('#') ||
          nl.startsWith('> ') ||
          nl.startsWith('- ') ||
          nl.startsWith('* ') ||
          /^\d+\. /.test(nl) ||
          (nl.startsWith('|') && nl.endsWith('|')) ||
          nl === '---' ||
          nl === '***' ||
          nl === '___'
        ) {
          break;
        }
        paraLines.push(nl);
        i++;
      }

      const paraText = paraLines.join(' ');
      result.push(
        <p key={result.length} className="text-sm leading-relaxed text-brand-text-secondary">
          {renderInlineTokens(parseInline(paraText))}
        </p>
      );
    }

    return result;
  }, [content]);

  return <div className="space-y-3">{elements}</div>;
}