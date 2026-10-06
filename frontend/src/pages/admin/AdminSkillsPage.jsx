import React, { useState, useEffect, useMemo } from 'react';
import {
  Zap,
  Search,
  Filter,
  Plus,
  Award,
  ShieldCheck,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Tag,
  Radio,
  Flame,
  ArrowRight,
  Info
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import Modal from '../../components/common/Modal';
import LoadingState from '../../components/states/LoadingState';
import EmptyState from '../../components/states/EmptyState';
import skillService from '../../services/skillService';
import { SKILL_CATEGORIES, PROFICIENCY_LEVELS } from '../../data/skillCategories';

const PROFICIENCY_BADGES = {
  Beginner: 'neutral',
  Intermediate: 'info',
  Advanced: 'warning',
  Expert: 'success'
};

export const AdminSkillsPage = () => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedProficiency, setSelectedProficiency] = useState('ALL');

  // Modal State for adding a skill definition
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSkillData, setNewSkillData] = useState({
    title: '',
    category: SKILL_CATEGORIES[0],
    description: '',
    proficiency: 'Intermediate',
    requiredCertifications: '',
    verificationCriteria: '',
    disasterScenarios: 'All-Hazards Emergency'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  const loadSkills = async () => {
    setLoading(true);
    try {
      const data = await skillService.getSkillsTaxonomy({
        category: selectedCategory,
        search: searchQuery,
        proficiency: selectedProficiency
      });
      setSkills(data);
    } catch (err) {
      console.error('[AdminSkillsPage] Error loading skills taxonomy:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSkills();
  }, [selectedCategory, selectedProficiency]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      loadSkills();
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleCreateSkill = async (e) => {
    e.preventDefault();
    if (!newSkillData.title.trim()) return;

    setIsSubmitting(true);
    try {
      const certs = newSkillData.requiredCertifications
        ? newSkillData.requiredCertifications.split(',').map((c) => c.trim()).filter(Boolean)
        : ['Incident Command Endorsement'];
      const scenarios = newSkillData.disasterScenarios
        ? newSkillData.disasterScenarios.split(',').map((s) => s.trim()).filter(Boolean)
        : ['All-Hazards Emergency'];

      const created = {
        id: `sk-tax-${Date.now().toString().slice(-4)}`,
        title: newSkillData.title.trim(),
        category: newSkillData.category,
        description: newSkillData.description.trim() || 'Operational disaster response capability.',
        proficiency: newSkillData.proficiency,
        requiredCertifications: certs,
        verificationCriteria: newSkillData.verificationCriteria.trim() || 'Official registry verification check.',
        disasterScenarios: scenarios,
        status: 'Standardized'
      };

      setSkills((prev) => [created, ...prev]);
      setIsAddModalOpen(false);
      setNewSkillData({
        title: '',
        category: SKILL_CATEGORIES[0],
        description: '',
        proficiency: 'Intermediate',
        requiredCertifications: '',
        verificationCriteria: '',
        disasterScenarios: 'All-Hazards Emergency'
      });
      setNotification({
        type: 'success',
        message: `Skill capability "${created.title}" successfully added to the master taxonomy.`
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error('[AdminSkillsPage] Error creating skill standard:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', paddingBottom: 'var(--space-12)' }}>
      {/* Page Header */}
      <PageHeader
        title="Emergency Skills Taxonomy & Master Catalog"
        subtitle="Operational disaster capabilities, qualification verification criteria, and required credentials defining the Community Skill Bank."
        icon={<Zap size={24} color="var(--color-primary)" />}
        actions={
          <Button
            variant="primary"
            size="md"
            icon={<Plus size={16} />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Skill Standard
          </Button>
        }
      />

      {/* Operational Concept Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          padding: 'var(--space-3) var(--space-4)',
          background: 'rgba(249, 115, 22, 0.08)',
          border: '1px solid rgba(249, 115, 22, 0.25)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--font-sm)',
          color: 'var(--text-secondary)'
        }}
      >
        <Info size={18} color="var(--color-primary)" style={{ flexShrink: 0 }} />
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>Standardized Competency Framework:</strong> The Community Skill Bank matches verified community responder skills to incident quotas based on strict proficiency thresholds and verified credentials.
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            background: notification.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-critical-bg)',
            border: `1px solid ${notification.type === 'success' ? 'var(--color-success-border)' : 'var(--color-critical-border)'}`,
            borderRadius: 'var(--radius-md)',
            color: notification.type === 'success' ? 'var(--color-success)' : 'var(--color-critical)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            fontSize: 'var(--font-sm)'
          }}
        >
          <CheckCircle2 size={16} />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Taxonomy Quick Statistics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
          gap: 'var(--space-4)'
        }}
      >
        <Card style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: 'rgba(249, 115, 22, 0.12)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={22} />
          </div>
          <div>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block' }}>Master Capabilities</span>
            <strong style={{ fontSize: 'var(--font-xl)', color: 'var(--text-primary)' }}>{skills.length} Registered</strong>
          </div>
        </Card>

        <Card style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: 'rgba(59, 130, 246, 0.12)', color: '#60A5FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={22} />
          </div>
          <div>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block' }}>Response Sectors</span>
            <strong style={{ fontSize: 'var(--font-xl)', color: 'var(--text-primary)' }}>{SKILL_CATEGORIES.length} Categories</strong>
          </div>
        </Card>

        <Card style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.12)', color: '#34D399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block' }}>Verification Standard</span>
            <strong style={{ fontSize: 'var(--font-xl)', color: 'var(--text-primary)' }}>100% Audited</strong>
          </div>
        </Card>

        <Card style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-md)', background: 'rgba(239, 68, 68, 0.12)', color: 'var(--color-critical)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={22} />
          </div>
          <div>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block' }}>Proficiency Range</span>
            <strong style={{ fontSize: 'var(--font-xl)', color: 'var(--text-primary)' }}>4 Skill Tiers</strong>
          </div>
        </Card>
      </div>

      {/* Filter and Search Controls */}
      <Card style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 'var(--space-4)', alignItems: 'center' }}>
          <Input
            placeholder="Search capabilities, certifications, disaster types..."
            icon={<Search size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ marginBottom: 0 }}
          />

          <Select
            label="Filter by Sector / Category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Skill Sectors (11 Categories)' },
              ...SKILL_CATEGORIES.map((cat) => ({ value: cat, label: cat }))
            ]}
            style={{ marginBottom: 0 }}
          />

          <Select
            label="Proficiency Benchmark"
            value={selectedProficiency}
            onChange={(e) => setSelectedProficiency(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Proficiency Tiers' },
              ...PROFICIENCY_LEVELS.map((prof) => ({ value: prof, label: prof }))
            ]}
            style={{ marginBottom: 0 }}
          />
        </div>
      </Card>

      {/* Skills Grid */}
      {loading ? (
        <LoadingState message="Querying master emergency skills taxonomy..." minHeight="320px" />
      ) : skills.length === 0 ? (
        <EmptyState
          icon={<Zap size={36} color="var(--text-muted)" />}
          title="No Matching Capabilities Found"
          description="Try adjusting your keyword search or sector filters to view standardized emergency skills."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedProficiency('ALL');
              }}
            >
              Reset Filters
            </Button>
          }
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))',
            gap: 'var(--space-5)'
          }}
        >
          {skills.map((skill) => (
            <Card
              key={skill.id}
              hover
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 'var(--space-5)',
                gap: 'var(--space-4)'
              }}
            >
              <div>
                {/* Header & Badges */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                  <Badge variant="primary" style={{ fontSize: 'var(--font-xs)' }}>
                    {skill.category}
                  </Badge>
                  <Badge variant={PROFICIENCY_BADGES[skill.proficiency] || 'info'}>
                    Tier: {skill.proficiency}
                  </Badge>
                </div>

                {/* Title */}
                <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
                  {skill.title}
                </h3>

                {/* Description */}
                <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 'var(--space-4)' }}>
                  {skill.description}
                </p>

                {/* Required Certifications */}
                <div style={{ marginBottom: 'var(--space-3)' }}>
                  <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                    <Award size={13} color="var(--color-primary)" />
                    Required Verified Credentials:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {skill.requiredCertifications?.map((cert, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          background: 'var(--bg-surface-elevated)',
                          border: '1px solid var(--border-default)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-primary)'
                        }}
                      >
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Verification Criteria */}
                <div
                  style={{
                    padding: 'var(--space-2) var(--space-3)',
                    background: 'var(--bg-surface-elevated)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px',
                    marginBottom: 'var(--space-3)'
                  }}
                >
                  <ShieldCheck size={14} color="#34D399" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span><strong>Audit Standard:</strong> {skill.verificationCriteria}</span>
                </div>

                {/* Applicable Disaster Scenarios */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Applicable:</span>
                  {skill.disasterScenarios?.map((scen, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '10px',
                        padding: '1px 6px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        color: '#F87171',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      {scen}
                    </span>
                  ))}
                </div>
              </div>

              {/* Status footer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: 'var(--space-3)',
                  fontSize: 'var(--font-xs)',
                  color: 'var(--text-muted)'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-success)' }}>
                  <CheckCircle2 size={12} /> Standardized
                </span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{skill.id}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Skill Standard Modal */}
      {isAddModalOpen && (
        <Modal
          title="Register Master Skill Standard"
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        >
          <form onSubmit={handleCreateSkill} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Input
              label="Skill Capability Title"
              required
              placeholder="e.g. Hazardous Materials Containment & Spill Isolation"
              value={newSkillData.title}
              onChange={(e) => setNewSkillData((prev) => ({ ...prev, title: e.target.value }))}
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
              <Select
                label="Sector Category"
                value={newSkillData.category}
                onChange={(e) => setNewSkillData((prev) => ({ ...prev, category: e.target.value }))}
                options={SKILL_CATEGORIES.map((c) => ({ value: c, label: c }))}
              />
              <Select
                label="Benchmark Proficiency Tier"
                value={newSkillData.proficiency}
                onChange={(e) => setNewSkillData((prev) => ({ ...prev, proficiency: e.target.value }))}
                options={PROFICIENCY_LEVELS.map((p) => ({ value: p, label: p }))}
              />
            </div>

            <Textarea
              label="Operational Capability Description"
              rows={3}
              placeholder="Describe tactical field tasks, deployment constraints, and equipment knowledge required..."
              value={newSkillData.description}
              onChange={(e) => setNewSkillData((prev) => ({ ...prev, description: e.target.value }))}
            />

            <Input
              label="Required Certifications (comma-separated)"
              placeholder="e.g. OSHA HAZWOPER 40-hr, NFPA 472 Operations"
              value={newSkillData.requiredCertifications}
              onChange={(e) => setNewSkillData((prev) => ({ ...prev, requiredCertifications: e.target.value }))}
              helperText="Credentials verified before volunteer dispatch."
            />

            <Input
              label="Audit & Verification Standard"
              placeholder="e.g. State certified academy examination transcript check"
              value={newSkillData.verificationCriteria}
              onChange={(e) => setNewSkillData((prev) => ({ ...prev, verificationCriteria: e.target.value }))}
            />

            <Input
              label="Applicable Incident Scenarios (comma-separated)"
              placeholder="e.g. Industrial Spill, Train Derailment, Pipeline Rupture"
              value={newSkillData.disasterScenarios}
              onChange={(e) => setNewSkillData((prev) => ({ ...prev, disasterScenarios: e.target.value }))}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
              <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Registering...' : 'Save Skill Standard'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminSkillsPage;
