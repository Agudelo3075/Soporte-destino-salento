import React, { useState, useEffect } from 'react';
import { 
  Heading1, 
  Heading2, 
  AlignLeft, 
  Tag as TagIcon, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Save, 
  Eye, 
  Sparkles,
  Upload,
  Check,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderCheck,
  Copy,
  HelpCircle,
  FileImage
} from 'lucide-react';
import { uploadFileToS3, getS3ConfigStatus } from '../utils/s3Upload';

const PRESET_TAGS = [
  "Ruta por Colombia",
  "itinerario por Colombia",
  "viaje al Eje Cafetero",
  "turismo en Salento",
  "Paisaje Cultural Cafetero",
  "Valle de Cocora",
  "qué hacer en Salento",
  "cómo llegar a Salento",
  "fincas cafeteras Quindío",
  "avistamiento de aves Colombia",
  "transporte Eje Cafetero",
  "parques temáticos Quindío",
  "senderismo en Colombia",
  "vacaciones en Colombia",
  "pueblos de la cordillera andina"
];

const CORS_POLICY_JSON = `[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]`;

export default function ArticleForm({ articleToEdit, onSaveArticle, onPreviewArticle, onResetForm }) {
  const [formData, setFormData] = useState({
    id: null,
    h1Title: '',
    h2Subtitle: '',
    leadParagraph: '',
    category: 'Ecoturismo',
    status: 'publicado',
    imageUrl: '',
    imageCaption: '',
    tags: [],
    contentBlocks: [
      { type: 'h2', text: '' },
      { type: 'paragraph', text: '' }
    ]
  });

  const [newTagInput, setNewTagInput] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState(null); // Archivo local listo para subir a S3 solo al guardar
  const [s3ErrorMsg, setS3ErrorMsg] = useState('');
  const [s3SuccessMsg, setS3SuccessMsg] = useState('');
  const [showCorsHelp, setShowCorsHelp] = useState(false);
  const [copiedCors, setCopiedCors] = useState(false);
  
  const s3Status = getS3ConfigStatus();

  useEffect(() => {
    if (articleToEdit) {
      setFormData({
        id: articleToEdit.id || null,
        h1Title: articleToEdit.h1Title || '',
        h2Subtitle: articleToEdit.h2Subtitle || '',
        leadParagraph: articleToEdit.leadParagraph || '',
        category: articleToEdit.category || 'Ecoturismo',
        status: articleToEdit.status || 'publicado',
        imageUrl: articleToEdit.imageUrl || '',
        imageCaption: articleToEdit.imageCaption || '',
        tags: articleToEdit.tags || [],
        contentBlocks: articleToEdit.contentBlocks || [
          { type: 'h2', text: '' },
          { type: 'paragraph', text: '' }
        ]
      });
      setPendingImageFile(null);
      setS3ErrorMsg('');
      setS3SuccessMsg('');
    }
  }, [articleToEdit]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Tag Handling
  const handleAddTag = (tagToAdd) => {
    const cleanTag = tagToAdd.trim();
    if (cleanTag && !formData.tags.includes(cleanTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, cleanTag]
      }));
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove)
    }));
  };

  // Content Blocks
  const handleAddBlock = (type) => {
    setFormData(prev => ({
      ...prev,
      contentBlocks: [...prev.contentBlocks, { type, text: '' }]
    }));
  };

  const handleBlockChange = (index, value) => {
    const updated = [...formData.contentBlocks];
    updated[index].text = value;
    setFormData(prev => ({ ...prev, contentBlocks: updated }));
  };

  const handleRemoveBlock = (index) => {
    setFormData(prev => ({
      ...prev,
      contentBlocks: prev.contentBlocks.filter((_, i) => i !== index)
    }));
  };

  // Selección de imagen: NO sube a S3 inmediatamente. Solo previsualiza localmente y guarda el archivo en memoria.
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setS3ErrorMsg('');
    setS3SuccessMsg('');
    setShowCorsHelp(false);

    setPendingImageFile(file);

    // FileReader para mostrar vista previa inmediata en el cliente sin consumir red
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        imageUrl: reader.result,
        imageCaption: file.name
      }));
    };
    reader.readAsDataURL(file);
  };

  const copyCorsJson = () => {
    navigator.clipboard.writeText(CORS_POLICY_JSON);
    setCopiedCors(true);
    setTimeout(() => setCopiedCors(false), 2000);
  };

  // Enviar Formulario: Aquí SÍ se sube el archivo a AWS S3 si hay una imagen pendiente
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.h1Title.trim()) {
      alert('Por favor ingresa un Título Principal (H1 STRONG)');
      return;
    }

    setIsSubmitting(true);
    setS3ErrorMsg('');
    setS3SuccessMsg('');

    let finalImageUrl = formData.imageUrl;

    // Si hay una imagen seleccionada pendiente de subir
    if (pendingImageFile) {
      if (s3Status.isConfigured) {
        try {
          // Subida efectiva a la carpeta /images de AWS S3
          finalImageUrl = await uploadFileToS3(pendingImageFile, 'images');
          setS3SuccessMsg(`Imagen subida exitosamente a S3: ${s3Status.bucketName}/images/`);
        } catch (err) {
          console.error('Error al subir imagen a S3 durante el guardado:', err);
          setS3ErrorMsg(err.message);
          if (err.message.includes('CORS')) {
            setShowCorsHelp(true);
          }
          setIsSubmitting(false);
          return; // Detener guardado si falla la subida obligatoria a S3
        }
      }
    }

    const updatedArticleData = {
      ...formData,
      imageUrl: finalImageUrl
    };

    onSaveArticle(updatedArticleData);
    setPendingImageFile(null);
    setIsSubmitting(false);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  return (
    <div className="panel-card">
      <div className="panel-header">
        <h2 className="panel-title">
          <Heading1 size={22} color="#10b981" />
          <span>{formData.id ? 'Editar Artículo' : 'Formulario de Carga de Artículo'}</span>
        </h2>
        {formData.id && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={onResetForm}>
            Nuevo Artículo
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* H1 STRONG */}
        <div className="form-group">
          <label className="form-label">
            <span>H1 STRONG (Título Principal del Artículo)</span>
            <span className="form-label-badge">Obligatorio</span>
          </label>
          <input
            type="text"
            name="h1Title"
            className="form-input h1-input-style"
            placeholder="Ej: Ruta por Colombia: ¿Cómo incluir Salento y el Eje Cafetero en tu itinerario?"
            value={formData.h1Title}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* H2 REGULAR */}
        <div className="form-group">
          <label className="form-label">
            <span>H2 REGULAR (Subtítulo o Resumen Principal)</span>
          </label>
          <input
            type="text"
            name="h2Subtitle"
            className="form-input h2-input-style"
            placeholder="Ej: ¿Cuántos días dedicar a Salento según la duración de tu viaje por Colombia?"
            value={formData.h2Subtitle}
            onChange={handleInputChange}
          />
        </div>

        {/* Categoría y Estado */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Categoría</label>
            <select
              name="category"
              className="form-select"
              value={formData.category}
              onChange={handleInputChange}
            >
              <option value="Rutas e Itinerarios">Rutas e Itinerarios</option>
              <option value="Guías Completas">Guías Completas</option>
              <option value="Ecoturismo">Ecoturismo</option>
              <option value="Gastronomía y Café">Gastronomía y Café</option>
              <option value="Logística y Transporte">Logística y Transporte</option>
              <option value="Alojamiento">Alojamiento</option>
              <option value="Patrimonio y Cultura">Patrimonio y Cultura</option>
              <option value="Clima y Temporadas">Clima y Temporadas</option>
              <option value="Guías Rápidas">Guías Rápidas</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Estado de Publicación</label>
            <select
              name="status"
              className="form-select"
              value={formData.status}
              onChange={handleInputChange}
            >
              <option value="publicado">Publicado (Listo)</option>
              <option value="borrador">Borrador</option>
            </select>
          </div>
        </div>

        {/* Párrafo Principal / Introducción (<p>) */}
        <div className="form-group">
          <label className="form-label">
            <AlignLeft size={16} />
            <span>Párrafo Principal (&lt;p&gt; Introducción)</span>
          </label>
          <textarea
            name="leadParagraph"
            className="form-textarea"
            rows={4}
            placeholder="El Eje Cafetero Colombiano se destaca por sus imponentes montañas y por la oportunidad de vivir una verdadera experiencia de descanso..."
            value={formData.leadParagraph}
            onChange={handleInputChange}
          />
        </div>

        {/* Dynamic Content Blocks (H2s & Paragraphs) */}
        <div className="form-group">
          <div className="content-blocks-header">
            <label className="form-label">
              <span>Secciones y Contenido (&lt;p&gt; y H2 Adicionales)</span>
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleAddBlock('h2')}
              >
                + Subtítulo (H2)
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleAddBlock('paragraph')}
              >
                + Párrafo (&lt;p&gt;)
              </button>
            </div>
          </div>

          {formData.contentBlocks.map((block, index) => (
            <div key={index} className="block-item">
              <div className="block-header">
                <span className={`block-type-badge ${block.type === 'h2' ? 'badge-h2' : 'badge-p'}`}>
                  {block.type === 'h2' ? 'H2 REGULAR' : 'PÁRRAFO <P>'}
                </span>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
                  onClick={() => handleRemoveBlock(index)}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {block.type === 'h2' ? (
                <input
                  type="text"
                  className="form-input h2-input-style"
                  placeholder="Escribe el título de la sección (H2)..."
                  value={block.text}
                  onChange={(e) => handleBlockChange(index, e.target.value)}
                />
              ) : (
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Escribe el texto del párrafo (<p>)... Puedes incluir enlaces como [guía sobre cómo viajar por Colombia]"
                  value={block.text}
                  onChange={(e) => handleBlockChange(index, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>

        {/* Tags / Etiquetas */}
        <div className="form-group">
          <label className="form-label">
            <TagIcon size={16} />
            <span>Etiquetas / Tags del Artículo</span>
          </label>
          <div className="tags-wrapper">
            {formData.tags.map((tag, idx) => (
              <span key={idx} className="tag-pill">
                #{tag}
                <span className="tag-remove" onClick={() => handleRemoveTag(tag)}>×</span>
              </span>
            ))}

            <input
              type="text"
              placeholder="Añadir etiqueta y presionar Enter..."
              style={{ background: 'transparent', border: 'none', color: 'white', flex: 1, outline: 'none' }}
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag(newTagInput);
                }
              }}
            />
          </div>

          <div style={{ marginTop: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Etiquetas frecuentes (haz clic para añadir):</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
              {PRESET_TAGS.map((pTag, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="micro-tag"
                  style={{ cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}
                  onClick={() => handleAddTag(pTag)}
                >
                  + {pTag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Imagen Relacionada & Selección local (Se sube a S3 al guardar) */}
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="form-label">
              <ImageIcon size={16} />
              <span>Imagen Relacionada</span>
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
              <Cloud size={14} color={s3Status.isConfigured ? '#34d399' : '#fbbf24'} />
              <span style={{ color: s3Status.isConfigured ? '#34d399' : '#fbbf24', fontWeight: 600 }}>
                {s3Status.isConfigured ? `Destino S3: ${s3Status.bucketName}/images/` : 'AWS S3: Revisa tu .env'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              name="imageUrl"
              className="form-input"
              placeholder="URL de la imagen (o selecciona un archivo para subir al guardar)..."
              value={formData.imageUrl}
              onChange={(e) => {
                handleInputChange(e);
                setPendingImageFile(null); // Si el usuario escribe una URL directa, limpia el archivo pendiente
              }}
            />

            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <FileImage size={16} />
              <span>{pendingImageFile ? 'Cambiar Imagen' : 'Seleccionar Imagen'}</span>
              <input 
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={handleFileSelect} 
              />
            </label>
          </div>

          {/* Indicador de archivo seleccionado listo para subir al guardar */}
          {pendingImageFile && (
            <div style={{ fontSize: '0.8rem', color: '#6ee7b7', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <CheckCircle2 size={14} />
              <span>Imagen seleccionada: <strong>{pendingImageFile.name}</strong> (Se subirá a AWS S3 al presionar <em>Guardar</em> o <em>Actualizar</em>)</span>
            </div>
          )}

          {/* Messages */}
          {s3SuccessMsg && (
            <div style={{ fontSize: '0.8rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
              <FolderCheck size={14} />
              <span>{s3SuccessMsg}</span>
            </div>
          )}

          {s3ErrorMsg && (
            <div style={{ fontSize: '0.82rem', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.3)', marginTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, marginBottom: '4px' }}>
                <AlertCircle size={16} />
                <span>Error al subir la imagen a S3:</span>
              </div>
              <p style={{ lineHeight: '1.4', marginBottom: '8px' }}>{s3ErrorMsg}</p>
              
              <button 
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                onClick={() => setShowCorsHelp(!showCorsHelp)}
              >
                <HelpCircle size={14} />
                <span>{showCorsHelp ? 'Ocultar solución CORS' : '¿Cómo solucionar este error en 1 minuto? (Instrucciones CORS)'}</span>
              </button>
            </div>
          )}

          {/* Solución CORS */}
          {showCorsHelp && (
            <div style={{ background: '#0c1612', border: '1px solid #d97706', borderRadius: '8px', padding: '14px', marginTop: '8px', fontSize: '0.82rem' }}>
              <h4 style={{ color: '#f59e0b', fontSize: '0.9rem', marginBottom: '8px' }}>🛠️ Solución: Activar CORS en tu Bucket S3</h4>
              <p style={{ color: '#d1d5db', marginBottom: '8px' }}>
                Amazon S3 requiere autorizar peticiones directas desde navegadores web. Para solucionarlo:
              </p>
              <ol style={{ paddingLeft: '20px', color: '#e5e7eb', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                <li>Ve a la <strong>Consola de AWS S3</strong> → Abre tu bucket <strong>destino-salento-bucket</strong>.</li>
                <li>Haz clic en la pestaña <strong>Permisos (Permissions)</strong>.</li>
                <li>Desplázate hasta abajo a <strong>Intercambio de recursos de origen cruzado (CORS)</strong> y haz clic en <strong>Editar</strong>.</li>
                <li>Pega el siguiente código JSON y guarda los cambios:</li>
              </ol>

              <div style={{ position: 'relative' }}>
                <pre style={{ background: '#050a08', padding: '10px', borderRadius: '6px', color: '#34d399', fontSize: '0.78rem', overflowX: 'auto' }}>
                  {CORS_POLICY_JSON}
                </pre>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ position: 'absolute', right: '6px', top: '6px', fontSize: '0.72rem', padding: '2px 8px' }}
                  onClick={copyCorsJson}
                >
                  {copiedCors ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
                  <span>{copiedCors ? '¡Copiado!' : 'Copiar JSON'}</span>
                </button>
              </div>
            </div>
          )}

          {formData.imageUrl && (
            <div style={{ marginTop: '10px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', maxHeight: '160px' }}>
              <img src={formData.imageUrl} alt="Vista previa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onPreviewArticle(formData)}
            disabled={isSubmitting}
          >
            <Eye size={18} />
            <span>Vista Previa</span>
          </button>

          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Subiendo imagen a S3 y Guardando...</span>
              </>
            ) : saveSuccessMsg ? (
              <>
                <Check size={18} />
                <span>¡Guardado con éxito!</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>{formData.id ? 'Actualizar Artículo' : 'Guardar Artículo'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
