import { articlePath } from './slug';

export const EXTERNAL_LINK = 'external';

// Un enlace es interno si apunta a un artículo de esta misma colección
export const isInternalLink = (link) => !!link && !!link.articleId && link.type !== EXTERNAL_LINK;

export const isExternalLink = (link) => !!link && !isInternalLink(link);

// Resuelve un enlace del cajón contra el listado real de artículos.
// El texto y la URL se calculan siempre desde el artículo destino, así que
// si el título del destino cambia, el enlace se actualiza solo.
export function resolveLink(link, articles = []) {
  if (!link) return { url: '', text: '', empty: true, broken: false, internal: false };

  if (isExternalLink(link)) {
    const url = (link.url || '').trim();
    return { url, text: url, empty: !url, broken: false, internal: false, external: true };
  }

  const target = articles.find(a => a.id === link.articleId);
  if (!target) {
    return { url: '', text: '', empty: false, broken: true, internal: true, missingId: link.articleId };
  }

  return {
    url: articlePath(target),
    text: target.h1Title,
    empty: false,
    broken: false,
    internal: true,
    targetId: target.id,
    draft: target.status !== 'publicado'
  };
}

export const resolveLinks = (block, articles = []) =>
  (block && Array.isArray(block.links) ? block.links : []).map(l => resolveLink(l, articles));

// Quita filas vacías del cajón (no aportan nada) y devuelve los avisos de los demás
export function sanitizeLinksBlock(block, articles = []) {
  const resolved = resolveLinks(block, articles);
  const warnings = [];

  const links = (block.links || []).filter((link, i) => {
    if (resolved[i].empty) return false;
    return true;
  });

  if (resolved.some(r => r.draft)) {
    warnings.push('Algún enlace apunta a un artículo en estado "borrador": el lector no podrá verlo hasta publicarlo.');
  }

  return { block: { ...block, links }, warnings };
}

// Enlaces que apuntan a artículos que ya no existen en la colección
export function findBrokenLinks(blocks, articles = []) {
  const broken = [];
  (blocks || []).forEach((block, blockIndex) => {
    if (!block || block.type !== 'links') return;
    resolveLinks(block, articles).forEach((r, linkIndex) => {
      if (r.broken) broken.push({ blockIndex, linkIndex, missingId: r.missingId });
    });
  });
  return broken;
}

export const linksToMarkdown = (block, articles = []) =>
  resolveLinks(block, articles)
    .filter(r => !r.empty && !r.broken)
    .map(r => `- [${r.text}](${r.url})`)
    .join('\n');