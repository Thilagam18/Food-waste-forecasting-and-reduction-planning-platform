import os
from flask import Flask, jsonify
from backend.config import Config
from backend.extensions import db, jwt, cors, socketio
from backend.routes.auth import auth_bp
from backend.routes.patient import patient_bp
from backend.routes.doctor import doctor_bp
from backend.routes.hospital import hospital_bp
from backend.routes.queue import queue_bp
from backend.routes.prescription import prescription_bp
from backend.routes.pharmacy import pharmacy_bp
from backend.routes.medical_records import medical_records_bp
from backend.routes.ai import ai_bp
from backend.routes.notification import notification_bp

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})
    socketio.init_app(app, cors_allowed_origins="*")

    # Register Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(patient_bp)
    app.register_blueprint(doctor_bp)
    app.register_blueprint(hospital_bp)
    app.register_blueprint(queue_bp)
    app.register_blueprint(prescription_bp)
    app.register_blueprint(pharmacy_bp)
    app.register_blueprint(medical_records_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(notification_bp)

    @app.route('/')
    def index():
        return jsonify({
            'status': 'online',
            'service': 'MediSync Healthcare Coordination API Engine',
            'version': '1.0.0'
        })

    @app.route('/api/health')
    def health_check():
        try:
            # Test DB connection
            db.session.execute(db.select(1))
            db_status = "connected"
        except Exception as e:
            db_status = f"error: {str(e)}"

        return jsonify({
            'status': 'healthy',
            'service': 'MediSync Backend Foundation',
            'database': db_status,
            'version': '1.0.0'
        }), 200

    # Error handling
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'success': False, 'message': 'Resource not found'}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({'success': False, 'message': 'Internal server error occurred'}), 500

    with app.app_context():
        # Create database tables if not created
        db.create_all()

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('FLASK_PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port, debug=True)
