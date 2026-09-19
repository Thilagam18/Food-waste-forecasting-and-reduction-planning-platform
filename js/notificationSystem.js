/**
 * MEDISYNC - SMART NOTIFICATION SYSTEM
 * Handles real-time threshold alerts, delay detection, browser push simulation,
 * and Web Audio synthesized alert chimes.
 */

class NotificationSystem {
  constructor() {
    this.previousWaitMinutes = null;
    this.previousPatientsAhead = null;
    this.sentThresholds = new Set();
    this.notifications = [];
    this.audioCtx = null;
  }

  // Synthesize Web Audio Chime
  playChime(isUrgent = false) {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = isUrgent ? 'sawtooth' : 'sine';
      const freq = isUrgent ? 880 : 523.25; // A5 vs C5
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      if (isUrgent) {
        osc.frequency.exponentialRampToValueAtTime(1760, this.audioCtx.currentTime + 0.3);
      } else {
        osc.frequency.exponentialRampToValueAtTime(659.25, this.audioCtx.currentTime + 0.2); // E5
      }

      gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.4);
    } catch (e) {
      console.log('Audio playback prevented or unsupported:', e);
    }
  }

  // Evaluate queue updates and dispatch alerts
  checkQueueUpdate(queueMetrics) {
    const { estimatedWaitMinutes, patientsAhead, currentToken, patientToken, statusReason } = queueMetrics;

    // 1. Detect Significant Delay Change (> 5 mins difference)
    if (this.previousWaitMinutes !== null && Math.abs(estimatedWaitMinutes - this.previousWaitMinutes) >= 5) {
      const isIncrease = estimatedWaitMinutes > this.previousWaitMinutes;
      const title = isIncrease ? '⚠️ Queue Delay Detected' : '⚡ Queue Speedup Detected';
      const msg = `Your waiting time changed from ${this.previousWaitMinutes} minutes to ${estimatedWaitMinutes} minutes. (${statusReason})`;
      this.dispatchNotification(title, msg, isIncrease ? 'urgent' : 'info', '⏱️');
    }

    // 2. Specific Patient Threshold Alerts
    if (patientsAhead === 15 && !this.sentThresholds.has(15)) {
      this.sentThresholds.add(15);
      this.dispatchNotification('15 Patients Remaining', 'You still have enough waiting time. Relax and stay tuned.', 'info', '☕');
    }

    if (patientsAhead === 10 && !this.sentThresholds.has(10)) {
      this.sentThresholds.add(10);
      this.dispatchNotification('10 Patients Remaining', 'Please begin travelling back towards the hospital.', 'warning', '🚶');
    }

    if (patientsAhead === 5 && !this.sentThresholds.has(5)) {
      this.sentThresholds.add(5);
      this.dispatchNotification('5 Patients Remaining', 'Please stay near the clinic waiting area.', 'warning', '📍');
    }

    if (patientsAhead === 3 && !this.sentThresholds.has(3)) {
      this.sentThresholds.add(3);
      this.dispatchNotification('🚨 3 Patients Remaining', 'Only 3 patients remain before your consultation! Please return to hospital now.', 'urgent', '🚨', true);
    }

    if (currentToken === patientToken && !this.sentThresholds.has(0)) {
      this.sentThresholds.add(0);
      this.dispatchNotification('🎉 Your Turn!', 'It is now your turn. Please proceed to Consultation Room 102.', 'urgent', '🎉', true);
    }

    // Update state cache
    this.previousWaitMinutes = estimatedWaitMinutes;
    this.previousPatientsAhead = patientsAhead;
  }

  dispatchNotification(title, message, level = 'info', icon = '🔔', playSound = false) {
    const notif = {
      id: Date.now(),
      title,
      message,
      level,
      icon,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    this.notifications.unshift(notif);
    if (playSound || level === 'urgent') {
      this.playChime(true);
    } else {
      this.playChime(false);
    }

    this.renderToast(notif);
  }

  renderToast(notif) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toastEl = document.createElement('div');
    toastEl.className = `toast ${notif.level === 'urgent' ? 'urgent' : ''}`;
    toastEl.innerHTML = `
      <div class="toast-icon">${notif.icon}</div>
      <div class="toast-content">
        <h4>${notif.title}</h4>
        <p>${notif.message}</p>
      </div>
    `;

    container.appendChild(toastEl);

    setTimeout(() => {
      toastEl.style.opacity = '0';
      toastEl.style.transform = 'translateY(10px)';
      setTimeout(() => toastEl.remove(), 300);
    }, 6000);
  }
}

window.notificationSystem = new NotificationSystem();
