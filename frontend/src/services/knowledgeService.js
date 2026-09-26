/**
 * Knowledge Service (Stage 12 — Knowledge Assistant)
 * 
 * Provides search, category filtering, disaster type filtering,
 * article retrieval, and deterministic emergency assistant reasoning.
 * 
 * Architecture:
 * Knowledge UI -> Knowledge Service -> Development Knowledge Adapter -> Development Knowledge Data
 * 
 * Future Stage 17 Architecture:
 * Knowledge UI -> Knowledge Service -> API Client -> Module 15 Backend APIs -> PostgreSQL
 * 
 * IMPORTANT:
 * - Deterministic responses only; ZERO generative AI, LLM, or OpenAI dependencies.
 * - Read-oriented; fully accessible offline from local development cache.
 */

import {
  INITIAL_DEV_KNOWLEDGE,
  KNOWLEDGE_CATEGORIES,
  DISASTER_TYPES,
  DETERMINISTIC_ASSISTANT_KNOWLEDGE_BASE
} from '../data/devKnowledge.js';

const STORAGE_KEY = 'csb_dev_knowledge';

/**
 * Safely retrieve knowledge records from local development store with seed fallback
 */
const getStoredKnowledge = () => {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEV_KNOWLEDGE));
      }
      return JSON.parse(JSON.stringify(INITIAL_DEV_KNOWLEDGE));
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[knowledgeService] Failed to read cached knowledge store, using fallback:', err);
    return JSON.parse(JSON.stringify(INITIAL_DEV_KNOWLEDGE));
  }
};

export const knowledgeService = {
  /**
   * Retrieve all categories
   * @returns {Array<string>}
   */
  getCategories() {
    return [...KNOWLEDGE_CATEGORIES];
  },

  /**
   * Retrieve all disaster types
   * @returns {Array<string>}
   */
  getDisasterTypes() {
    return [...DISASTER_TYPES];
  },

  /**
   * Retrieve knowledge documents with optional conjunctive search and filters
   * @param {Object} filters - { query, category, disasterType }
   * @returns {Promise<Array>}
   */
  async getKnowledgeItems(filters = {}) {
    const { query = '', category = 'ALL', disasterType = 'ALL' } = filters;
    let items = getStoredKnowledge();

    // 1. Category Filter
    if (category && category !== 'ALL') {
      items = items.filter(
        (doc) => doc.category.toLowerCase() === category.toLowerCase()
      );
    }

    // 2. Disaster Type Filter
    if (disasterType && disasterType !== 'ALL') {
      items = items.filter(
        (doc) => doc.disasterType.toLowerCase() === disasterType.toLowerCase()
      );
    }

    // 3. Search Query
    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      items = items.filter((doc) => {
        const inTitle = doc.title.toLowerCase().includes(q);
        const inSummary = doc.summary.toLowerCase().includes(q);
        const inContent = doc.content.toLowerCase().includes(q);
        const inTags = Array.isArray(doc.tags) && doc.tags.some((t) => t.toLowerCase().includes(q));
        const inSource = doc.source && doc.source.toLowerCase().includes(q);
        return inTitle || inSummary || inContent || inTags || inSource;
      });
    }

    return JSON.parse(JSON.stringify(items));
  },

  /**
   * Retrieve a single knowledge document by ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async getKnowledgeItemById(id) {
    const items = getStoredKnowledge();
    const doc = items.find((item) => item.id === id);
    if (!doc) return null;
    return JSON.parse(JSON.stringify(doc));
  },

  /**
   * Search knowledge base
   * @param {string} query
   * @param {Object} filters
   * @returns {Promise<Array>}
   */
  async searchKnowledge(query, filters = {}) {
    return this.getKnowledgeItems({ ...filters, query });
  },

  /**
   * Filter documents by category
   * @param {string} category
   * @returns {Promise<Array>}
   */
  async filterByCategory(category) {
    return this.getKnowledgeItems({ category });
  },

  /**
   * Filter documents by disaster type
   * @param {string} disasterType
   * @returns {Promise<Array>}
   */
  async filterByDisasterType(disasterType) {
    return this.getKnowledgeItems({ disasterType });
  },

  /**
   * Deterministic Knowledge Assistant
   * Synthesizes answers directly from the disaster knowledge dataset
   * ZERO external AI or generative LLM dependencies.
   * 
   * @param {string} rawQuery - User's question
   * @returns {Promise<Object>} Formatted assistant response with document references
   */
  async askAssistant(rawQuery) {
    if (!rawQuery || !rawQuery.trim()) {
      throw new Error('Please enter a question for the Emergency Knowledge Assistant.');
    }

    const query = rawQuery.trim().toLowerCase();
    const allDocs = getStoredKnowledge();

    // 1. Direct Keyword / Topic Match against pre-compiled assistant entries
    let matchedEntry = null;
    let highestScore = 0;

    DETERMINISTIC_ASSISTANT_KNOWLEDGE_BASE.forEach((entry) => {
      let score = 0;
      entry.keywords.forEach((kw) => {
        if (query.includes(kw)) {
          score += 2;
        }
      });
      if (entry.question.toLowerCase().includes(query)) {
        score += 5;
      }
      if (score > highestScore) {
        highestScore = score;
        matchedEntry = entry;
      }
    });

    if (matchedEntry && highestScore > 0) {
      // Find referenced knowledge documents
      const referencedDocs = allDocs.filter((doc) =>
        matchedEntry.referencedDocIds.includes(doc.id)
      );

      return {
        question: rawQuery.trim(),
        answer: matchedEntry.answer,
        category: matchedEntry.category,
        disasterType: matchedEntry.disasterType,
        safetyNotes: matchedEntry.safetyNotes,
        relevantDocs: referencedDocs,
        source: 'Official Incident Command Knowledge Graph',
        isDeterministic: true,
        answeredAt: new Date().toISOString()
      };
    }

    // 2. Fallback: Search all knowledge documents dynamically for the top matching document
    const searchMatches = await this.searchKnowledge(rawQuery);

    if (searchMatches.length > 0) {
      const primaryDoc = searchMatches[0];
      return {
        question: rawQuery.trim(),
        answer: `Based on **${primaryDoc.title}** (${primaryDoc.category} — ${primaryDoc.disasterType}):\n\n${primaryDoc.summary}\n\nKey Protocol Highlights:\n${primaryDoc.content.split('\n\n').slice(0, 3).join('\n\n')}`,
        category: primaryDoc.category,
        disasterType: primaryDoc.disasterType,
        safetyNotes: 'Always verify field hazards with your on-scene Incident Commander before initiating high-risk tactical responses.',
        relevantDocs: searchMatches.slice(0, 3),
        source: primaryDoc.source,
        isDeterministic: true,
        answeredAt: new Date().toISOString()
      };
    }

    // 3. General Fallback response
    return {
      question: rawQuery.trim(),
      answer: `No precise field protocol matched your query "${rawQuery}". For immediate emergency guidelines, consult standard First Aid protocols (START), Swiftwater Evacuation guidelines, or contact Incident Command Base directly on the tactical radio mesh.`,
      category: 'General Emergency',
      disasterType: 'General Emergency',
      safetyNotes: 'Life safety is always the top priority. If in immediate danger, evacuate to designated high ground.',
      relevantDocs: allDocs.slice(0, 2),
      source: 'Community Skill Bank Knowledge Base',
      isDeterministic: true,
      answeredAt: new Date().toISOString()
    };
  },

  /**
   * Reset knowledge storage to initial development fixtures
   */
  resetDevelopmentKnowledge() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEV_KNOWLEDGE));
    }
    return JSON.parse(JSON.stringify(INITIAL_DEV_KNOWLEDGE));
  }
};

export default knowledgeService;
