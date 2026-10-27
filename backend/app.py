import os
from flask import Flask, jsonify
from backend.config import Config
from backend.extensions import db, jwt, cors
from backend.routes.auth import auth_bp
from backend.routes.dashboard import dashboard_bp
from backend.routes.food_items import food_items_bp
from backend.routes.food_logs import food_logs_bp
from backend.routes.forecasting import forecasting_bp
from backend.routes.recommendations import recommendations_bp
from backend.routes.alerts import alerts_bp
from backend.routes.reports import reports_bp
from backend.routes.impact import impact_bp
from backend.routes.demo import demo_bp

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    # Register Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(food_items_bp)
    app.register_blueprint(food_logs_bp)
    app.register_blueprint(forecasting_bp)
    app.register_blueprint(recommendations_bp)
    app.register_blueprint(alerts_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(impact_bp)
    app.register_blueprint(demo_bp)

    @app.route('/')
    def index():
        return jsonify({
            'status': 'online',
            'service': 'Food Waste Forecasting & Reduction Planning Platform API',
            'version': '1.0.0'
        })

    @app.route('/api/health')
    def health_check():
        try:
            db.session.execute(db.select(1))
            db_status = 'connected'
        except Exception as e:
            db_status = f'error: {str(e)}'

        return jsonify({
            'status': 'healthy',
            'service': 'Food Waste Backend API',
            'database': db_status,
            'version': '1.0.0'
        }), 200

    # Error handling
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({'success': False, 'message': 'Bad request parameters.'}), 400

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'success': False, 'message': 'Resource not found.'}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({'success': False, 'message': 'Internal server error occurred.'}), 500

    with app.app_context():
        # Automatically creates tables if not present
        db.create_all()

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('FLASK_PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
