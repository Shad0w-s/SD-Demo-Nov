from flask import Blueprint, jsonify
from auth import require_auth

bp = Blueprint('admin', __name__)

@bp.route('/users', methods=['GET'])
@require_auth(roles=['admin'])
def get_users():
    """Get all users (admin only)"""
    # Will integrate with Supabase Admin API
    return jsonify({'users': []})

