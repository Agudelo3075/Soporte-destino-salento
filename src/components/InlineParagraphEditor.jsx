import React, { useState, useRef, useEffect } from 'react';
import { Link2, Search, X, Check, FileText, Sparkles, ExternalLink } from 'lucide-react';
import { articlePath } from '../utils/slug';

export default function InlineParagraphEditor({
  value = '',
  onChange,
  placeholder = 'Escribe el texto del párrafo...',
  rows = 3,
  name,
  articles = [],
  currentArticleId = null,
  label = null
}) {
  const textareaRef = useRef(null);

  // Artículos disponibles para enlazar (excluye el que se está editando actualmente)
  const availableArticles = articles.filter(a => a.id !== currentArticleId);

  // Estado para autocompletado flotante con '@' al escribir
  const [mentionState, setMentionState] = useState({
    isOpen: false,
    query: '',
    atIndex: -1,
    cursorIndex: -1,
    selectedIndex: 0
  });

  // Estado para el modal / popup de "Añadir enlace"
  const [modalOpen, setModalOpen] = useState(false);
  const [modalText, setModalText] = useState('');
  const [modalSearch, setModalSearch] = useState('');
  const [modalSelectedArticle, setModalSelectedArticle] = useState(null);
  const [savedSelection, setSavedSelection] = useState({ start: 0, end: 0 });

  // Lista filtrada para la mención flotante (@ mientras escribe)
  const mentionFilteredArticles = availableArticles.filter(art => {
    const q = mentionState.query.toLowerCase().trim();
    if (!q) return true;
    return (
      (art.h1Title || '').toLowerCase().includes(q) ||
      (art.category || '').toLowerCase().includes(q)
    );
  });

  // Lista filtrada para el modal de añadir enlace
  const modalFilteredArticles = availableArticles.filter(art => {
    // Si el usuario escribe "@algo", quitamos el "@" inicial para buscar
    const rawQ = modalSearch.startsWith('@') ? modalSearch.slice(1) : modalSearch;
    const q = rawQ.toLowerCase().trim();
    if (!q) return true;
    return (
      (art.h1Title || '').toLowerCase().includes(q) ||
      (art.category || '').toLowerCase().includes(q)
    );
  });

  // Extraer enlaces ya presentes en este párrafo para dar feedback visual
  const detectedLinks = [];
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = regex.exec(value)) !== null) {
    detectedLinks.push({ text: match[1], url: match[2] });
  }

  // Manejar cambios en el textarea y detectar '@'
  const handleTextareaChange = (e) => {
    const newVal = e.target.value;
    const cursor = e.target.selectionStart;
    onChange(newVal);

    // Revisar si antes del cursor hay un '@'
    const textBeforeCursor = newVal.slice(0, cursor);
    // Coincidencia para '@' precedido por inicio de línea o espacio
    const atMatch = textBeforeCursor.match(/(?:^|\s)@([^\s@]*)$/);

    if (atMatch) {
      const matchFull = atMatch[0];
      const query = atMatch[1];
      // Índice donde empezó el '@'
      const atIndex = textBeforeCursor.lastIndexOf('@');

      setMentionState({
        isOpen: true,
        query,
        atIndex,
        cursorIndex: cursor,
        selectedIndex: 0
      });
    } else {
      if (mentionState.isOpen) {
        setMentionState(prev => ({ ...prev, isOpen: false }));
      }
    }
  };

  // Manejar teclado para navegar el menú flotante de '@'
  const handleKeyDown = (e) => {
    if (!mentionState.isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setMentionState(prev => ({
        ...prev,
        selectedIndex: (prev.selectedIndex + 1) % Math.max(1, mentionFilteredArticles.length)
      }));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMentionState(prev => ({
        ...prev,
        selectedIndex:
          (prev.selectedIndex - 1 + Math.max(1, mentionFilteredArticles.length)) %
          Math.max(1, mentionFilteredArticles.length)
      }));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (mentionFilteredArticles.length > 0) {
        e.preventDefault();
        insertMentionLink(mentionFilteredArticles[mentionState.selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setMentionState(prev => ({ ...prev, isOpen: false }));
    }
  };

  // Insertar artículo desde la mención flotante '@'
  const insertMentionLink = (article) => {
    if (!article || !textareaRef.current) return;

    const { atIndex, cursorIndex } = mentionState;
    const beforeAt = value.slice(0, atIndex);
    const afterCursor = value.slice(cursorIndex);

    const linkUrl = articlePath(article);
    const linkMarkdown = `[${article.h1Title}](${linkUrl})`;

    const nextText = `${beforeAt}${linkMarkdown}${afterCursor}`;
    onChange(nextText);

    setMentionState({
      isOpen: false,
      query: '',
      atIndex: -1,
      cursorIndex: -1,
      selectedIndex: 0
    });

    // Reposicionar el cursor justo después del enlace insertado
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = beforeAt.length + linkMarkdown.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Abrir modal de añadir enlace
  const handleOpenLinkModal = () => {
    const textarea = textareaRef.current;
    let selected = '';
    let start = 0;
    let end = 0;

    if (textarea) {
      start = textarea.selectionStart;
      end = textarea.selectionEnd;
      selected = value.substring(start, end);
    }

    setSavedSelection({ start, end });
    setModalText(selected || '');
    setModalSearch('@'); // Inicializar con @ para que muestre todos los títulos inmediatamente
    setModalSelectedArticle(null);
    setModalOpen(true);
  };

  // Insertar enlace desde el modal
  const handleConfirmModalLink = () => {
    if (!modalSelectedArticle || !textareaRef.current) return;

    const displayText = modalText.trim() || modalSelectedArticle.h1Title;
    const linkUrl = articlePath(modalSelectedArticle);
    const linkMarkdown = `[${displayText}](${linkUrl})`;

    const { start, end } = savedSelection;
    const before = value.slice(0, start);
    const after = value.slice(end);

    const nextText = `${before}${linkMarkdown}${after}`;
    onChange(nextText);

    setModalOpen(false);
    setModalText('');
    setModalSearch('');
    setModalSelectedArticle(null);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newPos = before.length + linkMarkdown.length;
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  return (
    <div className="inline-paragraph-editor-container">
      {/* Barra superior de herramientas del párrafo */}
      <div className="paragraph-editor-toolbar">
        {label ? (
          <span className="paragraph-editor-label">{label}</span>
        ) : (
          <span className="paragraph-editor-hint">
            Escribe <strong>@</strong> dentro del texto para enlazar otros artículos del sitio
          </span>
        )}

        <button
          type="button"
          className="btn-inline-link-action"
          title="Selecciona texto o haz clic aquí para insertar un enlace interno dentro del párrafo"
          onClick={handleOpenLinkModal}
        >
          <Link2 size={14} />
          <span>Añadir enlace (@)</span>
        </button>
      </div>

      <div style={{ position: 'relative' }}>
        <textarea
          ref={textareaRef}
          name={name}
          className="form-textarea inline-editor-textarea"
          rows={rows}
          placeholder={placeholder}
          value={value}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            // Dar tiempo a que un clic en la lista de mención se registre antes de cerrar
            setTimeout(() => {
              setMentionState(prev => ({ ...prev, isOpen: false }));
            }, 200);
          }}
        />

        {/* Desplegable flotante de menciones cuando se escribe '@' */}
        {mentionState.isOpen && (
          <div className="mention-dropdown-menu">
            <div className="mention-dropdown-header">
              <Sparkles size={13} color="#10b981" />
              <span>Artículos del sitio para enlazar (@):</span>
            </div>

            {mentionFilteredArticles.length === 0 ? (
              <div className="mention-empty-state">
                {availableArticles.length === 0
                  ? 'Aún no hay otros artículos guardados para enlazar.'
                  : `No hay artículos que coincidan con "${mentionState.query}"`}
              </div>
            ) : (
              <div className="mention-items-list">
                {mentionFilteredArticles.map((art, idx) => {
                  const isSelected = idx === mentionState.selectedIndex;
                  return (
                    <div
                      key={art.id}
                      className={`mention-item ${isSelected ? 'mention-item-selected' : ''}`}
                      onMouseDown={(e) => {
                        e.preventDefault(); // Evita perder el foco del textarea antes de insertar
                        insertMentionLink(art);
                      }}
                      onMouseEnter={() => {
                        setMentionState(prev => ({ ...prev, selectedIndex: idx }));
                      }}
                    >
                      <div className="mention-item-title">
                        <FileText size={14} className="mention-item-icon" />
                        <span>{art.h1Title}</span>
                      </div>
                      <div className="mention-item-meta">
                        <span className="mention-item-cat">{art.category || 'General'}</span>
                        <span className="mention-item-slug">{articlePath(art)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mention-dropdown-footer">
              Usa ↑ ↓ para navegar, Enter para insertar, Esc para cerrar
            </div>
          </div>
        )}
      </div>

      {/* Indicador de enlaces detectados en este párrafo */}
      {detectedLinks.length > 0 && (
        <div className="detected-links-bar">
          <span className="detected-links-title">
            <Link2 size={12} /> {detectedLinks.length} enlace(s) en este párrafo:
          </span>
          <div className="detected-links-tags">
            {detectedLinks.map((lk, i) => (
              <span key={i} className="detected-link-pill" title={`Destino: ${lk.url}`}>
                "{lk.text}" ➔ <small>{lk.url}</small>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Modal / Diálogo para Añadir Enlace en el párrafo */}
      {modalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={() => setModalOpen(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '580px', width: '92%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link2 size={18} color="#10b981" />
                <h3 style={{ fontSize: '1.05rem', color: 'white' }}>Insertar Enlace dentro del Párrafo</h3>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                El enlace se insertará exactamente en la posición del cursor o sustituirá el texto seleccionado.
              </p>

              {/* Texto visible del enlace */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>
                  Texto que verá el lector (ancla del enlace):
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Caracoles colombia"
                  value={modalText}
                  onChange={(e) => setModalText(e.target.value)}
                  autoFocus={!savedSelection.start || savedSelection.start === savedSelection.end}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {modalText
                    ? `Texto personalizado: "${modalText}"`
                    : 'Si lo dejas vacío, se usará el título del artículo seleccionado.'}
                </span>
              </div>

              {/* Buscar artículo con @ */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>
                  Artículo de destino del sitio (escribe @ o busca por título):
                </label>
                <div style={{ position: 'relative' }}>
                  <Search
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)'
                    }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '36px' }}
                    placeholder="Escribe @ o el título del artículo..."
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Lista de artículos disponibles del mismo sitio */}
              <div className="modal-articles-list">
                {availableArticles.length === 0 ? (
                  <div className="mention-empty-state">
                    No hay otros artículos guardados aún. Guarda más artículos en el panel derecho para poder enlazarlos.
                  </div>
                ) : modalFilteredArticles.length === 0 ? (
                  <div className="mention-empty-state">
                    No se encontraron artículos con la búsqueda "{modalSearch}".
                  </div>
                ) : (
                  modalFilteredArticles.map((art) => {
                    const isSelected = modalSelectedArticle?.id === art.id;
                    return (
                      <div
                        key={art.id}
                        className={`modal-article-option ${isSelected ? 'modal-article-option-selected' : ''}`}
                        onClick={() => {
                          setModalSelectedArticle(art);
                          if (!modalText.trim()) {
                            setModalText(art.h1Title);
                          }
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                          <FileText size={16} color={isSelected ? '#10b981' : '#9ca3af'} style={{ flexShrink: 0 }} />
                          <div style={{ minWidth: 0 }}>
                            <div className="modal-article-title">{art.h1Title}</div>
                            <div className="modal-article-meta">
                              <span>{art.category || 'General'}</span>
                              <span>·</span>
                              <span style={{ color: '#10b981' }}>{articlePath(art)}</span>
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="modal-article-check">
                            <Check size={16} />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Resumen del enlace a insertar */}
              {modalSelectedArticle && (
                <div className="modal-link-preview-box">
                  <div style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>
                    Vista previa de lo que se insertará:
                  </div>
                  <code style={{ fontSize: '0.8rem', color: '#e5e7eb' }}>
                    [{modalText.trim() || modalSelectedArticle.h1Title}]({articlePath(modalSelectedArticle)})
                  </code>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={!modalSelectedArticle}
                  onClick={handleConfirmModalLink}
                >
                  <Link2 size={15} />
                  <span>Insertar en el Párrafo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
