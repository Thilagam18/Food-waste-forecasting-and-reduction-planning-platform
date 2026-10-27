import os
import sys
from datetime import date, timedelta
from dotenv import load_dotenv

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

load_dotenv()

from backend.app import create_app
from backend.extensions import db
from backend.models.organization import Organization
from backend.models.user import User
from backend.services.demo_data import load_demo_dataset

ORGANIZATION_PRESETS = [
    {
        'name': 'Apex Culinary Campus',
        'facility': 'Main Dining Hall & Central Canteen (Dining Hall)',
        'org_type': 'College Canteen',
        'sector': 'College & Education',
        'email': 'admin@apexculinary.edu',
        'full_name': 'System Administrator',
        'password': 'admin',
        'location': 'Campus North Wing',
        'phone': '+91 98450 12345'
    },
    {
        'name': 'Grand Palace Hotel',
        'facility': 'Buffet & Banquet Hall (Hospitality)',
        'org_type': 'Hotel',
        'sector': 'Hotel & Hospitality',
        'email': 'hotel@grandpalace.com',
        'full_name': 'Executive Chef & F&B Director',
        'password': 'admin',
        'location': 'Harbor View Tower',
        'phone': '+91 98450 67890'
    },
    {
        'name': 'Metro Haven Bistro',
        'facility': 'Bistro & Cafe Kitchen (Commercial)',
        'org_type': 'Restaurant',
        'sector': 'Restaurant & Cafe',
        'email': 'bistro@metrohaven.com',
        'full_name': 'Kitchen Manager',
        'password': 'admin',
        'location': 'Downtown Plaza',
        'phone': '+91 98450 11223'
    }
]

def seed_database():
    app = create_app()
    with app.app_context():
        print(f"[*] Ensuring database tables exist on: {app.config['SQLALCHEMY_DATABASE_URI']}")
        db.create_all()

        for preset in ORGANIZATION_PRESETS:
            org = Organization.query.filter_by(name=preset['name']).first()
            if not org:
                print(f"[*] Creating organization: '{preset['name']}' ({preset['sector']})...")
                org = Organization(
                    name=preset['name'],
                    org_type=preset['org_type'],
                    location=preset['location'],
                    contact_phone=preset['phone'],
                    contact_email=preset['email']
                )
                db.session.add(org)
                db.session.flush()

                user = User(
                    organization_id=org.id,
                    full_name=preset['full_name'],
                    email=preset['email'],
                    role='Admin'
                )
                user.set_password(preset['password'])
                db.session.add(user)
                db.session.commit()

                print(f"[+] Organization created with ID {org.id}. Loading demonstration logs & forecasts...")
                load_demo_dataset(org.id)
            else:
                print(f"[i] Organization '{org.name}' already present (ID: {org.id}).")

        print("[OK] All demonstration preset organizations verified and ready.")

if __name__ == '__main__':
    seed_database()
