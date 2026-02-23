-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'member', 'viewer');

-- Create organizations table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table (links users to organizations)
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create cloud_services reference table
CREATE TABLE public.cloud_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  icon_name TEXT,
  color TEXT
);

-- Create billing_items table (main cost data)
CREATE TABLE public.billing_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.cloud_services(id),
  service_name TEXT NOT NULL,
  cost DECIMAL(12, 4) NOT NULL,
  usage_quantity DECIMAL(16, 4),
  usage_unit TEXT,
  usage_date DATE NOT NULL,
  region TEXT,
  tag_team TEXT,
  tag_project TEXT,
  tag_environment TEXT,
  resource_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cost_aggregations table (pre-computed daily/monthly totals)
CREATE TABLE public.cost_aggregations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'monthly')),
  period_start DATE NOT NULL,
  service_name TEXT,
  tag_team TEXT,
  tag_environment TEXT,
  total_cost DECIMAL(14, 4) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (organization_id, period_type, period_start, service_name, tag_team, tag_environment)
);

-- Create recommendations table
CREATE TABLE public.recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  current_cost DECIMAL(12, 4) NOT NULL,
  projected_savings DECIMAL(12, 4) NOT NULL,
  confidence TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),
  resource_id TEXT,
  service_name TEXT,
  action_type TEXT NOT NULL,
  is_applied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scenarios table for what-if simulator
CREATE TABLE public.scenarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  parameters JSONB NOT NULL DEFAULT '{}',
  original_cost DECIMAL(14, 4) NOT NULL,
  projected_cost DECIMAL(14, 4) NOT NULL,
  savings DECIMAL(14, 4) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create budget_alerts table
CREATE TABLE public.budget_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  threshold_amount DECIMAL(12, 4) NOT NULL,
  current_amount DECIMAL(12, 4) DEFAULT 0,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_aggregations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_alerts ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's organization_id
CREATE OR REPLACE FUNCTION public.get_user_organization_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE user_id = _user_id
$$;

-- Cloud services is public read (reference data)
CREATE POLICY "Cloud services are publicly readable"
ON public.cloud_services FOR SELECT
TO authenticated
USING (true);

-- Organizations: users can only see their own org
CREATE POLICY "Users can view their organization"
ON public.organizations FOR SELECT
TO authenticated
USING (id = public.get_user_organization_id(auth.uid()));

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- User roles policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Billing items: org-level access
CREATE POLICY "Users can view their org billing items"
ON public.billing_items FOR SELECT
TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- Cost aggregations: org-level access
CREATE POLICY "Users can view their org cost aggregations"
ON public.cost_aggregations FOR SELECT
TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- Recommendations: org-level access
CREATE POLICY "Users can view their org recommendations"
ON public.recommendations FOR SELECT
TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update their org recommendations"
ON public.recommendations FOR UPDATE
TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- Scenarios: org-level access with user ownership
CREATE POLICY "Users can view their org scenarios"
ON public.scenarios FOR SELECT
TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert their own scenarios"
ON public.scenarios FOR INSERT
TO authenticated
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()) AND user_id = auth.uid());

CREATE POLICY "Users can update their own scenarios"
ON public.scenarios FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own scenarios"
ON public.scenarios FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Budget alerts: org-level access
CREATE POLICY "Users can view their org budget alerts"
ON public.budget_alerts FOR SELECT
TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can manage their org budget alerts"
ON public.budget_alerts FOR ALL
TO authenticated
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- Trigger for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup (creates org and profile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create a new organization for the user
  INSERT INTO public.organizations (name)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email) || '''s Organization')
  RETURNING id INTO new_org_id;
  
  -- Create profile linked to the new organization
  INSERT INTO public.profiles (user_id, organization_id, full_name)
  VALUES (NEW.id, new_org_id, NEW.raw_user_meta_data->>'full_name');
  
  -- Assign admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert cloud service reference data
INSERT INTO public.cloud_services (name, category, icon_name, color) VALUES
  ('EC2', 'Compute', 'Server', '#FF9900'),
  ('Lambda', 'Compute', 'Zap', '#FF9900'),
  ('S3', 'Storage', 'Database', '#569A31'),
  ('RDS', 'Database', 'Database', '#527FFF'),
  ('DynamoDB', 'Database', 'Table', '#527FFF'),
  ('CloudWatch', 'Monitoring', 'Activity', '#FF4F8B'),
  ('CloudFront', 'Networking', 'Globe', '#8C4FFF'),
  ('EBS', 'Storage', 'HardDrive', '#569A31'),
  ('EKS', 'Containers', 'Box', '#FF9900'),
  ('ElastiCache', 'Database', 'Cpu', '#527FFF'),
  ('Route53', 'Networking', 'MapPin', '#8C4FFF'),
  ('SNS', 'Application', 'Bell', '#FF4F8B'),
  ('SQS', 'Application', 'Layers', '#FF4F8B'),
  ('API Gateway', 'Networking', 'Share2', '#8C4FFF'),
  ('Secrets Manager', 'Security', 'Lock', '#DD344C');