import React from 'react';
import { CheckCircle, AlertCircle, FileText, Layers } from 'lucide-react';

export default function ProgressBar({ total = 30, articles = [] }) {
  const publishedCount = articles.filter(a => a.status === 'publicado').length;
  const draftCount = articles.filter(a => a.status === 'borrador').length;
  const percentage = Math.min(100, Math.round((publishedCount / total) * 100));

  return (
    <div className="progress-card">
      <div className="progress-info">
        <div className="progress-header">
          <span className="progress-title">Progreso de Carga de Artículos</span>
          <span className="progress-counter">{publishedCount} de {total} completados ({percentage}%)</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${percentage}%` }}></div>
        </div>
      </div>

      <div className="progress-stats-grid">
        <div className="stat-badge">
          <div className="stat-num" style={{ color: '#34d399' }}>{publishedCount}</div>
          <div className="stat-label">Publicados</div>
        </div>
        <div className="stat-badge">
          <div className="stat-num" style={{ color: '#fbbf24' }}>{draftCount}</div>
          <div className="stat-label">Borradores</div>
        </div>
        <div className="stat-badge">
          <div className="stat-num" style={{ color: '#a7f3d0' }}>{articles.length}</div>
          <div className="stat-label">Total Creados</div>
        </div>
      </div>
    </div>
  );
}
