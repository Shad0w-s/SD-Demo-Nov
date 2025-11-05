from flask import Blueprint, jsonify, request, abort
from auth import require_auth
from models import SessionLocal, Drone, DroneBase
from sqlalchemy.exc import IntegrityError
import uuid

bp = Blueprint('drones', __name__)

@bp.route('/drones', methods=['GET'])
@require_auth()
def get_drones():
    """Get all drones (user sees own, admin sees all)"""
    user = request.user
    session = SessionLocal()
    
    try:
        user_id = user.get('sub')
        role = user.get('user_metadata', {}).get('role', 'user')
        
        if role == 'admin':
            drones = session.query(Drone).all()
        else:
            drones = session.query(Drone).filter(Drone.user_id == user_id).all()
        
        return jsonify([{
            'id': str(d.id),
            'name': d.name,
            'model': d.model,
            'status': d.status,
            'base_id': str(d.base_id) if d.base_id else None,
            'user_id': str(d.user_id),
            'last_check_in': d.last_check_in.isoformat() if d.last_check_in else None,
            'created_at': d.created_at.isoformat() if d.created_at else None
        } for d in drones])
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@bp.route('/drones/<drone_id>', methods=['GET'])
@require_auth()
def get_drone(drone_id):
    """Get a single drone by ID"""
    user = request.user
    session = SessionLocal()
    
    try:
        user_id = user.get('sub')
        role = user.get('user_metadata', {}).get('role', 'user')
        
        try:
            drone_uuid = uuid.UUID(drone_id)
        except ValueError:
            abort(400, description="Invalid drone ID format")
        
        drone = session.query(Drone).filter(Drone.id == drone_uuid).first()
        
        if not drone:
            abort(404, description="Drone not found")
        
        # Check authorization
        if role != 'admin' and str(drone.user_id) != user_id:
            abort(403, description="Access denied")
        
        return jsonify({
            'id': str(drone.id),
            'name': drone.name,
            'model': drone.model,
            'status': drone.status,
            'base_id': str(drone.base_id) if drone.base_id else None,
            'user_id': str(drone.user_id),
            'last_check_in': drone.last_check_in.isoformat() if drone.last_check_in else None,
            'created_at': drone.created_at.isoformat() if drone.created_at else None
        })
    except Exception as e:
        session.rollback()
        if hasattr(e, 'code'):
            raise
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@bp.route('/drones', methods=['POST'])
@require_auth()
def create_drone():
    """Create a new drone"""
    data = request.json
    user = request.user
    session = SessionLocal()
    
    try:
        if not data or 'name' not in data:
            abort(400, description="Name is required")
        
        # Validate base_id if provided
        base_id = None
        if data.get('base_id'):
            try:
                base_uuid = uuid.UUID(data['base_id'])
                base = session.query(DroneBase).filter(DroneBase.id == base_uuid).first()
                if not base:
                    abort(404, description="Base not found")
                base_id = base_uuid
            except ValueError:
                abort(400, description="Invalid base ID format")
        
        drone = Drone(
            name=data['name'],
            model=data.get('model'),
            user_id=uuid.UUID(user.get('sub')),
            base_id=base_id,
            status=data.get('status', 'simulated')
        )
        session.add(drone)
        session.commit()
        
        return jsonify({
            'id': str(drone.id),
            'name': drone.name,
            'model': drone.model,
            'status': drone.status,
            'base_id': str(drone.base_id) if drone.base_id else None,
            'user_id': str(drone.user_id),
            'created_at': drone.created_at.isoformat() if drone.created_at else None
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

@bp.route('/drones/<drone_id>', methods=['PUT'])
@require_auth()
def update_drone(drone_id):
    """Update a drone"""
    data = request.json
    user = request.user
    session = SessionLocal()
    
    try:
        user_id = user.get('sub')
        role = user.get('user_metadata', {}).get('role', 'user')
        
        try:
            drone_uuid = uuid.UUID(drone_id)
        except ValueError:
            abort(400, description="Invalid drone ID format")
        
        drone = session.query(Drone).filter(Drone.id == drone_uuid).first()
        
        if not drone:
            abort(404, description="Drone not found")
        
        # Check authorization
        if role != 'admin' and str(drone.user_id) != user_id:
            abort(403, description="Access denied")
        
        # Update fields
        if 'name' in data:
            drone.name = data['name']
        if 'model' in data:
            drone.model = data['model']
        if 'status' in data:
            drone.status = data['status']
        if 'base_id' in data:
            if data['base_id']:
                try:
                    base_uuid = uuid.UUID(data['base_id'])
                    base = session.query(DroneBase).filter(DroneBase.id == base_uuid).first()
                    if not base:
                        abort(404, description="Base not found")
                    drone.base_id = base_uuid
                except ValueError:
                    abort(400, description="Invalid base ID format")
            else:
                drone.base_id = None
        
        session.commit()
        
        return jsonify({
            'id': str(drone.id),
            'name': drone.name,
            'model': drone.model,
            'status': drone.status,
            'base_id': str(drone.base_id) if drone.base_id else None,
            'user_id': str(drone.user_id),
            'updated_at': drone.updated_at.isoformat() if drone.updated_at else None
        })
    except Exception as e:
        session.rollback()
        if hasattr(e, 'code'):
            raise
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@bp.route('/drones/<drone_id>', methods=['DELETE'])
@require_auth()
def delete_drone(drone_id):
    """Delete a drone"""
    user = request.user
    session = SessionLocal()
    
    try:
        user_id = user.get('sub')
        role = user.get('user_metadata', {}).get('role', 'user')
        
        try:
            drone_uuid = uuid.UUID(drone_id)
        except ValueError:
            abort(400, description="Invalid drone ID format")
        
        drone = session.query(Drone).filter(Drone.id == drone_uuid).first()
        
        if not drone:
            abort(404, description="Drone not found")
        
        # Check authorization
        if role != 'admin' and str(drone.user_id) != user_id:
            abort(403, description="Access denied")
        
        session.delete(drone)
        session.commit()
        
        return jsonify({'message': 'Drone deleted successfully'}), 200
    except Exception as e:
        session.rollback()
        if hasattr(e, 'code'):
            raise
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@bp.route('/drones/<drone_id>/simulate_path', methods=['POST'])
@require_auth()
def simulate_path(drone_id):
    """Return mock drone path for simulation"""
    user = request.user
    session = SessionLocal()
    
    try:
        try:
            drone_uuid = uuid.UUID(drone_id)
        except ValueError:
            abort(400, description="Invalid drone ID format")
        
        drone = session.query(Drone).filter(Drone.id == drone_uuid).first()
        
        if not drone:
            abort(404, description="Drone not found")
        
        # Check authorization
        user_id = user.get('sub')
        role = user.get('user_metadata', {}).get('role', 'user')
        if role != 'admin' and str(drone.user_id) != user_id:
            abort(403, description="Access denied")
        
        path_data = request.json.get('path', []) if request.json else []
        
        # Generate mock telemetry data
        import random
        import math
        
        # If no path provided, generate a default path
        if not path_data:
            # Default path: small square around San Francisco
            base_lng, base_lat = -122.4, 37.79
            path_data = [
                [base_lng, base_lat],
                [base_lng + 0.01, base_lat],
                [base_lng + 0.01, base_lat + 0.01],
                [base_lng, base_lat + 0.01],
                [base_lng, base_lat]
            ]
        
        # Calculate distance and ETA
        total_distance = 0
        for i in range(len(path_data) - 1):
            lat1, lng1 = path_data[i][1], path_data[i][0]
            lat2, lng2 = path_data[i+1][1], path_data[i+1][0]
            # Haversine distance approximation
            distance = math.sqrt((lat2-lat1)**2 + (lng2-lng1)**2) * 111000  # meters
            total_distance += distance
        
        speed_mps = random.uniform(10, 15)  # 10-15 m/s
        eta_seconds = int(total_distance / speed_mps) if speed_mps > 0 else 0
        
        # Generate mock telemetry
        telemetry = {
            'battery_level': random.randint(60, 100),
            'altitude_m': random.uniform(50, 150),
            'heading_deg': random.uniform(0, 360),
            'signal_strength': random.randint(70, 100)
        }
        
        return jsonify({
            'path': {
                'coordinates': path_data
            },
            'speed_mps': round(speed_mps, 2),
            'eta_seconds': eta_seconds,
            'distance_m': round(total_distance, 2),
            'telemetry': telemetry
        })
    except Exception as e:
        if hasattr(e, 'code'):
            raise
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@bp.route('/drones/<drone_id>/action', methods=['POST'])
@require_auth()
def drone_action(drone_id):
    """Trigger simulated drone action"""
    user = request.user
    session = SessionLocal()
    
    try:
        try:
            drone_uuid = uuid.UUID(drone_id)
        except ValueError:
            abort(400, description="Invalid drone ID format")
        
        drone = session.query(Drone).filter(Drone.id == drone_uuid).first()
        
        if not drone:
            abort(404, description="Drone not found")
        
        # Check authorization
        user_id = user.get('sub')
        role = user.get('user_metadata', {}).get('role', 'user')
        if role != 'admin' and str(drone.user_id) != user_id:
            abort(403, description="Access denied")
        
        if not request.json or 'action' not in request.json:
            abort(400, description="Action is required")
        
        action = request.json.get('action')
        valid_actions = ['return_to_base', 'intercept', 'end_early', 'pause', 'resume']
        
        if action not in valid_actions:
            abort(400, description=f"Invalid action. Valid actions: {', '.join(valid_actions)}")
        
        # Update drone status based on action
        if action == 'return_to_base':
            drone.status = 'returning'
        elif action == 'intercept':
            drone.status = 'intercepting'
        elif action == 'end_early':
            drone.status = 'completed'
        elif action == 'pause':
            drone.status = 'paused'
        elif action == 'resume':
            drone.status = 'active'
        
        from datetime import datetime
        drone.last_check_in = datetime.utcnow()
        session.commit()
        
        return jsonify({
            'status': 'success',
            'action': action,
            'drone_id': drone_id,
            'drone_status': drone.status,
            'message': f'Action {action} executed for drone {drone_id}'
        })
    except Exception as e:
        session.rollback()
        if hasattr(e, 'code'):
            raise
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

