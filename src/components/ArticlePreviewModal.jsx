import React from 'react';
import { X, Calendar, User, Tag, Share2, Download, Copy, Check, AlertTriangle } from 'lucide-react';
import { linksToMarkdown, resolveLinks } from '../utils/links';

export default function ArticlePreviewModal({ article, articles = [], onClose }) {
  const [copied, setCopied] = React.useState(false);

  if (!article) return null;

  const handleCopyMarkdown = () => {
    let md = `# ${article.h1Title}\n\n`;
    if (article.h2Subtitle) md += `## ${article.h2Subtitle}\n\n`;
    if (article.leadParagraph) md += `${article.leadParagraph}\n\n`;
    
    if (article.contentBlocks) {
      article.contentBlocks.forEach(b => {
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

    if (article.tags && article.tags.length > 0) {
      md += `**Etiquetas:** ${article.tags.join(', ')}\n\n`;
    }

    if (article.imageUrl) {
      md += `![${article.imageCaption || 'Imagen'}](${article.imageUrl})\n`;
    }

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Vista Previa de Publicación
            </span>
            <h3 style={{ fontSize: '1.1rem', color: 'white' }}>{article.category || 'Destino Salento'}</h3>
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

        <div className="modal-body">
          <div className="blog-reader-preview">
            {/* H1 STRONG */}
            <h1 className="preview-h1">{article.h1Title}</h1>

            {/* H2 REGULAR */}
            {article.h2Subtitle && (
              <h2 className="preview-h2" style={{ border: 'none', color: '#d1d5db', fontSize: '1.15rem', fontWeight: 500, marginTop: 0 }}>
                {article.h2Subtitle}
              </h2>
            )}

            {/* Meta bar */}
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', margin: '16px 0 24px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <User size={14} /> {article.author || 'Equipo Soporte Destino Salento'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} /> {article.createdAt || '2026-09-29'}
              </span>
            </div>

            {/* Related Image */}
            {article.imageUrl && (
              <div className="preview-image-container">
                <img src={article.imageUrl} alt={article.imageCaption || article.h1Title} className="preview-image" />
                {article.imageCaption && (
                  <p className="preview-caption">{article.imageCaption}</p>
                )}
              </div>
            )}

            {/* Lead Paragraph <p> */}
            {article.leadParagraph && (
              <p className="preview-lead">{article.leadParagraph}</p>
            )}

            {/* Content Blocks (H2 and Paragraphs) */}
            {article.contentBlocks && article.contentBlocks.map((block, idx) => {
              if (block.type === 'h2') {
                return <h2 key={idx} className="preview-h2">{block.text}</h2>;
              }
              if (block.type === 'paragraph') {
                return <p key={idx} style={{ marginBottom: '16px', lineHeight: '1.7', color: '#e5e7eb' }}>{block.text}</p>;
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
                            <a href={link.url} target="_blank" rel="noopener noreferrer">
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
            {article.tags && article.tags.length > 0 && (
              <div className="preview-tags-list">
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>
                  <Tag size={16} /> Etiquetas:
                </span>
                {article.tags.map((t, idx) => (
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
