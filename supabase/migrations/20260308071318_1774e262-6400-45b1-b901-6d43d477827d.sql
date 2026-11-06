
CREATE TABLE public.industry_benchmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_code text NOT NULL,
  business_size text NOT NULL DEFAULT '1-10',
  liquidity_median integer NOT NULL DEFAULT 50,
  profitability_median integer NOT NULL DEFAULT 50,
  efficiency_median integer NOT NULL DEFAULT 50,
  preparedness_median integer NOT NULL DEFAULT 50,
  sample_size integer DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (industry_code, business_size)
);

ALTER TABLE public.industry_benchmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read benchmarks"
  ON public.industry_benchmarks
  FOR SELECT
  TO authenticated
  USING (true);
