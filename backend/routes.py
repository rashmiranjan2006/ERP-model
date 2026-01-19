from flask import request, jsonify
from .extensions import db
from .app import app
from .erp_models import Section, Subject, TimeSlot, Room, Faculty, FacultySubject, TimetableEntry, User, UserRole, AppRole
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import datetime
import uuid
from collections import defaultdict

# Add Faculty endpoint
@app.route('/api/faculty', methods=['POST'])
def add_faculty():
    name = request.json.get('name')
    faculty_id = request.json.get('id')
    email = request.json.get('email')
    department = request.json.get('department')
    about = request.json.get('about')
    if not all([name, faculty_id, email, department]):
        return jsonify({'error': 'Missing required fields'}), 400
    faculty = Faculty(id=faculty_id, name=name, department=department)
    db.session.add(faculty)
    db.session.commit()
    # Optionally, store 'about' in a separate table or extend Faculty model
    return jsonify({'message': 'Faculty added successfully'})

# Add Student endpoint
@app.route('/api/students', methods=['POST'])
def add_student():
    name = request.json.get('name')
    roll = request.json.get('roll')
    email = request.json.get('email')
    department = request.json.get('department')
    section = request.json.get('section')
    if not all([name, roll, email, department, section]):
        return jsonify({'error': 'Missing required fields'}), 400
    user = User(
        id=roll,
        email=email,
        full_name=name,
        password_hash='',
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.session.add(user)
    db.session.commit()
    # Optionally, store department/section in a separate table or extend User model
    return jsonify({'message': 'Student added successfully'})
from flask import request, jsonify
from .extensions import db
from .app import app
from .erp_models import Section, Subject, TimeSlot, Room, Faculty, FacultySubject, TimetableEntry, User, UserRole, AppRole
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import datetime
import uuid
from collections import defaultdict

# Dashboard stats endpoints
@app.route('/api/stats', methods=['GET'])
def get_stats():
    student_count = UserRole.query.filter_by(role='student').count()
    faculty_count = Faculty.query.count()
    class_count = Section.query.count()
    # You can add more stats as needed
    return jsonify({
        'students': student_count,
        'faculty': faculty_count,
        'classes': class_count
    })
from flask import request, jsonify
from .extensions import db
from .app import app
from .erp_models import Section, Subject, TimeSlot, Room, Faculty, FacultySubject, TimetableEntry, User, UserRole, AppRole
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import datetime
import uuid
from collections import defaultdict

# Helper: Convert SQLAlchemy model to dict
def model_to_dict(obj):
    return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}

@app.route('/api/generate-timetable', methods=['POST'])
def generate_timetable():
    data = request.get_json()
    action = data.get('action', 'generate')
    section_id = data.get('sectionId')

    # Fetch all required data
    sections = Section.query.all()
    subjects = Subject.query.all()
    time_slots = TimeSlot.query.order_by(TimeSlot.slot_order).all()
    rooms = Room.query.all()
    faculty = Faculty.query.all()
    faculty_subjects = FacultySubject.query.all()
    locked_entries = TimetableEntry.query.filter_by(is_locked=True).all()

    # Build lookups
    room_by_name = {room.name: room for room in rooms}
    section_classroom = {section.id: section.classroom for section in sections}
    subject_by_id = {subject.id: subject for subject in subjects}
    faculty_by_id = {f.id: f for f in faculty}
    section_by_id = {s.id: s for s in sections}

    # Create schedulable entities
    entities = []
    for fs in faculty_subjects:
        subject = subject_by_id.get(fs.subject_id)
        faculty_member = faculty_by_id.get(fs.faculty_id)
        section = section_by_id.get(fs.section_id)
        if not subject or not faculty_member or not section:
            continue
        # Determine room
        if subject.type == 'lab' and subject.lab_room:
            lab_room = room_by_name.get(subject.lab_room)
            if lab_room:
                room_id = lab_room.id
            else:
                classroom = section_classroom.get(fs.section_id)
                classroom_room = next((r for r in rooms if r.name == classroom), None)
                room_id = classroom_room.id if classroom_room else rooms[0].id
        else:
            classroom = section_classroom.get(fs.section_id)
            classroom_room = next((r for r in rooms if r.name == classroom), None)
            room_id = classroom_room.id if classroom_room else rooms[0].id
        slots_required = 1 if subject.type == 'lab' else max(2, int(round(subject.credits / 1.5)))
        entities.append(SchedulableEntity(
            section_id=fs.section_id,
            subject_id=fs.subject_id,
            faculty_id=fs.faculty_id,
            room_id=room_id,
            session_type=subject.type,
            slots_required=slots_required,
            subject_code=subject.code,
            subject_name=subject.name,
            faculty_name=faculty_member.name
        ))

    # Generate schedule
    result = generate_schedule(entities, time_slots, rooms, locked_entries)
    assignments = result['assignments']

    # Optionally clear existing non-locked entries
    if action == 'regenerate':
        TimetableEntry.query.filter_by(is_locked=False).delete()
        db.session.commit()

    # Insert new entries
    new_entries = []
    for a in assignments:
        entry = TimetableEntry(
            id=str(uuid.uuid4()),
            section_id=a.entity.section_id,
            subject_id=a.entity.subject_id,
            faculty_id=a.entity.faculty_id,
            room_id=a.entity.room_id,
            time_slot_id=a.time_slot_id,
            day_of_week=a.day_of_week,
            session_type=a.entity.session_type,
            is_locked=False
        )
        db.session.add(entry)
        new_entries.append(model_to_dict(entry))
    db.session.commit()

    return jsonify({
        'success': True,
        'message': result['message'],
        'entriesCount': len(new_entries),
        'entries': new_entries
    })

# --- Scheduling Data Structures and Helpers ---

class SchedulableEntity:
    def __init__(self, section_id, subject_id, faculty_id, room_id, session_type, slots_required, subject_code, subject_name, faculty_name):
        self.section_id = section_id
        self.subject_id = subject_id
        self.faculty_id = faculty_id
        self.room_id = room_id
        self.session_type = session_type
        self.slots_required = slots_required
        self.subject_code = subject_code
        self.subject_name = subject_name
        self.faculty_name = faculty_name

class Assignment:
    def __init__(self, entity, day_of_week, time_slot_id, slot_order):
        self.entity = entity
        self.day_of_week = day_of_week
        self.time_slot_id = time_slot_id
        self.slot_order = slot_order

class ConflictState:
    def __init__(self):
        self.faculty_schedule = defaultdict(set)  # faculty_id -> set(day-slotOrder)
        self.section_schedule = defaultdict(set)  # section_id -> set(day-slotOrder)
        self.room_schedule = defaultdict(set)     # room_id -> set(day-slotOrder)

def init_conflict_state():
    return ConflictState()

def is_slot_available(state, faculty_id, section_id, room_id, day, slot_orders):
    for slot_order in slot_orders:
        key = f"{day}-{slot_order}"
        if key in state.faculty_schedule[faculty_id]:
            return False
        if key in state.section_schedule[section_id]:
            return False
        if key in state.room_schedule[room_id]:
            return False
    return True

def occupy_slot(state, faculty_id, section_id, room_id, day, slot_orders):
    for slot_order in slot_orders:
        key = f"{day}-{slot_order}"
        state.faculty_schedule[faculty_id].add(key)
        state.section_schedule[section_id].add(key)
        state.room_schedule[room_id].add(key)

def calculate_score(assignments):
    score = 0
    # Group by section and day
    section_day_assignments = defaultdict(list)
    for a in assignments:
        key = f"{a.entity.section_id}-{a.day_of_week}"
        section_day_assignments[key].append(a)
    # Soft constraint 1: Penalize extreme early/late slots
    for a in assignments:
        if a.slot_order == 1:
            score += 2
        if a.slot_order == 7:
            score += 1
    # Soft constraint 2: Penalize overloading sections
    for day_assignments in section_day_assignments.values():
        if len(day_assignments) > 5:
            score += (len(day_assignments) - 5) * 3
    # Soft constraint 3: Faculty idle gaps
    faculty_day_slots = defaultdict(list)
    for a in assignments:
        key = f"{a.entity.faculty_id}-{a.day_of_week}"
        faculty_day_slots[key].append(a.slot_order)
    for slots in faculty_day_slots.values():
        if len(slots) > 1:
            sorted_slots = sorted(slots)
            for i in range(1, len(sorted_slots)):
                gap = sorted_slots[i] - sorted_slots[i-1] - 1
                if gap > 0:
                    score += gap * 2
    return score

def generate_schedule(entities, time_slots, rooms, locked_entries):
    state = init_conflict_state()
    assignments = []
    days = [1, 2, 3, 4, 5]  # Monday to Friday
    sorted_slots = sorted(time_slots, key=lambda s: s.slot_order)
    room_by_name = {room.name: room for room in rooms}
    # Pre-occupy locked entries
    for entry in locked_entries:
        slot = next((s for s in sorted_slots if s.id == entry.time_slot_id), None)
        if slot:
            slots_needed = [slot.slot_order, slot.slot_order + 1] if entry.session_type == 'lab' else [slot.slot_order]
            occupy_slot(state, entry.faculty_id, entry.section_id, entry.room_id, entry.day_of_week, slots_needed)
    # Separate labs and theory
    lab_entities = [e for e in entities if e.session_type == 'lab']
    theory_entities = [e for e in entities if e.session_type == 'theory']
    import random
    def shuffle(arr):
        arr = list(arr)
        random.shuffle(arr)
        return arr
    shuffled_labs = shuffle(lab_entities)
    shuffled_theory = shuffle(theory_entities)
    # Schedule labs
    for entity in shuffled_labs:
        scheduled = False
        preferred_start_orders = [4, 3, 5, 2, 6]
        for day in shuffle(days):
            for start_order in preferred_start_orders:
                if start_order + 1 > len(sorted_slots):
                    continue
                start_slot = next((s for s in sorted_slots if s.slot_order == start_order), None)
                if not start_slot:
                    continue
                slots_needed = [start_order, start_order + 1]
                if is_slot_available(state, entity.faculty_id, entity.section_id, entity.room_id, day, slots_needed):
                    occupy_slot(state, entity.faculty_id, entity.section_id, entity.room_id, day, slots_needed)
                    assignments.append(Assignment(entity, day, start_slot.id, start_order))
                    scheduled = True
                    break
            if scheduled:
                break
    # Schedule theory
    for entity in shuffled_theory:
        sessions_needed = entity.slots_required
        sessions_scheduled = 0
        for day in shuffle(days):
            if sessions_scheduled >= sessions_needed:
                break
            preferred_orders = [3, 2, 4, 5, 1, 6, 7]
            for slot_order in preferred_orders:
                slot = next((s for s in sorted_slots if s.slot_order == slot_order), None)
                if not slot:
                    continue
                if is_slot_available(state, entity.faculty_id, entity.section_id, entity.room_id, day, [slot_order]):
                    occupy_slot(state, entity.faculty_id, entity.section_id, entity.room_id, day, [slot_order])
                    assignments.append(Assignment(entity, day, slot.id, slot_order))
                    sessions_scheduled += 1
                    break
    score = calculate_score(assignments)
    return {
        'assignments': assignments,
        'success': True,
        'message': f'Generated {len(assignments)} timetable entries with optimization score {score}'
    }
# --- End Scheduling Helpers ---

# Setup JWT
app.config['JWT_SECRET_KEY'] = 'your-secret-key'  # Change this in production
jwt = JWTManager(app)

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name')
    role = data.get('role', 'student')
    if not all([email, password, full_name]):
        return jsonify({'msg': 'Missing fields'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'msg': 'User already exists'}), 400
    user = User(
        id=str(uuid.uuid4()),
        email=email,
        full_name=full_name,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    user.set_password(password)
    db.session.add(user)
    # Assign role
    if not AppRole.query.filter_by(role=role).first():
        db.session.add(AppRole(role=role))
    db.session.commit()
    user_role = UserRole(
        id=str(uuid.uuid4()),
        user_id=user.id,
        role=role,
        created_at=datetime.utcnow()
    )
    db.session.add(user_role)
    db.session.commit()
    return jsonify({'msg': 'User registered successfully'})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'msg': 'Invalid credentials'}), 401
    access_token = create_access_token(identity=user.id)
    return jsonify({'access_token': access_token, 'user_id': user.id, 'full_name': user.full_name})

@app.route('/api/protected', methods=['GET'])
@jwt_required()
def protected():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    return jsonify({'msg': f'Hello, {user.full_name}! This is a protected route.'})
