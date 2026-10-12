import React from 'react';
import { slugify, articlePath } from '../utils/slug';

/**
 * Renderiza texto plano convirtiendo la sintaxis markdown de enlaces [Texto](url)
 * en elementos <a> clicables y estilizados para el lector del blog.
 * Si se proporciona onLinkClick, al hacer clic se abre el artículo correspondiente.
 */
export function renderInlineMarkdown(text, articles = [], onLinkClick = null) {
  if (!text) return null;

  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const linkText = match[1];
    const linkUrl = match[2];

    const cleanUrl = linkUrl.trim();
    const cleanSlug = cleanUrl.replace(/^\//, '');

    // Buscar si el destino corresponde a algún artículo conocido del sitio
    const targetArticle = articles.find(
      a =>
        a.id === cleanUrl ||
        slugify(a.h1Title) === cleanSlug ||
        `/${slugify(a.h1Title)}` === cleanUrl ||
        articlePath(a) === cleanUrl ||
        (a.h1Title && a.h1Title.toLowerCase().trim() === linkText.toLowerCase().trim())
    );

    parts.push(
      <a
        key={`inline-link-${match.index}`}
        href={linkUrl}
        className="preview-inline-link"
        title={targetArticle ? `Abrir artículo: ${targetArticle.h1Title}` : `Enlace: ${linkUrl}`}
        onClick={(e) => {
          e.preventDefault();
          if (onLinkClick) {
            onLinkClick(targetArticle, linkUrl, linkText);
          }
        }}
      >
        {linkText}
      </a>
    );

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

export default function InlineTextRenderer({ text, articles = [], onLinkClick = null, className = '' }) {
  return <span className={className}>{renderInlineMarkdown(text, articles, onLinkClick)}</span>;
}
