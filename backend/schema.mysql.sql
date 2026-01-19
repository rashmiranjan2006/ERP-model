-- ERP Timetable SQL Schema (MySQL)

-- Enum simulation for app_role
drop table if exists app_role;
create table app_role (
  role varchar(20) primary key
);
insert into app_role (role) values ('admin'), ('teacher'), ('student');

-- User roles table
create table if not exists user_roles (
  id char(36) primary key,
  user_id char(36) not null,
  role varchar(20) not null,
  created_at timestamp not null default current_timestamp,
  unique key (user_id, role),
  foreign key (role) references app_role(role)
);

-- Profiles table
create table if not exists profiles (
  id char(36) primary key,
  full_name varchar(255) not null,
  email varchar(255) not null,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp
);

-- Sections table
create table if not exists sections (
  id char(36) primary key,
  name varchar(100) not null,
  department varchar(100) not null,
  classroom varchar(100) not null
);

-- Subjects table
create table if not exists subjects (
  id char(36) primary key,
  name varchar(100) not null,
  code varchar(20) not null,
  type enum('theory','lab') not null,
  lab_room varchar(100),
  credits int not null
);

-- Time slots table
create table if not exists time_slots (
  id char(36) primary key,
  start_time time not null,
  end_time time not null,
  slot_order int not null
);

-- Rooms table
create table if not exists rooms (
  id char(36) primary key,
  name varchar(100) not null,
  type enum('classroom','lab') not null,
  capacity int not null
);

-- Faculty table
create table if not exists faculty (
  id char(36) primary key,
  name varchar(100) not null,
  department varchar(100) not null
);

-- Faculty-Subject mapping
create table if not exists faculty_subjects (
  id char(36) primary key,
  faculty_id char(36) not null,
  subject_id char(36) not null,
  section_id char(36) not null,
  foreign key (faculty_id) references faculty(id),
  foreign key (subject_id) references subjects(id),
  foreign key (section_id) references sections(id)
);

-- Timetable entries
create table if not exists timetable_entries (
  id char(36) primary key,
  section_id char(36) not null,
  subject_id char(36) not null,
  faculty_id char(36) not null,
  room_id char(36) not null,
  time_slot_id char(36) not null,
  day_of_week int not null,
  session_type enum('theory','lab') not null,
  is_locked boolean not null default false,
  foreign key (section_id) references sections(id),
  foreign key (subject_id) references subjects(id),
  foreign key (faculty_id) references faculty(id),
  foreign key (room_id) references rooms(id),
  foreign key (time_slot_id) references time_slots(id)
);
