from backend.extensions import db, socketio
from backend.models.notification import Notification

def send_notification(user_id, title, message, notification_type='GENERAL'):
    """Save notification to DB and emit real-time SocketIO event if client connected."""
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type
    )
    db.session.add(notif)
    db.session.commit()

    # Emit socket message for real-time UI updates
    socketio.emit(f'notification_{user_id}', notif.to_dict())
    return notif
