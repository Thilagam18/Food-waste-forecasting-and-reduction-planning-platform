import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'fw-fallback-dev-secret-key-2026')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'fw-fallback-jwt-secret-key-2026')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES_HOURS', 24)))

    # Database resolution
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        mysql_user = os.getenv('MYSQL_USER')
        mysql_pass = os.getenv('MYSQL_PASSWORD', '')
        mysql_host = os.getenv('MYSQL_HOST', 'localhost')
        mysql_port = os.getenv('MYSQL_PORT', '3306')
        mysql_db = os.getenv('MYSQL_DB', 'food_waste_db')
        if mysql_user and mysql_db:
            db_url = f"mysql+pymysql://{mysql_user}:{mysql_pass}@{mysql_host}:{mysql_port}/{mysql_db}"
        else:
            db_url = 'sqlite:///food_waste.db'

    SQLALCHEMY_DATABASE_URI = db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_recycle': 280,
        'pool_pre_ping': True,
    } if 'mysql' in db_url.lower() else {}
