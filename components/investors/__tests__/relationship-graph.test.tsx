/**
 * Relationship Graph Component Tests
 * Tests the network visualization graph with sample data
 * Note: This is a test data file, not executable tests
 */

import type { IntroPath } from '@/types/linkedin';
import type { NetworkGraphData } from '../relationship-graph';

// Sample test data
const sampleConnections: IntroPath[] = [
  {
    linkedin_contact_id: '1',
    contact_name: 'John Smith',
    contact_company: 'Sequoia Capital',
    contact_position: 'Partner',
    team_member_name: 'Todd',
    relationship_type: 'works_at',
    path_strength: 1.0,
    strength_label: 'strong',
    path_description: 'John works at Sequoia Capital as a Partner',
    linkedin_url: 'https://linkedin.com/in/johnsmith',
  },
  {
    linkedin_contact_id: '2',
    contact_name: 'Jane Doe',
    contact_company: 'Sequoia Capital',
    contact_position: 'Former VP',
    team_member_name: 'Jeff',
    relationship_type: 'former_colleague',
    path_strength: 0.6,
    strength_label: 'medium',
    path_description: 'Jane used to work at Sequoia Capital',
    linkedin_url: 'https://linkedin.com/in/janedoe',
  },
  {
    linkedin_contact_id: '3',
    contact_name: 'Bob Wilson',
    contact_company: 'Generic Ventures',
    contact_position: 'Managing Partner',
    team_member_name: 'Jackson',
    relationship_type: 'knows_decision_maker',
    path_strength: 0.8,
    strength_label: 'strong',
    path_description: 'Bob knows key decision makers at Sequoia',
    linkedin_url: 'https://linkedin.com/in/bobwilson',
  },
];

/**
 * Test validation functions
 * These validate the graph data structure and path strength calculations
 */

export function validateGraphData(graphData: NetworkGraphData): boolean {
  if (!graphData.investorName || typeof graphData.investorName !== 'string') {
    return false;
  }
  if (!Array.isArray(graphData.connections)) {
    return false;
  }
  return true;
}

export function categorizeByStrength(connections: IntroPath[]) {
  return {
    strong: connections.filter(c => c.strength_label === 'strong').length,
    medium: connections.filter(c => c.strength_label === 'medium').length,
    weak: connections.filter(c => c.strength_label === 'weak').length,
  };
}

export function sortByPathStrength(connections: IntroPath[]): IntroPath[] {
  return [...connections].sort((a, b) => b.path_strength - a.path_strength);
}

export function validateRelationshipTypes(connections: IntroPath[]): boolean {
  const validTypes = [
    'works_at',
    'former_colleague',
    'knows_decision_maker',
    'industry_overlap',
    'geographic_proximity',
  ];

  return connections.every(connection =>
    validTypes.includes(connection.relationship_type)
  );
}

export function validatePathStrengths(connections: IntroPath[]): boolean {
  return connections.every(
    connection =>
      connection.path_strength >= 0 && connection.path_strength <= 1
  );
}

// Export sample data for manual testing
export const testGraphData: NetworkGraphData = {
  investorName: 'Sequoia Capital',
  connections: sampleConnections,
};
