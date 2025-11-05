from flask import Blueprint, jsonify, request
from auth import require_auth
from models import SessionLocal, Drone

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
            'base_id': str(d.base_id) if d.base_id else None
        } for d in drones])
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
        drone = Drone(
            name=data['name'],
            model=data.get('model'),
            user_id=user.get('sub'),
            base_id=data.get('base_id'),
            status=data.get('status', 'simulated')
        )
        session.add(drone)
        session.commit()
        
        return jsonify({
            'id': str(drone.id),
            'name': drone.name,
            'model': drone.model,
            'status': drone.status
        }), 201
    finally:
        session.close()

@bp.route('/drones/<drone_id>/simulate_path', methods=['POST'])
@require_auth()
def simulate_path(drone_id):
    """Return mock drone path for simulation"""
    path_data = request.json.get('path', [])
    
    # Mock simulation response
    return jsonify({
        'path': {
            'coordinates': path_data if path_data else [
                [-122.401, 37.793],
                [-122.397, 37.790],
                [-122.392, 37.789]
            ]
        },
        'speed_mps': 12,
        'eta_seconds': 420
    })

@bp.route('/drones/<drone_id>/action', methods=['POST'])
@require_auth()
def drone_action(drone_id):
    """Trigger simulated drone action"""
    action = request.json.get('action')
    
    return jsonify({
        'status': 'success',
        'action': action,
        'message': f'Action {action} executed for drone {drone_id}'
    })

