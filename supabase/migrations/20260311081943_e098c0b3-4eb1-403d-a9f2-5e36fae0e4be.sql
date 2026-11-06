
ALTER TABLE validation_questions DROP CONSTRAINT IF EXISTS validation_questions_domain_check;
ALTER TABLE validation_questions ADD CONSTRAINT validation_questions_domain_check 
  CHECK (domain IN ('fais_financial_conduct', 'popia', 'cipc_companies_act', 'labour_bcea', 'fais_financial', 'tax_sars'));
