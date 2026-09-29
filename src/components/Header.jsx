import React from 'react';
import { Palmtree, Download, RotateCcw } from 'lucide-react';

export default function Header({ onExportAll, onResetSystem, totalCount, completedCount }) {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-icon">
          <Palmtree />
        </div>
        <div>
          <h1 className="brand-title">Destino Salento</h1>
          <p className="brand-subtitle">Plataforma de Soporte & Gestor de Carga (30 Artículos)</p>
        </div>
      </div>

      <div className="header-actions">
        <button 
          className="btn btn-secondary" 
          title="Eliminar todos los artículos guardados"
          onClick={onResetSystem}
        >
          <RotateCcw size={16} />
          <span>Reiniciar Datos</span>
        </button>

        <button className="btn btn-primary" onClick={onExportAll}>
          <Download size={18} />
          <span>Exportar ({completedCount}/{totalCount})</span>
        </button>
      </div>
    </header>
  );
}
