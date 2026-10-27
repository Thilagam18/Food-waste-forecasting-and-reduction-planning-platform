import os
import sys
from datetime import date, timedelta
from dotenv import load_dotenv

# Add parent path to allow module imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

load_dotenv()

from backend.app import create_app
from backend.extensions import db
from backend.models.organization import Organization
from backend.models.user import User
from backend.services.demo_data import load_demo_dataset

def seed_database():
    app = create_app()
    with app.app_context():
        print(f"[*] Ensuring database tables exist on: {app.config['SQLALCHEMY_DATABASE_URI']}")
        db.create_all()

        # Check if any organization exists
        org = Organization.query.first()
        if not org:
            print("[*] Creating initial enterprise organization: 'Emerald Valley Bistro & Hotel'...")
            org = Organization(
                name="Emerald Valley Bistro & Hotel",
                org_type="Hotel",
                location="742 Evergreen Parkway, Suite 100",
                contact_phone="+1 (555) 389-2044",
                contact_email="operations@emeraldvalley.com"
            )
            db.session.add(org)
            db.session.flush()

            user = User(
                organization_id=org.id,
                full_name="Operations Director",
                email="director@emeraldvalley.com",
                role="Admin"
            )
            user.set_password("Director2026!")
            db.session.add(user)
            db.session.commit()

            print(f"[+] Organization created with ID {org.id}. Admin: director@emeraldvalley.com / Director2026!")
            print("[*] Generating demonstration historical records, forecasts, and recommendations...")
            res = load_demo_dataset(org.id)
            print(f"[+] {res['message']}")
        else:
            print(f"[i] Organization already present (ID: {org.id}, Name: '{org.name}'). Database ready.")

        print("[OK] Database setup & verification completed successfully.")

if __name__ == '__main__':
    seed_database()
