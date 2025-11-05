from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

# Import routes
import sys
import os
sys.path.append(os.path.dirname(__file__))
from routes import drones, bases, admin

# Register blueprints
app.register_blueprint(drones.bp, url_prefix='/api')
app.register_blueprint(bases.bp, url_prefix='/api')
app.register_blueprint(admin.bp, url_prefix='/api')

@app.route('/')
def health():
    return {'status': 'ok', 'message': 'Drone Management System API'}

if __name__ == '__main__':
    app.run(debug=True, port=5000)

