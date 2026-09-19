from datetime import datetime
from backend.extensions import db, socketio
from backend.models.queue import Queue, QueueItem, QueueEvent, EmergencyCase
from backend.models.doctor import Doctor
from backend.services.notification_service import send_notification

def recalculate_queue_positions_and_eta(queue_id):
    """
    Recalculates position numbers and estimated waiting times for all WAITING and EMERGENCY
    queue items in a queue, then broadcasts the updated status via SocketIO.
    """
    queue = Queue.query.get(queue_id)
    if not queue:
        return

    doctor = Doctor.query.get(queue.doctor_id)
    avg_consult_time = doctor.avg_consultation_time_mins if doctor else 12

    # Active item (IN_PROGRESS)
    in_progress = QueueItem.query.filter_by(queue_id=queue_id, status='IN_PROGRESS').first()
    active_rem_mins = avg_consult_time
    if in_progress and in_progress.started_at:
        elapsed_mins = int((datetime.utcnow() - in_progress.started_at).total_seconds() / 60)
        active_rem_mins = max(0, avg_consult_time - elapsed_mins)

    # Fetch waiting items (ordered by emergency status first, then token_number or position)
    # Emergency items sit at top of waiting list
    emergency_items = QueueItem.query.filter_by(queue_id=queue_id, status='EMERGENCY').order_by(QueueItem.token_number).all()
    waiting_items = QueueItem.query.filter_by(queue_id=queue_id, status='WAITING').order_by(QueueItem.token_number).all()

    all_pending = emergency_items + waiting_items

    cumulative_wait = active_rem_mins
    for idx, item in enumerate(all_pending, start=1):
        old_eta = item.estimated_wait_mins
        item.position = idx
        item.estimated_wait_mins = cumulative_wait

        # If ETA changed significantly (e.g. > 2 mins), notify patient
        if abs(old_eta - cumulative_wait) >= 2 and old_eta > 0:
            send_notification(
                user_id=item.patient.user_id,
                title="Queue Schedule Update",
                message=f"Your token {item.token_code} ETA updated from {old_eta} mins to {cumulative_wait} mins. Position: {idx}.",
                notification_type="QUEUE_UPDATE"
            )

        # Each consultation adds avg_consult_time
        cumulative_wait += avg_consult_time

    db.session.commit()

    # Emit socket payload
    broadcast_queue_update(queue_id)

def broadcast_queue_update(queue_id):
    """Broadcast current queue state to socket subscribers."""
    queue = Queue.query.get(queue_id)
    if not queue:
        return

    waiting_items = QueueItem.query.filter(
        QueueItem.queue_id == queue_id,
        QueueItem.status.in_(['WAITING', 'EMERGENCY', 'IN_PROGRESS'])
    ).order_by(QueueItem.position).all()

    payload = {
        'queue': queue.to_dict(),
        'items': [item.to_dict() for item in waiting_items]
    }
    socketio.emit(f'queue_update_{queue_id}', payload)
    socketio.emit('global_queue_update', payload)

def add_emergency_case_to_queue(queue_id, patient_id, severity_desc, user_id):
    """
    Inserts an emergency patient into the queue with EMERGENCY status and position #1
    immediately after the current active patient. Recalculates all ETAs and notifies downstream patients.
    """
    queue = Queue.query.get(queue_id)
    if not queue:
        return None, "Queue not found"

    doctor = Doctor.query.get(queue.doctor_id)
    prefix = doctor.department.name[0].upper() if doctor and doctor.department else 'E'
    
    queue.total_tokens_today += 1
    token_num = queue.total_tokens_today
    token_code = f"EMG-{prefix}{token_num:02d}"

    # Create emergency queue item
    item = QueueItem(
        queue_id=queue_id,
        patient_id=patient_id,
        doctor_id=queue.doctor_id,
        token_number=token_num,
        token_code=token_code,
        status='EMERGENCY',
        position=1,
        estimated_wait_mins=5,
        is_emergency=True
    )
    db.session.add(item)

    # Record emergency case event
    emergency = EmergencyCase(
        queue_id=queue_id,
        patient_id=patient_id,
        token_code=token_code,
        severity_description=severity_desc,
        added_by_user_id=user_id
    )
    db.session.add(emergency)

    event = QueueEvent(
        queue_id=queue_id,
        token_code=token_code,
        event_type="EMERGENCY_INTERRUPTION",
        description=f"Emergency patient added to queue: {severity_desc}"
    )
    db.session.add(event)
    db.session.commit()

    # Recalculate positions and notify all waiting patients
    recalculate_queue_positions_and_eta(queue_id)

    # Notify all patients in queue about emergency delay
    waiting_patients = QueueItem.query.filter_by(queue_id=queue_id, status='WAITING').all()
    for p in waiting_patients:
        send_notification(
            user_id=p.patient.user_id,
            title="Emergency Consultation Inserted",
            message=f"Queue updated due to an incoming emergency case. Your estimated waiting time is now {p.estimated_wait_mins} mins.",
            notification_type="EMERGENCY_ALERT"
        )

    return item, None
