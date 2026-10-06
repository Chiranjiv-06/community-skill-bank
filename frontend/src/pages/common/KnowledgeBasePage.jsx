import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  BookOpen,
  Search,
  X,
  Filter,
  RefreshCw,
  AlertCircle,
  FileQuestion,
  HelpCircle,
  ChevronDown
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import KnowledgeCard from '../../components/knowledge/KnowledgeCard';
import KnowledgeDetailModal from '../../components/knowledge/KnowledgeDetailModal';
import KnowledgeAssistantPanel from '../../components/knowledge/KnowledgeAssistantPanel';
import { knowledgeService } from '../../services/knowledgeService.js';

export const KnowledgeBasePage = ({ role = 'volunteer' }) => {
  const isAdmin = role === 'admin';
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedDisasterType, setSelectedDisasterType] = useState('ALL');

  // Selected document for modal detail view
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    category: 'First Aid',
    disasterType: 'General',
    summary: '',
    content: '',
    source: 'Incident Command Standards',
    status: 'published'
  });

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.title.trim() || !createForm.content.trim()) {
      alert('Please fill out the protocol title and content.');
      return;
    }

    setIsCreating(true);
    try {
      await knowledgeService.createKnowledgeDocument(createForm);
      await loadDocuments();
      setIsCreateModalOpen(false);
      setCreateForm({
        title: '',
        category: 'First Aid',
        disasterType: 'General',
        summary: '',
        content: '',
        source: 'Incident Command Standards',
        status: 'published'
      });
    } catch (err) {
      console.error('Failed to create knowledge protocol:', err);
      alert('Failed to save knowledge protocol.');
    } finally {
      setIsCreating(false);
    }
  };

  // Assistant visibility toggle
  const [showAssistant, setShowAssistant] = useState(true);

  const categories = useMemo(() => ['ALL', ...knowledgeService.getCategories()], []);
  const disasterTypes = useMemo(() => ['ALL', ...knowledgeService.getDisasterTypes()], []);

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await knowledgeService.getKnowledgeItems({
        query: searchQuery,
        category: selectedCategory,
        disasterType: selectedDisasterType
      });
      setItems(data);
    } catch (err) {
      console.error('[KnowledgeBasePage] Error loading knowledge:', err);
      setError('Knowledge content could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedDisasterType]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handlePublishDoc = async (doc) => {
    try {
      await knowledgeService.publishKnowledgeDocument(doc.id);
      await loadDocuments();
      if (selectedDoc && selectedDoc.id === doc.id) {
        setSelectedDoc((prev) => ({ ...prev, status: 'published' }));
      }
    } catch (err) {
      console.error('Failed to publish document:', err);
    }
  };

  const handleArchiveDoc = async (doc) => {
    try {
      await knowledgeService.archiveKnowledgeDocument(doc.id);
      await loadDocuments();
      if (selectedDoc && selectedDoc.id === doc.id) {
        setSelectedDoc((prev) => ({ ...prev, status: 'archived' }));
      }
    } catch (err) {
      console.error('Failed to archive document:', err);
    }
  };

  const handleOpenDoc = (doc) => {
    setSelectedDoc(doc);
    setIsDetailModalOpen(true);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedDisasterType('ALL');
  };

  const hasActiveFilters = searchQuery.trim() !== '' || selectedCategory !== 'ALL' || selectedDisasterType !== 'ALL';

  return (
    <div className="page-container" style={{ padding: '24px 32px' }}>
      <PageHeader
        title={role === 'admin' ? 'Incident Command Knowledge & Field Protocols' : 'Field Knowledge & Disaster Protocols'}
        description="Search official standard operating procedures, medical triage algorithms, structural safety checklists, and consult the deterministic Knowledge Assistant."
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={loadDocuments}
            >
              <RefreshCw size={14} style={{ marginRight: '4px' }} />
              Refresh
            </Button>
            {isAdmin && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus size={15} style={{ marginRight: '4px' }} />
                Add Protocol
              </Button>
            )}
            <Button
              variant={showAssistant ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => setShowAssistant((prev) => !prev)}
            >
              <HelpCircle size={15} />
              <span>{showAssistant ? 'Hide Assistant' : 'Show Knowledge Assistant'}</span>
            </Button>
          </div>
        }
      />

      {/* Deterministic Knowledge Assistant Panel */}
      {showAssistant && (
        <KnowledgeAssistantPanel onOpenDocument={handleOpenDoc} />
      )}

      {/* Filter and Search Bar Card */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
      >
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
            <label htmlFor="knowledge-search" className="sr-only">
              Search knowledge base
            </label>
            <div
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }}
            >
              <Search size={16} />
            </div>
            <input
              id="knowledge-search"
              type="text"
              className="input"
              placeholder="Search guides by title, triage step, tag, or chemical hazard..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: '38px', paddingRight: searchQuery ? '36px' : '12px' }}
            />
            {searchQuery && (
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '4px'
                }}
                title="Clear search query"
                aria-label="Clear search query"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div style={{ minWidth: '180px' }}>
            <label htmlFor="category-filter" className="sr-only">
              Filter by Category
            </label>
            <select
              id="category-filter"
              className="select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ width: '100%' }}
              aria-label="Filter by Category"
            >
              <option value="ALL">All Categories</option>
              {categories.filter((c) => c !== 'ALL').map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Disaster Type Dropdown */}
          <div style={{ minWidth: '180px' }}>
            <label htmlFor="disaster-type-filter" className="sr-only">
              Filter by Disaster Type
            </label>
            <select
              id="disaster-type-filter"
              className="select"
              value={selectedDisasterType}
              onChange={(e) => setSelectedDisasterType(e.target.value)}
              style={{ width: '100%' }}
              aria-label="Filter by Disaster Type"
            >
              <option value="ALL">All Disaster Types</option>
              {disasterTypes.filter((d) => d !== 'ALL').map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              <X size={14} />
              <span>Clear Filters</span>
            </Button>
          )}
        </div>

        {/* Results Counter & Active Filters Summary */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
          <div>
            Showing <strong style={{ color: 'var(--text-primary)' }}>{items.length}</strong> knowledge protocol{items.length === 1 ? '' : 's'}
            {searchQuery && <span> matching "<strong>{searchQuery}</strong>"</span>}
            {selectedCategory !== 'ALL' && <span> in <strong>{selectedCategory}</strong></span>}
            {selectedDisasterType !== 'ALL' && <span> for <strong>{selectedDisasterType}</strong></span>}
          </div>
          <div style={{ fontStyle: 'italic', fontSize: '11px' }}>
            Offline cache ready
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: 'var(--text-muted)'
          }}
        >
          <RefreshCw size={32} className="spin-icon" style={{ color: 'var(--color-orange-500)', marginBottom: '12px' }} />
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Loading knowledge...</div>
        </div>
      ) : error ? (
        <div
          style={{
            padding: '30px',
            textAlign: 'center',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid var(--color-critical-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-critical)'
          }}
        >
          <AlertCircle size={32} style={{ marginBottom: '8px' }} />
          <div style={{ fontWeight: 600 }}>{error}</div>
        </div>
      ) : items.length === 0 ? (
        <div
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            background: 'var(--bg-card)',
            border: '1px dashed var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-muted)'
          }}
        >
          <FileQuestion size={40} style={{ color: 'var(--color-warning)', marginBottom: '12px' }} />
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
            {searchQuery ? 'No knowledge found for your search.' : 'No knowledge articles match your filters.'}
          </div>
          <p style={{ fontSize: 'var(--font-xs)', maxWidth: '420px', margin: '0 auto 16px auto' }}>
            Try broadening your search query or reset your category and disaster filters to view all standard operating procedures.
          </p>
          <Button variant="secondary" size="sm" onClick={handleClearFilters}>
            Reset All Filters
          </Button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px'
          }}
        >
          {items.map((doc) => (
            <KnowledgeCard
              key={doc.id}
              document={doc}
              onSelect={handleOpenDoc}
            />
          ))}
        </div>
      )}

      {/* Full Document Detail Modal */}
      <KnowledgeDetailModal
        document={selectedDoc}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        isAdmin={isAdmin}
        onPublish={handlePublishDoc}
        onArchive={handleArchiveDoc}
      />
      {/* Admin Add Protocol Modal */}
      {isAdmin && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Disaster Response Protocol"
          maxWidth="680px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
              <Button variant="secondary" size="sm" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleCreateSubmit} disabled={isCreating}>
                {isCreating ? 'Saving...' : 'Save & Publish Protocol'}
              </Button>
            </div>
          }
        >
          <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--font-sm)', fontWeight: 600 }}>
                Protocol Title *
              </label>
              <input
                className="input"
                style={{ width: '100%' }}
                placeholder="e.g. Hazardous Materials Decontamination Guidelines"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--font-sm)', fontWeight: 600 }}>
                  Category
                </label>
                <select
                  className="select"
                  style={{ width: '100%' }}
                  value={createForm.category}
                  onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                >
                  {categories.filter((c) => c !== 'ALL').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--font-sm)', fontWeight: 600 }}>
                  Disaster Type
                </label>
                <select
                  className="select"
                  style={{ width: '100%' }}
                  value={createForm.disasterType}
                  onChange={(e) => setCreateForm({ ...createForm, disasterType: e.target.value })}
                >
                  {disasterTypes.filter((d) => d !== 'ALL').map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--font-sm)', fontWeight: 600 }}>
                Summary / Executive Overview
              </label>
              <input
                className="input"
                style={{ width: '100%' }}
                placeholder="Brief summary of protocol criteria and triage sequence..."
                value={createForm.summary}
                onChange={(e) => setCreateForm({ ...createForm, summary: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--font-sm)', fontWeight: 600 }}>
                Content & Standard Operating Procedure *
              </label>
              <textarea
                className="textarea"
                rows={8}
                style={{ width: '100%', resize: 'vertical' }}
                placeholder="### 1. Step Overview\nDetailed steps with bullet points..."
                value={createForm.content}
                onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--font-sm)', fontWeight: 600 }}>
                Citation / Source Authority
              </label>
              <input
                className="input"
                style={{ width: '100%' }}
                placeholder="e.g. Incident Command Agency Guidelines 2026"
                value={createForm.source}
                onChange={(e) => setCreateForm({ ...createForm, source: e.target.value })}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default KnowledgeBasePage;
