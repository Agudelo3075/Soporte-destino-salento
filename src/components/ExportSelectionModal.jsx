import React, { useState } from 'react';
import { X, Download, Search, FileText, Filter } from 'lucide-react';

export default function ExportSelectionModal({ articles, onClose, onConfirmExport }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [selectedIds, setSelectedIds] = useState([]);

  const term = searchTerm.trim().toLowerCase();

  const filteredArticles = articles.filter(article => {
    const matchesSearch =
      !term ||
      (article.h1Title || '').toLowerCase().includes(term) ||
      (article.h2Subtitle || '').toLowerCase().includes(term) ||
      (article.tags || []).some(t => t.toLowerCase().includes(term));

    const matchesStatus = statusFilter === 'todos' || article.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const isAllSelected =
    filteredArticles.length > 0 && filteredArticles.every(a => selectedIds.includes(a.id));

  const handleToggleArticle = (id) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const handleToggleAll = () => {
    const visibleIds = filteredArticles.map(a => a.id);
    setSelectedIds(prev => {
      if (isAllSelected) return prev.filter(id => !visibleIds.includes(id));
      return Array.from(new Set([...prev, ...visibleIds]));
    });
  };

  const handleConfirm = () => {
    if (selectedIds.length === 0) return;
    onConfirmExport(articles.filter(a => selectedIds.includes(a.id)));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={20} color="#10b981" />
            <h3 style={{ fontSize: '1.1rem', color: 'white' }}>Exportar Artículos</h3>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-hint">Elige los artículos que quieres descargar. Solo se exportarán los que dejes marcados.</p>

          {/* Search & Filters */}
          <div className="toolbar-row">
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
              className="form-select toolbar-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="publicado">Publicados</option>
              <option value="borrador">Borradores</option>
            </select>
          </div>

          {/* Select All */}
          <div className="export-toolbar">
            <button className="btn btn-secondary btn-sm" onClick={handleToggleAll}>
              <FileText size={14} />
              <span>{isAllSelected ? 'Desmarcar visibles' : 'Marcar visibles'}</span>
            </button>
            <span className="export-counter">
              {selectedIds.length} de {articles.length} seleccionados
            </span>
          </div>

          {/* Selectable List */}
          <div className="export-list">
            {filteredArticles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <Filter size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <p>No se encontraron artículos con el filtro actual.</p>
              </div>
            ) : (
              filteredArticles.map((art, index) => {
                const checked = selectedIds.includes(art.id);
                return (
                  <label key={art.id || index} className={`export-option${checked ? ' is-checked' : ''}`}>
                    <input
                      type="checkbox"
                      className="export-checkbox"
                      checked={checked}
                      onChange={() => handleToggleArticle(art.id)}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 className="export-option-title">{art.h1Title}</h4>
                      {art.h2Subtitle && <p className="export-option-subtitle">{art.h2Subtitle}</p>}
                    </div>
                    <span className={`article-status-pill status-${art.status || 'borrador'}`}>
                      {art.status === 'publicado' ? 'Publicado' : 'Borrador'}
                    </span>
                  </label>
                );
              })
            )}
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={onClose}>
              <span>Cancelar</span>
            </button>
            <button className="btn btn-primary" onClick={handleConfirm} disabled={selectedIds.length === 0}>
              <Download size={16} />
              <span>Exportar ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
