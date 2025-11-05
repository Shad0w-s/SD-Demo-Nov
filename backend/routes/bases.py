from flask import Blueprint, jsonify, request, abort
from auth import require_auth
from models import SessionLocal, DroneBase
from sqlalchemy.exc import IntegrityError
import uuid

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
            'lng': b.lng,
            'created_at': b.created_at.isoformat() if b.created_at else None
        } for b in bases])
    except Exception as e:
        session.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@bp.route('/bases/<base_id>', methods=['GET'])
@require_auth()
def get_base(base_id):
    """Get a single base by ID"""
    session = SessionLocal()
    
    try:
        try:
            base_uuid = uuid.UUID(base_id)
        except ValueError:
            abort(400, description="Invalid base ID format")
        
        base = session.query(DroneBase).filter(DroneBase.id == base_uuid).first()
        
        if not base:
            abort(404, description="Base not found")
        
        return jsonify({
            'id': str(base.id),
            'name': base.name,
            'lat': base.lat,
            'lng': base.lng,
            'created_at': base.created_at.isoformat() if base.created_at else None
        })
    except Exception as e:
        if hasattr(e, 'code'):
            raise
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@bp.route('/bases', methods=['POST'])
@require_auth()
def create_base():
    """Create a new base"""
    data = request.json
    session = SessionLocal()
    
    try:
        if not data or 'name' not in data:
            abort(400, description="Name is required")
        
        if 'lat' not in data or 'lng' not in data:
            abort(400, description="Latitude and longitude are required")
        
        try:
            lat = float(data['lat'])
            lng = float(data['lng'])
        except (ValueError, TypeError):
            abort(400, description="Invalid latitude or longitude format")
        
        # Validate coordinates
        if not (-90 <= lat <= 90):
            abort(400, description="Latitude must be between -90 and 90")
        if not (-180 <= lng <= 180):
            abort(400, description="Longitude must be between -180 and 180")
        
        base = DroneBase(
            name=data['name'],
            lat=lat,
            lng=lng
        )
        session.add(base)
        session.commit()
        
        return jsonify({
            'id': str(base.id),
            'name': base.name,
            'lat': base.lat,
            'lng': base.lng,
            'created_at': base.created_at.isoformat() if base.created_at else None
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

@bp.route('/bases/<base_id>', methods=['PUT'])
@require_auth()
def update_base(base_id):
    """Update a base"""
    data = request.json
    session = SessionLocal()
    
    try:
        try:
            base_uuid = uuid.UUID(base_id)
        except ValueError:
            abort(400, description="Invalid base ID format")
        
        base = session.query(DroneBase).filter(DroneBase.id == base_uuid).first()
        
        if not base:
            abort(404, description="Base not found")
        
        # Update fields
        if 'name' in data:
            base.name = data['name']
        
        if 'lat' in data or 'lng' in data:
            lat = float(data.get('lat', base.lat))
            lng = float(data.get('lng', base.lng))
            
            if not (-90 <= lat <= 90):
                abort(400, description="Latitude must be between -90 and 90")
            if not (-180 <= lng <= 180):
                abort(400, description="Longitude must be between -180 and 180")
            
            base.lat = lat
            base.lng = lng
        
        session.commit()
        
        return jsonify({
            'id': str(base.id),
            'name': base.name,
            'lat': base.lat,
            'lng': base.lng,
            'updated_at': base.updated_at.isoformat() if base.updated_at else None
        })
    except Exception as e:
        session.rollback()
        if hasattr(e, 'code'):
            raise
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

@bp.route('/bases/<base_id>', methods=['DELETE'])
@require_auth()
def delete_base(base_id):
    """Delete a base"""
    session = SessionLocal()
    
    try:
        try:
            base_uuid = uuid.UUID(base_id)
        except ValueError:
            abort(400, description="Invalid base ID format")
        
        base = session.query(DroneBase).filter(DroneBase.id == base_uuid).first()
        
        if not base:
            abort(404, description="Base not found")
        
        # Check if base has drones assigned
        from models import Drone
        drone_count = session.query(Drone).filter(Drone.base_id == base_uuid).count()
        if drone_count > 0:
            abort(400, description=f"Cannot delete base: {drone_count} drone(s) are assigned to it")
        
        session.delete(base)
        session.commit()
        
        return jsonify({'message': 'Base deleted successfully'}), 200
    except Exception as e:
        session.rollback()
        if hasattr(e, 'code'):
            raise
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

