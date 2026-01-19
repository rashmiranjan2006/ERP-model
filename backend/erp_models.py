from .extensions import db
from werkzeug.security import generate_password_hash, check_password_hash

class AppRole(db.Model):
    __tablename__ = 'app_role'
    role = db.Column(db.String(20), primary_key=True)

class UserRole(db.Model):
    __tablename__ = 'user_roles'
    id = db.Column(db.String(36), primary_key=True)
    user_id = db.Column(db.String(36), nullable=False)
    role = db.Column(db.String(20), db.ForeignKey('app_role.role'), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False)

class Profile(db.Model):
    __tablename__ = 'profiles'
    id = db.Column(db.String(36), primary_key=True)
    full_name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False)
    updated_at = db.Column(db.DateTime, nullable=False)

class Section(db.Model):
    __tablename__ = 'sections'
    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    department = db.Column(db.String(100), nullable=False)
    classroom = db.Column(db.String(100), nullable=False)

class Subject(db.Model):
    __tablename__ = 'subjects'
    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(20), nullable=False)
    type = db.Column(db.Enum('theory', 'lab'), nullable=False)
    lab_room = db.Column(db.String(100))
    credits = db.Column(db.Integer, nullable=False)

class TimeSlot(db.Model):
    __tablename__ = 'time_slots'
    id = db.Column(db.String(36), primary_key=True)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    slot_order = db.Column(db.Integer, nullable=False)

class Room(db.Model):
    __tablename__ = 'rooms'
    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.Enum('classroom', 'lab'), nullable=False)
    capacity = db.Column(db.Integer, nullable=False)

class Faculty(db.Model):
    __tablename__ = 'faculty'
    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    department = db.Column(db.String(100), nullable=False)

class FacultySubject(db.Model):
    __tablename__ = 'faculty_subjects'
    id = db.Column(db.String(36), primary_key=True)
    faculty_id = db.Column(db.String(36), db.ForeignKey('faculty.id'), nullable=False)
    subject_id = db.Column(db.String(36), db.ForeignKey('subjects.id'), nullable=False)
    section_id = db.Column(db.String(36), db.ForeignKey('sections.id'), nullable=False)

class TimetableEntry(db.Model):
    __tablename__ = 'timetable_entries'
    id = db.Column(db.String(36), primary_key=True)
    section_id = db.Column(db.String(36), db.ForeignKey('sections.id'), nullable=False)
    subject_id = db.Column(db.String(36), db.ForeignKey('subjects.id'), nullable=False)
    faculty_id = db.Column(db.String(36), db.ForeignKey('faculty.id'), nullable=False)
    room_id = db.Column(db.String(36), db.ForeignKey('rooms.id'), nullable=False)
    time_slot_id = db.Column(db.String(36), db.ForeignKey('time_slots.id'), nullable=False)
    day_of_week = db.Column(db.Integer, nullable=False)
    session_type = db.Column(db.Enum('theory', 'lab'), nullable=False)
    is_locked = db.Column(db.Boolean, nullable=False, default=False)

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.String(36), primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False)
    updated_at = db.Column(db.DateTime, nullable=False)
    roles = db.relationship('UserRole', backref='user', lazy=True)
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
