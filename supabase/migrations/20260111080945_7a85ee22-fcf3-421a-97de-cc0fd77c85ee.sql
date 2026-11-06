-- Create feedback table for user insights
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT,
  email TEXT NOT NULL,
  overall_experience INTEGER CHECK (overall_experience >= 1 AND overall_experience <= 5),
  tool_usefulness INTEGER CHECK (tool_usefulness >= 1 AND tool_usefulness <= 5),
  perceived_value INTEGER CHECK (perceived_value >= 1 AND perceived_value <= 5),
  ease_of_use INTEGER CHECK (ease_of_use >= 1 AND ease_of_use <= 5),
  most_useful_feature TEXT,
  improvement_suggestions TEXT,
  would_recommend BOOLEAN,
  additional_comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert feedback (anonymous or logged in)
CREATE POLICY "Anyone can submit feedback"
ON public.feedback
FOR INSERT
WITH CHECK (true);

-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
ON public.feedback
FOR SELECT
USING (auth.uid() = user_id);

-- Add index for querying
CREATE INDEX idx_feedback_created_at ON public.feedback(created_at DESC);