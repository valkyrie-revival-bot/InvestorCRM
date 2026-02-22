-- Investor Intelligence table
-- Stores scraped company intelligence from Bright Data (SERP + LinkedIn)
-- One row per investor, upserted on each scrape refresh

CREATE TABLE IF NOT EXISTS investor_intelligence (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id         UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,

  -- Source URLs (auto-detected or user-provided)
  linkedin_url        TEXT,
  crunchbase_url      TEXT,
  website             TEXT,

  -- Firm profile (extracted from SERP + LinkedIn)
  about               TEXT,
  investment_thesis   TEXT,
  aum_estimate        TEXT,
  industries          TEXT[]    DEFAULT '{}',
  headquarters        TEXT,
  employee_count      TEXT,
  founded             TEXT,
  company_size        TEXT,
  logo_url            TEXT,

  -- Investment portfolio (extracted from SERP + Crunchbase snippets)
  -- [{name, type, amount, date, source_url}]
  investments         JSONB     DEFAULT '[]',

  -- Raw SERP snippets kept for re-extraction or debugging
  web_snippets        JSONB     DEFAULT '[]',

  -- Scrape lifecycle
  status              TEXT      NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','processing','complete','error')),
  error_message       TEXT,
  scraped_at          TIMESTAMPTZ,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT investor_intelligence_investor_id_unique UNIQUE (investor_id)
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_investor_intelligence_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER investor_intelligence_updated_at
  BEFORE UPDATE ON investor_intelligence
  FOR EACH ROW EXECUTE FUNCTION update_investor_intelligence_updated_at();

-- RLS
ALTER TABLE investor_intelligence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view investor intelligence"
  ON investor_intelligence FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage investor intelligence"
  ON investor_intelligence FOR ALL
  TO authenticated USING (true);

-- Index for fast lookup by investor_id
CREATE INDEX IF NOT EXISTS idx_investor_intelligence_investor_id
  ON investor_intelligence (investor_id);
