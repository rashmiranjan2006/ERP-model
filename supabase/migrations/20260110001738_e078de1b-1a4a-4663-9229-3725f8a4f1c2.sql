-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'student');

-- Create user_roles table for role-based access control
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
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

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create sections table
CREATE TABLE public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL,
  classroom TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

-- Create subjects table
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('theory', 'lab')),
  credits INTEGER NOT NULL DEFAULT 3,
  lab_room TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- Create faculty table (linked to user profiles)
CREATE TABLE public.faculty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;

-- Create faculty_subjects junction table
CREATE TABLE public.faculty_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  UNIQUE (faculty_id, subject_id, section_id)
);

ALTER TABLE public.faculty_subjects ENABLE ROW LEVEL SECURITY;

-- Create students table (linked to user profiles)
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  roll_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Create rooms table
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('classroom', 'lab')),
  capacity INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Create time_slots table
CREATE TABLE public.time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_order INTEGER NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;

-- Create timetable_entries table
CREATE TABLE public.timetable_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  faculty_id UUID NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  time_slot_id UUID NOT NULL REFERENCES public.time_slots(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 6),
  session_type TEXT NOT NULL CHECK (session_type IN ('theory', 'lab')),
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (section_id, day_of_week, time_slot_id),
  UNIQUE (faculty_id, day_of_week, time_slot_id),
  UNIQUE (room_id, day_of_week, time_slot_id)
);

ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- User roles: Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can manage all roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Sections: All authenticated users can view, only admins can modify
CREATE POLICY "All users can view sections"
ON public.sections FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage sections"
ON public.sections FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Subjects: All authenticated users can view, only admins can modify
CREATE POLICY "All users can view subjects"
ON public.subjects FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage subjects"
ON public.subjects FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Faculty: All authenticated users can view, only admins can modify
CREATE POLICY "All users can view faculty"
ON public.faculty FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage faculty"
ON public.faculty FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Faculty subjects: All authenticated users can view
CREATE POLICY "All users can view faculty_subjects"
ON public.faculty_subjects FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage faculty_subjects"
ON public.faculty_subjects FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Students: Students can view their own data, admins can view all
CREATE POLICY "Students can view own data"
ON public.students FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all students"
ON public.students FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage students"
ON public.students FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Rooms: All authenticated users can view, only admins can modify
CREATE POLICY "All users can view rooms"
ON public.rooms FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage rooms"
ON public.rooms FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Time slots: All authenticated users can view, only admins can modify
CREATE POLICY "All users can view time_slots"
ON public.time_slots FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage time_slots"
ON public.time_slots FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Timetable entries: 
-- Students can view entries for their section
-- Teachers can view entries where they are the faculty
-- Admins can view and manage all
CREATE POLICY "Students can view their section timetable"
ON public.timetable_entries FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.user_id = auth.uid()
    AND s.section_id = timetable_entries.section_id
  )
);

CREATE POLICY "Teachers can view their timetable"
ON public.timetable_entries FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.faculty f
    WHERE f.user_id = auth.uid()
    AND f.id = timetable_entries.faculty_id
  )
);

CREATE POLICY "Admins can view all timetable entries"
ON public.timetable_entries FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage timetable entries"
ON public.timetable_entries FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email
  );
  
  -- Assign role from metadata
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data ->> 'role')::app_role
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timetable_entries_updated_at
  BEFORE UPDATE ON public.timetable_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();