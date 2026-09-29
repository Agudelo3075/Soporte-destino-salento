import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ProgressBar from './components/ProgressBar';
import ArticleForm from './components/ArticleForm';
import ArticleList from './components/ArticleList';
import ArticlePreviewModal from './components/ArticlePreviewModal';
import ExportSelectionModal from './components/ExportSelectionModal';
import { initialArticles, generate30ArticlesList } from './data/initialArticles';

export default function App() {
  const [articles, setArticles] = useState(() => {
    const saved = localStorage.getItem('destino_salento_articles');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading saved articles', e);
      }
    }
    return generate30ArticlesList();
  });

  const [editingArticle, setEditingArticle] = useState(null);
  const [previewArticle, setPreviewArticle] = useState(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('destino_salento_articles', JSON.stringify(articles));
  }, [articles]);

  // Delete All Articles
  const handleResetSystem = () => {
    if (window.confirm('¿Deseas eliminar TODOS los artículos? Esta acción no se puede deshacer.')) {
      localStorage.removeItem('destino_salento_articles');
      setArticles([]);
      setEditingArticle(null);
      setPreviewArticle(null);
      setFormKey(prev => prev + 1);
    }
  };

  // Save / Update Article Handler
  const handleSaveArticle = (formData) => {
    if (formData.id) {
      // Update existing
      setArticles(prev => prev.map(a => a.id === formData.id ? { ...formData } : a));
    } else {
      // Create new
      const newArticle = {
        ...formData,
        id: `art-${Date.now()}`,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setArticles(prev => [newArticle, ...prev]);
    }
    setEditingArticle(null);
  };

  // Delete Article
  const handleDeleteArticle = (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este artículo?')) {
      setArticles(prev => prev.filter(a => a.id !== id));
      if (editingArticle && editingArticle.id === id) {
        setEditingArticle(null);
      }
    }
  };

  // Edit Article
  const handleEditArticle = (art) => {
    setEditingArticle(art);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // New Blank Article (clears every field in the form)
  const handleNewArticle = () => {
    setEditingArticle(null);
    setFormKey(prev => prev + 1);
  };

  // Export Selected Articles to JSON
  const handleExportArticles = (selectedArticles) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selectedArticles, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `destino_salento_${selectedArticles.length}_articulos_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setIsExportOpen(false);
  };

  return (
    <div className="app-container">
      {/* Navbar Header */}
      <Header
        onExportAll={() => setIsExportOpen(true)}
        onResetSystem={handleResetSystem}
        totalCount={30}
        completedCount={articles.filter(a => a.status === 'publicado').length}
      />

      {/* Progress Bar (30 Articles Goal) */}
      <ProgressBar total={30} articles={articles} />

      {/* Main Grid Workspace */}
      <main className="main-layout">
        {/* Left Column: Form (H1, H2, <p>, Tags, Image) */}
        <ArticleForm
          key={formKey}
          articleToEdit={editingArticle}
          onSaveArticle={handleSaveArticle}
          onPreviewArticle={(data) => setPreviewArticle(data)}
          onResetForm={handleNewArticle}
        />

        {/* Right Column: 30 Articles List & Manager */}
        <ArticleList
          articles={articles}
          onEditArticle={handleEditArticle}
          onPreviewArticle={(art) => setPreviewArticle(art)}
          onDeleteArticle={handleDeleteArticle}
          onAddNewArticle={handleNewArticle}
        />
      </main>

      {/* Modal: Live Blog Reader Preview */}
      {previewArticle && (
        <ArticlePreviewModal
          article={previewArticle}
          onClose={() => setPreviewArticle(null)}
        />
      )}

      {/* Modal: Export Article Selection */}
      {isExportOpen && (
        <ExportSelectionModal
          articles={articles}
          onClose={() => setIsExportOpen(false)}
          onConfirmExport={handleExportArticles}
        />
      )}
    </div>
  );
}
