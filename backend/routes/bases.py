from flask import Blueprint, jsonify, request
from auth import require_auth
from models import SessionLocal, DroneBase

bp = Blueprint('bases', __name__)

@bp.route('/bases', methods=['GET'])
@require_auth()
def get_bases():
    """Get all bases"""
    session = SessionLocal()
    
    try:
        bases = session.query(DroneBase).all()
        return jsonify([{
            'id': str(b.id),
            'name': b.name,
            'lat': b.lat,
            'lng': b.lng
        } for b in bases])
    finally:
        session.close()

@bp.route('/bases', methods=['POST'])
@require_auth()
def create_base():
    """Create a new base"""
    data = request.json
    session = SessionLocal()
    
    try:
        base = DroneBase(
            name=data['name'],
            lat=data['lat'],
            lng=data['lng']
        )
        session.add(base)
        session.commit()
        
        return jsonify({
            'id': str(base.id),
            'name': base.name,
            'lat': base.lat,
            'lng': base.lng
        }), 201
    finally:
        session.close()

