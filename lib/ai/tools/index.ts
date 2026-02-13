/**
 * AI tool registry
 * Central export point for all AI agent tools
 */

import { queryPipelineTool } from './query-pipeline';
import { getInvestorDetailTool } from './get-investor-detail';
import { strategyAdvisorTool } from './strategy-advisor';
import { updateInvestorTool } from './update-investor';
import { logActivityTool } from './log-activity';

/**
 * Read-only tools
 * These tools can be executed without user confirmation
 * Safe for autonomous AI agent use
 */
export const readOnlyTools = {
  queryPipeline: queryPipelineTool,
  getInvestorDetail: getInvestorDetailTool,
  strategyAdvisor: strategyAdvisorTool,
};

/**
 * Write tools
 * These tools modify data and require special handling
 * - updateInvestor: Returns confirmation request (human-in-the-loop)
 * - logActivity: Executes directly (append-only, low risk)
 */
export const writeTools = {
  updateInvestor: updateInvestorTool,
  logActivity: logActivityTool,
};

/**
 * All tools (read + write)
 * Complete tool set for AI BDR agent
 */
export const allTools = {
  ...readOnlyTools,
  ...writeTools,
};
