from flask import Blueprint, jsonify, request, abort
from auth import require_auth
from models import SessionLocal, Drone, DroneBase, Schedule
import os
import requests

bp = Blueprint('admin', __name__)

SUPABASE_URL = os.getenv('SUPABASE_PROJECT_URL', 'https://qtbnulraotlnlgxbtfoy.supabase.co')
SUPABASE_SERVICE_ROLE = os.getenv('SUPABASE_SERVICE_ROLE', '')

@bp.route('/users', methods=['GET'])
@require_auth(roles=['admin'])
def get_users():
    """Get all users (admin only)"""
    try:
        if not SUPABASE_SERVICE_ROLE:
            return jsonify({'error': 'Supabase service role not configured'}), 500
        
        # Fetch users from Supabase Admin API
        headers = {
            'apikey': SUPABASE_SERVICE_ROLE,
            'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE}'
        }
        
        response = requests.get(
            f'{SUPABASE_URL}/auth/v1/admin/users',
            headers=headers,
            timeout=10
        )
        
        if response.status_code != 200:
            return jsonify({'error': 'Failed to fetch users from Supabase'}), 500
        
        users_data = response.json()
        
        # Format user data
        users = []
        for user in users_data.get('users', []):
            users.append({
                'id': user.get('id'),
                'email': user.get('email'),
                'role': user.get('user_metadata', {}).get('role', 'user'),
                'created_at': user.get('created_at'),
                'last_sign_in_at': user.get('last_sign_in_at')
            })
        
        return jsonify({'users': users})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/users/<user_id>/role', methods=['PUT'])
@require_auth(roles=['admin'])
def update_user_role(user_id):
    """Update user role (admin only)"""
    try:
        if not SUPABASE_SERVICE_ROLE:
            return jsonify({'error': 'Supabase service role not configured'}), 500
        
        data = request.json
        if not data or 'role' not in data:
            abort(400, description="Role is required")
        
        role = data['role']
        if role not in ['admin', 'user']:
            abort(400, description="Invalid role. Must be 'admin' or 'user'")
        
        # Update user metadata in Supabase
        headers = {
            'apikey': SUPABASE_SERVICE_ROLE,
            'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'user_metadata': {'role': role}
        }
        
        response = requests.put(
            f'{SUPABASE_URL}/auth/v1/admin/users/{user_id}',
            headers=headers,
            json=payload,
            timeout=10
        )
        
        if response.status_code != 200:
            return jsonify({'error': 'Failed to update user role'}), 500
        
        return jsonify({
            'message': 'User role updated successfully',
            'user_id': user_id,
            'role': role
        })
    except Exception as e:
        if hasattr(e, 'code'):
            raise
        return jsonify({'error': str(e)}), 500

@bp.route('/stats', methods=['GET'])
@require_auth(roles=['admin'])
def get_stats():
    """Get system statistics (admin only)"""
    session = SessionLocal()
    
    try:
        stats = {
            'total_drones': session.query(Drone).count(),
            'total_bases': session.query(DroneBase).count(),
            'total_schedules': session.query(Schedule).count(),
            'drones_by_status': {},
            'drones_by_user': {}
        }
        
        # Count drones by status
        from sqlalchemy import func
        status_counts = session.query(
            Drone.status,
            func.count(Drone.id)
        ).group_by(Drone.status).all()
        
        stats['drones_by_status'] = {status: count for status, count in status_counts}
        
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        session.close()

