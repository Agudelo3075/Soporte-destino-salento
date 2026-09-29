import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  Copy, 
  Check, 
  Plus, 
  Filter,
  Tag as TagIcon 
} from 'lucide-react';

export default function ArticleList({ 
  articles, 
  onEditArticle, 
  onPreviewArticle, 
  onDeleteArticle, 
  onAddNewArticle 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [copiedId, setCopiedId] = useState(null);

  const filteredArticles = articles.filter(article => {
    const matchesSearch = 
      article.h1Title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.h2Subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (article.tags && article.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));
    
    const matchesStatus = 
      statusFilter === 'todos' || article.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCopyMarkdown = (article) => {
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
      });
    }

    if (article.tags && article.tags.length > 0) {
      md += `**Etiquetas:** ${article.tags.join(', ')}\n\n`;
    }

    if (article.imageUrl) {
      md += `![${article.imageCaption || 'Imagen'}](${article.imageUrl})\n`;
    }

    navigator.clipboard.writeText(md);
    setCopiedId(article.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="panel-card">
      <div className="panel-header">
        <h2 className="panel-title">
          <FileText size={22} color="#f59e0b" />
          <span>Artículos Cargados ({articles.length}/30)</span>
        </h2>
        <button className="btn btn-primary btn-sm" onClick={onAddNewArticle}>
          <Plus size={16} />
          <span>Nuevo Artículo</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '36px' }}
            placeholder="Buscar por título, etiquetas o contenido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: '150px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="todos">Todos</option>
          <option value="publicado">Publicados</option>
          <option value="borrador">Borradores</option>
        </select>
      </div>

      {/* List Container */}
      <div className="articles-scroll-container">
        {filteredArticles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <Filter size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
            <p>No se encontraron artículos con el filtro actual.</p>
          </div>
        ) : (
          filteredArticles.map((art, index) => (
            <div key={art.id || index} className="article-item-card">
              <div className="article-item-top">
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>
                      #{index + 1}
                    </span>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px' }}>
                      {art.category || 'General'}
                    </span>
                  </div>
                  <h3 className="article-item-title">{art.h1Title}</h3>
                  {art.h2Subtitle && (
                    <p className="article-item-subtitle">{art.h2Subtitle}</p>
                  )}
                </div>

                <span className={`article-status-pill status-${art.status || 'borrador'}`}>
                  {art.status === 'publicado' ? 'Publicado' : 'Borrador'}
                </span>
              </div>

              {/* Tags Preview */}
              {art.tags && art.tags.length > 0 && (
                <div className="article-meta-tags">
                  {art.tags.slice(0, 4).map((tag, tIdx) => (
                    <span key={tIdx} className="micro-tag">
                      #{tag}
                    </span>
                  ))}
                  {art.tags.length > 4 && (
                    <span className="micro-tag">+{art.tags.length - 4} más</span>
                  )}
                </div>
              )}

              {/* Action Bar */}
              <div className="article-item-footer">
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  {art.createdAt || 'Reciente'}
                </span>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    title="Copiar en Markdown"
                    onClick={() => handleCopyMarkdown(art)}
                  >
                    {copiedId === art.id ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  </button>

                  <button
                    className="btn btn-secondary btn-sm"
                    title="Vista previa"
                    onClick={() => onPreviewArticle(art)}
                  >
                    <Eye size={14} />
                  </button>

                  <button
                    className="btn btn-secondary btn-sm"
                    title="Editar"
                    onClick={() => onEditArticle(art)}
                  >
                    <Edit3 size={14} />
                  </button>

                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ color: '#f87171' }}
                    title="Eliminar"
                    onClick={() => onDeleteArticle(art.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
