from flask import Blueprint, jsonify, request, abort
from auth import require_auth
from models import SessionLocal, Schedule, Drone
from sqlalchemy.exc import IntegrityError
import uuid
from datetime import datetime

bp = Blueprint('schedules', __name__)

@bp.route('/schedules', methods=['GET'])
@require_auth()
def get_schedules():
    """Get all schedules (user sees own, admin sees all)"""
    user = request.user
    session = SessionLocal()
    
    try:
        user_id = user.get('sub')
        role = user.get('user_metadata', {}).get('role', 'user')
        
        if role == 'admin':
            schedules = session.query(Schedule).all()
        else:
            # Get schedules for user's drones
            schedules = session.query(Schedule).join(Drone).filter(
                Drone.user_id == uuid.UUID(user_id)
            ).all()
        
        return jsonify([{
            'id': str(s.id),
            'drone_id': str(s.drone_id),
            'start_time': s.start_time.isoformat() if s.start_time else None,
            'end_time': s.end_time.isoformat() if s.end_time else None,
            'path_json': s.path_json,
            'created_at': s.created_at.isoformat() if s.created_at else None
        } for s in schedules])
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@bp.route('/schedules/<schedule_id>', methods=['GET'])
@require_auth()
def get_schedule(schedule_id):
    """Get a single schedule by ID"""
    user = request.user
    session = SessionLocal()
    
    try:
        user_id = user.get('sub')
        role = user.get('user_metadata', {}).get('role', 'user')
        
        try:
            schedule_uuid = uuid.UUID(schedule_id)
        except ValueError:
            abort(400, description="Invalid schedule ID format")
        
        schedule = session.query(Schedule).filter(Schedule.id == schedule_uuid).first()
        
        if not schedule:
            abort(404, description="Schedule not found")
        
        # Check authorization
        drone = session.query(Drone).filter(Drone.id == schedule.drone_id).first()
        if role != 'admin' and str(drone.user_id) != user_id:
            abort(403, description="Access denied")
        
        return jsonify({
            'id': str(schedule.id),
            'drone_id': str(schedule.drone_id),
            'start_time': schedule.start_time.isoformat() if schedule.start_time else None,
            'end_time': schedule.end_time.isoformat() if schedule.end_time else None,
            'path_json': schedule.path_json,
            'created_at': schedule.created_at.isoformat() if schedule.created_at else None
        })
    except Exception as e:
        if hasattr(e, 'code'):
            raise
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@bp.route('/schedules', methods=['POST'])
@require_auth()
def create_schedule():
    """Create a new schedule"""
    data = request.json
    user = request.user
    session = SessionLocal()
    
    try:
        if not data or 'drone_id' not in data:
            abort(400, description="Drone ID is required")
        
        if 'start_time' not in data:
            abort(400, description="Start time is required")
        
        try:
            drone_uuid = uuid.UUID(data['drone_id'])
        except ValueError:
            abort(400, description="Invalid drone ID format")
        
        # Check authorization
        user_id = user.get('sub')
        role = user.get('user_metadata', {}).get('role', 'user')
        drone = session.query(Drone).filter(Drone.id == drone_uuid).first()
        
        if not drone:
            abort(404, description="Drone not found")
        
        if role != 'admin' and str(drone.user_id) != user_id:
            abort(403, description="Access denied")
        
        # Parse start_time
        try:
            start_time = datetime.fromisoformat(data['start_time'].replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            abort(400, description="Invalid start_time format. Use ISO 8601 format")
        
        # Parse end_time if provided
        end_time = None
        if data.get('end_time'):
            try:
                end_time = datetime.fromisoformat(data['end_time'].replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                abort(400, description="Invalid end_time format. Use ISO 8601 format")
        
        schedule = Schedule(
            drone_id=drone_uuid,
            start_time=start_time,
            end_time=end_time,
            path_json=data.get('path_json')
        )
        session.add(schedule)
        session.commit()
        
        return jsonify({
            'id': str(schedule.id),
            'drone_id': str(schedule.drone_id),
            'start_time': schedule.start_time.isoformat() if schedule.start_time else None,
            'end_time': schedule.end_time.isoformat() if schedule.end_time else None,
            'path_json': schedule.path_json,
            'created_at': schedule.created_at.isoformat() if schedule.created_at else None
        }), 201
    except IntegrityError as e:
        session.rollback()
        return jsonify({'error': 'Database integrity error'}), 400
    except Exception as e:
        session.rollback()
        if hasattr(e, 'code'):
            raise
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@bp.route('/schedules/<schedule_id>', methods=['PUT'])
@require_auth()
def update_schedule(schedule_id):
    """Update a schedule"""
    data = request.json
    user = request.user
    session = SessionLocal()
    
    try:
        user_id = user.get('sub')
        role = user.get('user_metadata', {}).get('role', 'user')
        
        try:
            schedule_uuid = uuid.UUID(schedule_id)
        except ValueError:
            abort(400, description="Invalid schedule ID format")
        
        schedule = session.query(Schedule).filter(Schedule.id == schedule_uuid).first()
        
        if not schedule:
            abort(404, description="Schedule not found")
        
        # Check authorization
        drone = session.query(Drone).filter(Drone.id == schedule.drone_id).first()
        if role != 'admin' and str(drone.user_id) != user_id:
            abort(403, description="Access denied")
        
        # Update fields
        if 'start_time' in data:
            try:
                schedule.start_time = datetime.fromisoformat(data['start_time'].replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                abort(400, description="Invalid start_time format")
        
        if 'end_time' in data:
            if data['end_time']:
                try:
                    schedule.end_time = datetime.fromisoformat(data['end_time'].replace('Z', '+00:00'))
                except (ValueError, AttributeError):
                    abort(400, description="Invalid end_time format")
            else:
                schedule.end_time = None
        
        if 'path_json' in data:
            schedule.path_json = data['path_json']
        
        session.commit()
        
        return jsonify({
            'id': str(schedule.id),
            'drone_id': str(schedule.drone_id),
            'start_time': schedule.start_time.isoformat() if schedule.start_time else None,
            'end_time': schedule.end_time.isoformat() if schedule.end_time else None,
            'path_json': schedule.path_json
        })
    except Exception as e:
        session.rollback()
        if hasattr(e, 'code'):
            raise
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@bp.route('/schedules/<schedule_id>', methods=['DELETE'])
@require_auth()
def delete_schedule(schedule_id):
    """Delete a schedule"""
    user = request.user
    session = SessionLocal()
    
    try:
        user_id = user.get('sub')
        role = user.get('user_metadata', {}).get('role', 'user')
        
        try:
            schedule_uuid = uuid.UUID(schedule_id)
        except ValueError:
            abort(400, description="Invalid schedule ID format")
        
        schedule = session.query(Schedule).filter(Schedule.id == schedule_uuid).first()
        
        if not schedule:
            abort(404, description="Schedule not found")
        
        # Check authorization
        drone = session.query(Drone).filter(Drone.id == schedule.drone_id).first()
        if role != 'admin' and str(drone.user_id) != user_id:
            abort(403, description="Access denied")
        
        session.delete(schedule)
        session.commit()
        
        return jsonify({'message': 'Schedule deleted successfully'}), 200
    except Exception as e:
        session.rollback()
        if hasattr(e, 'code'):
            raise
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

