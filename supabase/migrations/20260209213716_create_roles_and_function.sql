-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user'::public.app_role,
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create basic policies for user_roles so users can read their own roles
CREATE POLICY "Users can read own roles" ON public.user_roles 
  FOR SELECT USING (auth.uid() = user_id);

-- Create has_role function that takes (uuid, text)
CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, role_name text)
RETURNS boolean AS $$
DECLARE
  role_count int;
BEGIN
  SELECT count(*)
  INTO role_count
  FROM public.user_roles
  WHERE user_roles.user_id = has_role.user_id 
    AND user_roles.role = has_role.role_name::public.app_role;
  
  RETURN role_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create has_role function that takes (uuid, app_role)
CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, role_name public.app_role)
RETURNS boolean AS $$
DECLARE
  role_count int;
BEGIN
  SELECT count(*)
  INTO role_count
  FROM public.user_roles
  WHERE user_roles.user_id = has_role.user_id 
    AND user_roles.role = has_role.role_name;
  
  RETURN role_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
