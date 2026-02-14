'use client';

/**
 * MeetingIntelligenceCard component
 * Displays AI-extracted insights from a meeting recording
 */

import { useState } from 'react';
import { format } from 'date-fns';
import {
  Calendar,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ListTodo,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { MeetingWithDetails } from '@/types/meetings';

// ============================================================================
// TYPES
// ============================================================================

interface MeetingIntelligenceCardProps {
  meeting: MeetingWithDetails;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MeetingIntelligenceCard({ meeting }: MeetingIntelligenceCardProps) {
  const [showTranscript, setShowTranscript] = useState(false);
  const transcript = meeting.transcript;

  // Format meeting date
  const meetingDate = new Date(meeting.meeting_date);
  const formattedDate = format(meetingDate, 'MMM d, yyyy');
  const formattedTime = format(meetingDate, 'h:mm a');

  // Get status badge color
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'processing':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Get sentiment color
  const getSentimentColor = (sentiment: string | null) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-500';
      case 'negative':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <CardTitle className="text-lg">{meeting.meeting_title}</CardTitle>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formattedDate}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formattedTime}
              </div>
              {meeting.duration_minutes && (
                <div className="flex items-center gap-1">
                  <span>{meeting.duration_minutes} min</span>
                </div>
              )}
            </div>
          </div>
          <Badge variant={getStatusBadgeVariant(meeting.status)}>
            {meeting.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Processing Error */}
        {meeting.status === 'failed' && meeting.processing_error && (
          <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">Processing Failed</p>
              <p className="text-xs text-muted-foreground mt-1">
                {meeting.processing_error}
              </p>
            </div>
          </div>
        )}

        {/* Pending State */}
        {meeting.status === 'pending' && (
          <div className="text-center py-6">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No recording uploaded yet
            </p>
          </div>
        )}

        {/* Intelligence (only show if completed and has transcript) */}
        {meeting.status === 'completed' && transcript && (
          <div className="space-y-4">
            {/* Summary */}
            {transcript.summary && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-medium">Summary</h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {transcript.summary}
                </p>
              </div>
            )}

            {/* Sentiment */}
            {transcript.sentiment && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-medium">Sentiment</h4>
                </div>
                <Badge
                  variant="outline"
                  className={getSentimentColor(transcript.sentiment)}
                >
                  {transcript.sentiment.charAt(0).toUpperCase() +
                    transcript.sentiment.slice(1)}
                </Badge>
              </div>
            )}

            <Separator />

            {/* Key Topics */}
            {transcript.key_topics && transcript.key_topics.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-medium">Key Topics</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {transcript.key_topics.map((topic, index) => (
                    <Badge key={index} variant="secondary">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Action Items */}
            {transcript.action_items && transcript.action_items.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ListTodo className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-medium">
                    Action Items ({transcript.action_items.length})
                  </h4>
                </div>
                <div className="space-y-2">
                  {transcript.action_items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 text-sm bg-muted/30 rounded-lg p-2"
                    >
                      <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{item.description}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          {item.assignee && <span>Assignee: {item.assignee}</span>}
                          {item.due_date && (
                            <span>Due: {format(new Date(item.due_date), 'MMM d')}</span>
                          )}
                          {item.priority && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0">
                              {item.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Objections */}
            {transcript.objections && transcript.objections.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-medium">
                    Objections ({transcript.objections.length})
                  </h4>
                </div>
                <div className="space-y-2">
                  {transcript.objections.map((objection, index) => (
                    <div
                      key={index}
                      className="text-sm bg-muted/30 rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-start gap-2">
                        <span className="font-medium text-destructive">Objection:</span>
                        <span className="flex-1">{objection.objection}</span>
                      </div>
                      {objection.response && (
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-primary">Response:</span>
                          <span className="flex-1">{objection.response}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={objection.resolved ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {objection.resolved ? 'Resolved' : 'Unresolved'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Steps */}
            {transcript.next_steps && transcript.next_steps.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-medium">Next Steps</h4>
                </div>
                <ul className="space-y-1.5">
                  {transcript.next_steps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-0.5">•</span>
                      <span className="flex-1">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Full Transcript (collapsible) */}
            {transcript.transcript_text && (
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTranscript(!showTranscript)}
                  className="w-full justify-between"
                >
                  <span className="text-sm font-medium">Full Transcript</span>
                  {showTranscript ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
                {showTranscript && (
                  <div className="mt-2 bg-muted/30 rounded-lg p-3">
                    <pre className="text-xs whitespace-pre-wrap font-mono">
                      {transcript.transcript_text}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Processing Metadata */}
            {transcript.model_used && (
              <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                Analyzed with {transcript.model_used}
                {transcript.processing_duration_ms && (
                  <> in {(transcript.processing_duration_ms / 1000).toFixed(1)}s</>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
