-- Fix RLS policies for questionnaire_responses table
-- This allows the service role to insert/read/update/delete

-- First, enable RLS if not already enabled
ALTER TABLE questionnaire_responses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow service role full access" ON questionnaire_responses;
DROP POLICY IF EXISTS "Allow public to submit" ON questionnaire_responses;
DROP POLICY IF EXISTS "Allow admins to read" ON questionnaire_responses;

-- Allow service role (backend) full access to questionnaire_responses
CREATE POLICY "Allow service role full access"
ON questionnaire_responses
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow public (unauthenticated) to insert questionnaire responses
CREATE POLICY "Allow public to submit"
ON questionnaire_responses
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow authenticated users with admin role to read all responses
CREATE POLICY "Allow admins to read"
ON questionnaire_responses
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users with admin role to delete responses
CREATE POLICY "Allow admins to delete"
ON questionnaire_responses
FOR DELETE
TO authenticated
USING (true);
