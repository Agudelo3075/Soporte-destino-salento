import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, User, Tag, Copy, Check, AlertTriangle, ArrowLeft } from 'lucide-react';
import { linksToMarkdown, resolveLinks, isInternalLink } from '../utils/links';
import { renderInlineMarkdown } from './InlineTextRenderer';
import { articlePath, slugify } from '../utils/slug';

export default function ArticlePreviewModal({ article, articles = [], onClose, onNavigateArticle = null }) {
  const [currentArticle, setCurrentArticle] = useState(article);
  const [history, setHistory] = useState([]);
  const [copied, setCopied] = useState(false);
  const modalBodyRef = useRef(null);

  // Sincronizar si cambia la prop article desde el exterior
  useEffect(() => {
    setCurrentArticle(article);
    setHistory([]);
  }, [article]);

  if (!currentArticle) return null;

  // Manejar clic en un enlace de artículo para abrirlo dentro de la previsualización
  const handleOpenLinkedArticle = (targetArticle, linkUrl, linkText) => {
    // Si no vino pre-resuelto, buscarlo
    let resolvedTarget = targetArticle;
    if (!resolvedTarget && linkUrl) {
      const cleanUrl = String(linkUrl).trim();
      const cleanSlug = cleanUrl.replace(/^\//, '');
      resolvedTarget = articles.find(
        a =>
          a.id === cleanUrl ||
          slugify(a.h1Title) === cleanSlug ||
          `/${slugify(a.h1Title)}` === cleanUrl ||
          articlePath(a) === cleanUrl ||
          (a.h1Title && a.h1Title.toLowerCase().trim() === (linkText || '').toLowerCase().trim())
      );
    }

    if (resolvedTarget) {
      setHistory(prev => [...prev, currentArticle]);
      setCurrentArticle(resolvedTarget);
      if (onNavigateArticle) {
        onNavigateArticle(resolvedTarget);
      }
      if (modalBodyRef.current) {
        modalBodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      alert(`No se encontró el artículo destino para "${linkText || linkUrl}". Es posible que aún no esté guardado en la colección.`);
    }
  };

  // Volver al artículo anterior del historial de navegación
  const handleGoBack = () => {
    if (history.length > 0) {
      const previous = history[history.length - 1];
      setHistory(prev => prev.slice(0, prev.length - 1));
      setCurrentArticle(previous);
      if (onNavigateArticle) {
        onNavigateArticle(previous);
      }
      if (modalBodyRef.current) {
        modalBodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleCopyMarkdown = () => {
    let md = `# ${currentArticle.h1Title}\n\n`;
    if (currentArticle.h2Subtitle) md += `## ${currentArticle.h2Subtitle}\n\n`;
    if (currentArticle.leadParagraph) md += `${currentArticle.leadParagraph}\n\n`;
    
    if (currentArticle.contentBlocks) {
      currentArticle.contentBlocks.forEach(b => {
        if (b.type === 'h2') md += `## ${b.text}\n\n`;
        else if (b.type === 'paragraph') md += `${b.text}\n\n`;
        else if (b.type === 'list' && Array.isArray(b.items)) {
          b.items.forEach(it => md += `- ${it}\n`);
          md += `\n`;
        }
        else if (b.type === 'links' && Array.isArray(b.links)) {
          const mdLinks = linksToMarkdown(b, articles);
          if (mdLinks) md += `${mdLinks}\n\n`;
        }
      });
    }

    if (currentArticle.tags && currentArticle.tags.length > 0) {
      md += `**Etiquetas:** ${currentArticle.tags.join(', ')}\n\n`;
    }

    if (currentArticle.imageUrl) {
      md += `![${currentArticle.imageCaption || 'Imagen'}](${currentArticle.imageUrl})\n`;
    }

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {history.length > 0 && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleGoBack}
                title={`Volver a: ${history[history.length - 1].h1Title}`}
                style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <ArrowLeft size={15} color="#10b981" />
                <span>Volver</span>
              </button>
            )}

            <div>
              <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Vista Previa de Publicación
              </span>
              <h3 style={{ fontSize: '1.1rem', color: 'white', margin: 0 }}>
                {currentArticle.category || 'Destino Salento'}
              </h3>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={handleCopyMarkdown}>
              {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
              <span>{copied ? 'Copiado' : 'Copiar Markdown'}</span>
            </button>
            <button className="btn btn-secondary btn-sm" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="modal-body" ref={modalBodyRef}>
          <div className="blog-reader-preview">
            {/* Banner de navegación si se está viendo un artículo enlazado */}
            {history.length > 0 && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '8px',
                padding: '8px 12px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.8rem'
              }}>
                <span style={{ color: '#d1fae5' }}>
                  Has navegado aquí desde: <strong>"{history[history.length - 1].h1Title}"</strong>
                </span>
                <button
                  type="button"
                  onClick={handleGoBack}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#34d399',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontSize: '0.78rem',
                    fontWeight: 600
                  }}
                >
                  ← Regresar al artículo anterior
                </button>
              </div>
            )}

            {/* H1 STRONG */}
            <h1 className="preview-h1">{currentArticle.h1Title}</h1>

            {/* H2 REGULAR */}
            {currentArticle.h2Subtitle && (
              <h2 className="preview-h2" style={{ border: 'none', color: '#d1d5db', fontSize: '1.15rem', fontWeight: 500, marginTop: 0 }}>
                {currentArticle.h2Subtitle}
              </h2>
            )}

            {/* Meta bar */}
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', margin: '16px 0 24px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <User size={14} /> {currentArticle.author || 'Equipo Soporte Destino Salento'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} /> {currentArticle.createdAt || '2026-09-29'}
              </span>
            </div>

            {/* Related Image */}
            {currentArticle.imageUrl && (
              <div className="preview-image-container">
                <img src={currentArticle.imageUrl} alt={currentArticle.imageCaption || currentArticle.h1Title} className="preview-image" />
                {currentArticle.imageCaption && (
                  <p className="preview-caption">{currentArticle.imageCaption}</p>
                )}
              </div>
            )}

            {/* Lead Paragraph <p> con enlaces inline interactivos */}
            {currentArticle.leadParagraph && (
              <p className="preview-lead">
                {renderInlineMarkdown(currentArticle.leadParagraph, articles, handleOpenLinkedArticle)}
              </p>
            )}

            {/* Content Blocks (H2 and Paragraphs) con enlaces inline interactivos */}
            {currentArticle.contentBlocks && currentArticle.contentBlocks.map((block, idx) => {
              if (block.type === 'h2') {
                return <h2 key={idx} className="preview-h2">{block.text}</h2>;
              }
              if (block.type === 'paragraph') {
                return (
                  <p key={idx} style={{ marginBottom: '16px', lineHeight: '1.7', color: '#e5e7eb' }}>
                    {renderInlineMarkdown(block.text, articles, handleOpenLinkedArticle)}
                  </p>
                );
              }
              if (block.type === 'list' && Array.isArray(block.items)) {
                return (
                  <ul key={idx} style={{ paddingLeft: '20px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {block.items.map((item, iIdx) => (
                      <li key={iIdx} style={{ color: '#d1d5db', lineHeight: '1.6' }}>{item}</li>
                    ))}
                  </ul>
                );
              }
              if (block.type === 'links') {
                const links = resolveLinks(block, articles).filter(l => !l.empty);
                if (links.length === 0) return null;
                return (
                  <div key={idx} className="preview-links-box">
                    <ul>
                      {links.map((link, lIdx) => (
                        <li key={lIdx} style={{ lineHeight: '1.6' }}>
                          {link.broken ? (
                            <span className="preview-links-broken">
                              <AlertTriangle size={14} />
                              Enlace roto: el artículo destino no existe ({link.missingId})
                            </span>
                          ) : (
                            <a
                              href={link.url}
                              title={`Abrir artículo: ${link.text}`}
                              onClick={(e) => {
                                e.preventDefault();
                                const target = articles.find(
                                  a => a.id === link.targetId || articlePath(a) === link.url
                                );
                                handleOpenLinkedArticle(target, link.url, link.text);
                              }}
                            >
                              {link.text}
                            </a>
                          )}
                          {link.draft && !link.broken && (
                            <span className="preview-links-draft"> (destino en borrador)</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              }
              return null;
            })}

            {/* Tags */}
            {currentArticle.tags && currentArticle.tags.length > 0 && (
              <div className="preview-tags-list">
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>
                  <Tag size={16} /> Etiquetas:
                </span>
                {currentArticle.tags.map((t, idx) => (
                  <span key={idx} className="tag-pill" style={{ fontSize: '0.78rem' }}>
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
