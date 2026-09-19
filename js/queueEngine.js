/**
 * MEDISYNC - SMART QUEUE ENGINE
 * Handles real-time dynamic queue state, event recalculations, and subscriber updates.
 */

class QueueEngine {
  constructor() {
    // Initializing State
    this.patientToken = 45;
    this.currentToken = 25;
    this.avgConsultationTime = 9; // baseline 9 minutes per patient
    this.historicalVariance = 1.1; // 10% historical variance multiplier
    
    // Status State
    this.status = 'NORMAL'; // 'NORMAL', 'DELAYED', 'EMERGENCY_SURGERY', 'ON_BREAK', 'PAUSED'
    this.statusReason = 'Consultations operating normally on schedule.';
    this.lastUpdated = new Date();

    // Event & Delays (in minutes)
    this.emergencyDelays = 0;
    this.breakDelays = 0;
    this.consultationExtension = 0;
    this.emergencyCountAhead = 0;

    // Active Consultation Timer State
    this.currentConsultationElapsed = 3; // 3 mins into current patient
    this.isPaused = false;

    // Event Audit Timeline
    this.timelineEvents = [
      { time: '10:00 AM', icon: '🎫', text: 'Queue system initialized for Dr. Aris Thorne (Cardiology)', type: 'normal' },
      { time: '10:15 AM', icon: '🩺', text: 'Dr. Thorne started morning consultations', type: 'normal' },
      { time: '10:30 AM', icon: '📊', text: 'Average consultation pace established at 9 mins/patient', type: 'normal' }
    ];

    // Listeners for UI reactive updates
    this.listeners = [];
  }

  // Subscribe to state changes
  subscribe(callback) {
    this.listeners.push(callback);
  }

  notify() {
    this.lastUpdated = new Date();
    const data = this.getQueueMetrics();
    this.listeners.forEach(cb => cb(data));
  }

  // Main Calculation Engine
  getQueueMetrics() {
    let rawAhead = Math.max(0, this.patientToken - this.currentToken - 1);
    let totalAhead = rawAhead + this.emergencyCountAhead;

    // Remaining time for current patient being served
    let currentRemaining = Math.max(1, (this.avgConsultationTime + this.consultationExtension) - this.currentConsultationElapsed);
    
    // Total estimated wait time
    let totalEstimatedWait = 0;
    if (this.isPaused || this.status === 'EMERGENCY_SURGERY') {
      totalEstimatedWait = (totalAhead * this.avgConsultationTime * this.historicalVariance) + 
                           this.emergencyDelays + this.breakDelays + currentRemaining + 15;
    } else {
      totalEstimatedWait = (totalAhead * this.avgConsultationTime * this.historicalVariance) + 
                           this.emergencyDelays + this.breakDelays + currentRemaining;
    }

    totalEstimatedWait = Math.round(totalEstimatedWait);

    // Queue Progress Percentage
    const totalQueueLength = this.patientToken - 1;
    const progressPct = Math.min(100, Math.round((this.currentToken / totalQueueLength) * 100));

    return {
      patientToken: this.patientToken,
      currentToken: this.currentToken,
      patientsAhead: totalAhead,
      estimatedWaitMinutes: totalEstimatedWait,
      status: this.status,
      statusReason: this.statusReason,
      lastUpdated: this.formatTime(this.lastUpdated),
      avgConsultationTime: this.avgConsultationTime,
      emergencyDelays: this.emergencyDelays,
      progressPct: progressPct,
      isPaused: this.isPaused,
      timelineEvents: this.timelineEvents
    };
  }

  // Helper time formatter
  formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  addTimelineEvent(text, icon = '⚡', type = 'event') {
    this.timelineEvents.unshift({
      time: this.formatTime(new Date()),
      icon: icon,
      text: text,
      type: type
    });
    if (this.timelineEvents.length > 25) this.timelineEvents.pop();
  }

  // --- QUEUE EVENT SIMULATORS --- //

  // Event 1: Add Emergency Patient
  addEmergencyPatient() {
    this.emergencyCountAhead += 1;
    this.emergencyDelays += 18; // +18 min delay
    this.status = 'EMERGENCY_SURGERY';
    this.statusReason = 'Doctor is attending an emergency patient admitted in Trauma Bay 2.';
    this.addTimelineEvent('🚨 Emergency patient admitted into consultation queue (+18m delay)', '🚨', 'emergency');
    this.notify();
  }

  // Event 2: Doctor Surgery Callout
  doctorSurgery() {
    this.status = 'EMERGENCY_SURGERY';
    this.emergencyDelays += 35;
    this.isPaused = true;
    this.statusReason = 'Doctor called for urgent emergency surgery in OT-3.';
    this.addTimelineEvent('🏥 Doctor called for emergency surgery in OT-3 (+35m delay)', '🏥', 'emergency');
    this.notify();
  }

  // Event 3: Doctor Returned / Resumed
  doctorReturned() {
    this.status = 'NORMAL';
    this.isPaused = false;
    this.statusReason = 'Doctor resumed standard patient consultations.';
    this.addTimelineEvent('🟢 Doctor resumed consultations in Room 102', '🟢', 'completed');
    this.notify();
  }

  // Event 4: Doctor Break
  doctorBreak() {
    this.status = 'ON_BREAK';
    this.breakDelays += 15;
    this.statusReason = 'Doctor is taking a short scheduled rest break (15 mins).';
    this.addTimelineEvent('☕ Doctor taking scheduled 15-min rest break', '☕', 'delay');
    this.notify();
  }

  // Event 5: Consultation Extended / Delayed
  consultationDelay() {
    this.consultationExtension += 10;
    this.status = 'DELAYED';
    this.statusReason = 'Current consultation requiring detailed diagnostic review (+10 mins).';
    this.addTimelineEvent('⏱️ Consultation running longer than average (+10m extension)', '⏱️', 'delay');
    this.notify();
  }

  // Event 6: Critical Patient Added
  addCriticalPatient() {
    this.emergencyCountAhead += 1;
    this.emergencyDelays += 12;
    this.status = 'DELAYED';
    this.statusReason = 'New critical cardiology patient prioritized ahead of non-urgent queue.';
    this.addTimelineEvent('⚠️ Critical cardiology patient added to queue', '⚠️', 'delay');
    this.notify();
  }

  // Doctor Operations: Call Next Patient
  nextPatient() {
    if (this.currentToken < this.patientToken) {
      this.currentToken += 1;
      this.currentConsultationElapsed = 0;
      this.consultationExtension = 0;
      if (this.emergencyCountAhead > 0) this.emergencyCountAhead -= 1;
      
      if (this.currentToken === this.patientToken) {
        this.status = 'NORMAL';
        this.statusReason = '🎉 It is now your turn! Please enter Consultation Room 102.';
        this.addTimelineEvent(`🎉 Token #${this.patientToken} called to Consultation Room 102!`, '🎉', 'completed');
      } else {
        this.addTimelineEvent(`Token #${this.currentToken} called to Consultation Room`, '✅', 'completed');
      }
      this.notify();
    }
  }

  // Toggle Pause
  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.status = 'PAUSED';
      this.statusReason = 'Queue temporarily paused by clinic administrative desk.';
      this.addTimelineEvent('⏸️ Queue temporarily paused by clinic staff', '⏸️', 'delay');
    } else {
      this.status = 'NORMAL';
      this.statusReason = 'Queue resumed.';
      this.addTimelineEvent('▶️ Queue resumed standard processing', '▶️', 'normal');
    }
    this.notify();
  }

  // Reset Queue
  resetQueue() {
    this.patientToken = 45;
    this.currentToken = 25;
    this.emergencyDelays = 0;
    this.breakDelays = 0;
    this.consultationExtension = 0;
    this.emergencyCountAhead = 0;
    this.currentConsultationElapsed = 3;
    this.status = 'NORMAL';
    this.statusReason = 'Consultations operating normally on schedule.';
    this.isPaused = false;
    this.addTimelineEvent('🔄 Queue reset to default demo state', '🔄', 'normal');
    this.notify();
  }

  // Live Second Tick (simulates time passing)
  tick() {
    if (!this.isPaused) {
      this.currentConsultationElapsed += 0.05; // increment slightly
    }
    this.notify();
  }
}

window.queueEngine = new QueueEngine();
