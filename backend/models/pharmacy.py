from backend.extensions import db

class Pharmacy(db.Model):
    __tablename__ = 'pharmacies'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)
    hospital_id = db.Column(db.Integer, db.ForeignKey('hospitals.id', ondelete='SET NULL'), nullable=True)
    name = db.Column(db.String(150), nullable=False)
    address = db.Column(db.Text, nullable=False)
    phone = db.Column(db.String(20), nullable=False)

    medicines = db.relationship('Medicine', backref='pharmacy', cascade="all, delete-orphan")

    def to_dict(self):
        user_info = self.user.to_dict() if self.user else {}
        return {
            'id': self.id,
            'user_id': self.user_id,
            'hospital_id': self.hospital_id,
            'name': self.name,
            'address': self.address,
            'phone': self.phone,
            'email': user_info.get('email', '')
        }

class Medicine(db.Model):
    __tablename__ = 'medicines'

    id = db.Column(db.Integer, primary_key=True)
    pharmacy_id = db.Column(db.Integer, db.ForeignKey('pharmacies.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(100))
    description = db.Column(db.Text)
    stock_quantity = db.Column(db.Integer, default=100)
    unit_price = db.Column(db.Float, default=10.0)
    is_available = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            'id': self.id,
            'pharmacy_id': self.pharmacy_id,
            'name': self.name,
            'category': self.category,
            'description': self.description,
            'stock_quantity': self.stock_quantity,
            'unit_price': self.unit_price,
            'is_available': self.is_available
        }
