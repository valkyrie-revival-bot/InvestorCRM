# LinkedIn Relationship Graph Visualization Feature

## Overview
Interactive network graph visualization showing warm introduction paths from your LinkedIn network to target investors.

## Architecture

### Components

#### 1. `components/investors/relationship-graph.tsx`
Main graph visualization component using React Flow.

**Features:**
- Interactive node-based graph visualization
- Three node types:
  - **User Node** (center): Represents your network
  - **Contact Nodes** (middle): LinkedIn connections
  - **Investor Node** (bottom): Target investor
- Color-coded edges by connection strength:
  - Green (animated): Strong paths
  - Yellow: Medium paths
  - Gray: Weak paths
- Click nodes to interact
- Pan, zoom, minimap controls

**Props:**
```typescript
interface RelationshipGraphProps {
  data: NetworkGraphData;
  onNodeClick?: (nodeId: string, nodeType: string) => void;
}
```

#### 2. `components/investors/network-graph-modal.tsx`
Modal wrapper component with "View Network" button.

**Features:**
- Summary statistics (total, strong, medium, weak paths)
- Interactive graph display
- Legend and usage instructions
- Selected node details panel
- LinkedIn profile links

**Props:**
```typescript
interface NetworkGraphModalProps {
  investorId: string;
  investorName: string;
  connections: IntroPath[];
}
```

### Server Actions

#### `app/actions/network.ts`

**Functions:**

1. **`getNetworkGraph(investorId: string)`**
   - Fetches all connections for an investor
   - Returns NetworkPath with statistics
   - Sorted by path strength

2. **`getNetworkOverview()`**
   - Returns summary for all investors
   - Shows which investors have best connections
   - Useful for prioritization

3. **`getBestIntroPath(investorId: string)`**
   - Returns single strongest path to investor
   - Used for warm intro outreach recommendations

### API Endpoint

#### `GET /api/investors/[id]/network`

Returns network graph data for a specific investor.

**Response:**
```typescript
{
  investorId: string;
  investorName: string;
  connections: IntroPath[];
  totalPaths: number;
  strongPaths: number;
  mediumPaths: number;
  weakPaths: number;
}
```

## Integration

### Investor Detail Page
Updated `/app/(dashboard)/investors/[id]/page.tsx` to include:

1. Import `NetworkGraphModal` component
2. Added "View Network" button in LinkedIn Connections section
3. Only shows when connections exist

```tsx
<NetworkGraphModal
  investorId={investor.id}
  investorName={investor.firm_name}
  connections={connections}
/>
```

## Path Strength Algorithm

### Scoring Logic
```typescript
function getPathScore(path: IntroPath): number {
  let score = path.path_strength * 100; // Base: 0-100

  // Relationship type boost
  if (path.relationship_type === 'works_at') score += 20;
  else if (path.relationship_type === 'knows_decision_maker') score += 15;
  else if (path.relationship_type === 'former_colleague') score += 10;

  return Math.min(score, 100);
}
```

### Strength Labels
- **Strong** (>= 0.7): Current employees, decision makers
- **Medium** (>= 0.4): Former colleagues
- **Weak** (< 0.4): Industry overlap, geographic proximity

## Usage

### For Users

1. Navigate to investor detail page
2. Scroll to "LinkedIn Connections" section
3. Click "View Network" button (only visible if connections exist)
4. Explore the graph:
   - Pan by clicking and dragging
   - Zoom with scroll wheel
   - Click contact nodes to open LinkedIn profiles
   - View connection details in sidebar

### For Developers

**Add network graph to any page:**

```tsx
import { NetworkGraphModal } from '@/components/investors/network-graph-modal';
import { getInvestorConnections } from '@/app/actions/linkedin';

// In server component
const connections = await getInvestorConnections(investorId);

// In JSX
<NetworkGraphModal
  investorId={investorId}
  investorName={investorName}
  connections={connections.data || []}
/>
```

**Use network actions directly:**

```tsx
import { getNetworkGraph, getBestIntroPath } from '@/app/actions/network';

// Get full network
const network = await getNetworkGraph(investorId);

// Get best single path
const bestPath = await getBestIntroPath(investorId);
```

## Testing

### Test Data
Sample test data available in:
`components/investors/__tests__/relationship-graph.test.tsx`

### Validation Functions
```typescript
import {
  validateGraphData,
  categorizeByStrength,
  sortByPathStrength,
  validateRelationshipTypes,
  validatePathStrengths,
} from '@/components/investors/__tests__/relationship-graph.test';
```

## Dependencies

- **reactflow** (^11.x): Graph visualization library
- React 19.2.3
- Next.js 16.1.6
- TypeScript

## Database Schema

Uses existing tables:
- `linkedin_contacts`: Team member connections
- `investor_relationships`: Relationship mappings
- `investors`: Target investor firms

No new migrations required.

## Future Enhancements

1. **Multi-hop paths**: Show User → Contact → Contact → Investor
2. **Path recommendations**: AI-powered best intro suggestions
3. **Export to PNG/SVG**: Save graph visualizations
4. **Network analytics**: Aggregate insights across all investors
5. **Real-time updates**: Live refresh when new LinkedIn contacts imported
6. **Custom layouts**: Tree, circular, force-directed options
7. **Filter by team member**: View specific person's network
8. **Relationship notes**: Add context to specific connections

## Performance

- Efficient for networks up to 100 connections per investor
- Lazy loading for large networks
- Memoized graph calculations
- React Flow handles rendering optimization

## Accessibility

- Keyboard navigation support
- ARIA labels on interactive elements
- High contrast color scheme
- Screen reader friendly node descriptions

## License
Part of Sales Tracking application (internal use)
