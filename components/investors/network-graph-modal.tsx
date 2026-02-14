'use client';

/**
 * Network Graph Modal Component
 * Modal dialog that displays the relationship graph visualization
 * Includes "View Network" button trigger
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RelationshipGraph, NetworkGraphData } from './relationship-graph';
import { Network, ExternalLink } from 'lucide-react';
import type { IntroPath } from '@/types/linkedin';

interface NetworkGraphModalProps {
  investorId: string;
  investorName: string;
  connections: IntroPath[];
}

export function NetworkGraphModal({
  investorId,
  investorName,
  connections,
}: NetworkGraphModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<{ id: string; type: string } | null>(null);

  const graphData: NetworkGraphData = {
    investorName,
    connections,
  };

  const handleNodeClick = (nodeId: string, nodeType: string) => {
    setSelectedNode({ id: nodeId, type: nodeType });

    // If clicking on a contact node, open their LinkedIn profile
    if (nodeType === 'contact') {
      const contact = connections.find(
        c => `contact-${c.linkedin_contact_id}` === nodeId
      );
      if (contact?.linkedin_url) {
        window.open(contact.linkedin_url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  // Calculate stats
  const strongCount = connections.filter(c => c.strength_label === 'strong').length;
  const mediumCount = connections.filter(c => c.strength_label === 'medium').length;
  const weakCount = connections.filter(c => c.strength_label === 'weak').length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Network className="h-4 w-4 mr-2" />
          View Network
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Network Graph: {investorName}
          </DialogTitle>
          <DialogDescription>
            Visualizing warm introduction paths through your LinkedIn network
          </DialogDescription>
        </DialogHeader>

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-4 my-4">
          <div className="p-3 border rounded-lg">
            <div className="text-2xl font-bold">{connections.length}</div>
            <div className="text-xs text-muted-foreground">Total Paths</div>
          </div>
          <div className="p-3 border rounded-lg border-green-500/50 bg-green-50 dark:bg-green-950/30">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {strongCount}
            </div>
            <div className="text-xs text-muted-foreground">Strong Paths</div>
          </div>
          <div className="p-3 border rounded-lg border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/30">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {mediumCount}
            </div>
            <div className="text-xs text-muted-foreground">Medium Paths</div>
          </div>
          <div className="p-3 border rounded-lg border-gray-500/50">
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
              {weakCount}
            </div>
            <div className="text-xs text-muted-foreground">Weak Paths</div>
          </div>
        </div>

        {/* Graph Visualization */}
        <div className="relative">
          <RelationshipGraph
            data={graphData}
            onNodeClick={handleNodeClick}
          />
        </div>

        {/* Legend */}
        <div className="mt-4 p-4 border rounded-lg bg-muted/20">
          <div className="text-sm font-semibold mb-2">How to use:</div>
          <ul className="text-xs space-y-1 text-muted-foreground">
            <li>Click and drag to pan the graph</li>
            <li>Scroll to zoom in/out</li>
            <li>Click on contact nodes to open their LinkedIn profile</li>
            <li>
              <span className="text-green-600 dark:text-green-400 font-semibold">Green</span> =
              Strong path (current employee or decision maker)
            </li>
            <li>
              <span className="text-yellow-600 dark:text-yellow-400 font-semibold">Yellow</span> =
              Medium path (former colleague)
            </li>
            <li>
              <span className="text-gray-600 dark:text-gray-400 font-semibold">Gray</span> =
              Weak path (industry overlap, proximity)
            </li>
          </ul>
        </div>

        {/* Selected Node Details */}
        {selectedNode && selectedNode.type === 'contact' && (
          <div className="mt-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/30">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Selected Contact</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedNode(null)}
              >
                Clear
              </Button>
            </div>
            {(() => {
              const contact = connections.find(
                c => `contact-${c.linkedin_contact_id}` === selectedNode.id
              );
              if (!contact) return null;

              return (
                <div className="mt-2 space-y-1 text-sm">
                  <div><strong>Name:</strong> {contact.contact_name}</div>
                  <div><strong>Company:</strong> {contact.contact_company}</div>
                  <div><strong>Position:</strong> {contact.contact_position}</div>
                  <div><strong>Team Member:</strong> {contact.team_member_name}</div>
                  <div><strong>Relationship:</strong> {contact.relationship_type.replace(/_/g, ' ')}</div>
                  <div><strong>Description:</strong> {contact.path_description}</div>
                  {contact.linkedin_url && (
                    <div>
                      <a
                        href={contact.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                      >
                        View LinkedIn Profile
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
