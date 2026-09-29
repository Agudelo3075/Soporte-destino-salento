import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export default function BatchParserModal({ onClose, onImportParsedArticle }) {
  const [rawText, setRawText] = useState('');
  const [parsedPreview, setParsedPreview] = useState(null);

  const handleParseText = () => {
    if (!rawText.trim()) return;

    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

    let h1Title = '';
    let h2Subtitle = '';
    let leadParagraph = '';
    const contentBlocks = [];
    const tags = [];
    let imageCaption = '';

    let currentH2 = null;
    let paragraphsAcc = [];

    lines.forEach((line) => {
      // Check for tags
      if (line.toLowerCase().startsWith('etiquetas:') || line.toLowerCase().startsWith('tags:')) {
        const rawTags = line.replace(/^(etiquetas:|tags:)/i, '').trim();
        rawTags.split(/[,;]/).forEach(t => {
          const clean = t.trim();
          if (clean && !tags.includes(clean)) tags.push(clean);
        });
        return;
      }

      // Check for image related
      if (line.toLowerCase().startsWith('imagen relacionada:')) {
        imageCaption = line.replace(/^imagen relacionada:/i, '').trim() || 'Imagen del artículo';
        return;
      }

      // If no H1 set yet, assume first non-empty line is H1
      if (!h1Title) {
        h1Title = line;
        return;
      }

      // If line ends with ? or starts with ¿ or has H2 style characteristics, or no h2Subtitle set yet
      if (!h2Subtitle && line.length < 120 && (line.includes('?') || line.includes('¿') || line.length > 15)) {
        h2Subtitle = line;
        return;
      }

      // If line is a section header (starts with ¿ or ends with : or short heading)
      if (line.endsWith(':') || line.startsWith('¿') || line.startsWith('Ruta para') || line.startsWith('Día')) {
        contentBlocks.push({ type: 'h2', text: line });
        return;
      }

      // First longer text becomes lead paragraph if empty
      if (!leadParagraph && line.length > 50) {
        leadParagraph = line;
        return;
      }

      // Otherwise it's a paragraph block
      contentBlocks.push({ type: 'paragraph', text: line });
    });

    // Default fallback image if none provided
    const defaultImage = "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=1200&q=80";

    const result = {
      h1Title: h1Title || 'Título del Artículo',
      h2Subtitle: h2Subtitle || 'Subtítulo del Artículo',
      leadParagraph: leadParagraph || 'Párrafo de introducción',
      category: 'Ecoturismo',
      status: 'publicado',
      imageUrl: defaultImage,
      imageCaption: imageCaption || 'Destino Salento',
      tags: tags.length > 0 ? tags : ['Salento', 'Eje Cafetero', 'Turismo Colombia'],
      contentBlocks: contentBlocks.length > 0 ? contentBlocks : [{ type: 'paragraph', text: 'Contenido procesado.' }]
    };

    setParsedPreview(result);
  };

  const handleConfirmImport = () => {
    if (parsedPreview) {
      onImportParsedArticle(parsedPreview);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="#f59e0b" />
            <h3 style={{ fontSize: '1.1rem', color: 'white' }}>Importador por Texto Copiado</h3>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Pega aquí el texto completo del artículo (con su H1, H2, párrafos, etiquetas e imágenes relativas). El sistema identificará automáticamente cada dato y armará el formulario por ti.
          </p>

          <textarea
            className="form-textarea"
            rows={8}
            placeholder="Pega aquí el texto tal como lo recibiste en la carpeta compartida..."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-accent" onClick={handleParseText} disabled={!rawText.trim()}>
              <Sparkles size={16} />
              <span>Procesar y Extraer Campos</span>
            </button>
          </div>

          {parsedPreview && (
            <div style={{ marginTop: '16px', background: '#0a120e', padding: '16px', borderRadius: '12px', border: '1px solid #10b981' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 700, marginBottom: '10px' }}>
                <CheckCircle2 size={18} />
                <span>Artículo Identificado con Éxito</span>
              </div>

              <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '6px', color: '#e5e7eb' }}>
                <div><strong>H1 STRONG:</strong> {parsedPreview.h1Title}</div>
                <div><strong>H2 REGULAR:</strong> {parsedPreview.h2Subtitle}</div>
                <div><strong>Etiquetas Extradas ({parsedPreview.tags.length}):</strong> {parsedPreview.tags.join(', ')}</div>
                <div><strong>Bloques de Contenido:</strong> {parsedPreview.contentBlocks.length} secciones extraídas</div>
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '14px' }}
                onClick={handleConfirmImport}
              >
                <span>Cargar al Formulario y Guardar</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
