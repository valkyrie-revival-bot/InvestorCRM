/**
 * AI tool registry
 * Central export point for all AI agent tools
 */

import { queryPipelineTool } from './query-pipeline';
import { getInvestorDetailTool } from './get-investor-detail';
import { strategyAdvisorTool } from './strategy-advisor';

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
 * All tools (including write operations added in Plan 03)
 * Currently same as readOnlyTools
 * Write tools will be added in subsequent plan
 */
export const allTools = {
  ...readOnlyTools,
  // Write tools will be added in Plan 09-03
};
