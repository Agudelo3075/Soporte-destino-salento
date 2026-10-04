// Generación de slugs para las URL públicas de los artículos
// Ej: "Qué hacer y ver en Salento: guía completa" -> "que-hacer-y-ver-en-salento-guia-completa"
export function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿?¡!.,;:"'’“”()[\]]/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function articlePath(article) {
  return article && article.h1Title ? `/${slugify(article.h1Title)}` : '';
}