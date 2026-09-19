/**
 * MEDISYNC - MAIN APPLICATION CONTROLLER
 * Links UI views with state engines, event handlers, location updates, and reactive rendering.
 */

class AppController {
  constructor() {
    this.currentView = 'patient';
  }

  init() {
    console.log('⚡ Initializing MediSync Smart Platform...');

    // Subscribe to QueueEngine state updates
    window.queueEngine.subscribe((queueData) => this.onQueueUpdate(queueData));

    // Subscribe to LocationService updates
    window.locationService.subscribe((locData) => this.onLocationUpdate(locData));

    // Start Clock Ticker
    this.startClock();

    // Start Live Simulation Tick (updates progress every 3 seconds)
    setInterval(() => {
      window.queueEngine.tick();
    }, 3000);

    // Initial Trigger
    window.queueEngine.notify();
    window.locationService.notify();
  }

  // Live Clock Bar
  startClock() {
    const clockEl = document.getElementById('live-clock');
    const updateTime = () => {
      const now = new Date();
      if (clockEl) clockEl.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };
    updateTime();
    setInterval(updateTime, 1000);
  }

  // View Switcher (Tab Navigation)
  switchView(viewName) {
    this.currentView = viewName;

    // Update active tab buttons
    document.querySelectorAll('.role-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    const clickedBtn = Array.from(document.querySelectorAll('.role-btn')).find(btn => btn.getAttribute('onclick').includes(viewName));
    if (clickedBtn) clickedBtn.classList.add('active');

    // Update view sections
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });
    const activeSec = document.getElementById(`view-${viewName}`);
    if (activeSec) activeSec.classList.add('active');
  }

  // Called when Location Controls change
  onLocationChange() {
    const dist = document.getElementById('select-distance').value;
    const mode = document.getElementById('select-mode').value;
    const traffic = document.getElementById('select-traffic').value;

    window.locationService.setDistance(dist);
    window.locationService.setTravelMode(mode);
    window.locationService.setTraffic(traffic);
  }

  // Reactive Queue State Listener
  onQueueUpdate(queueData) {
    const locData = window.locationService.getLocationMetrics();
    
    // 1. Update Patient Hero Card Metrics
    document.getElementById('val-patient-token').innerText = queueData.patientToken;
    document.getElementById('val-current-token').innerText = queueData.currentToken;
    document.getElementById('val-patients-ahead').innerText = queueData.patientsAhead;
    document.getElementById('val-est-wait').innerText = queueData.estimatedWaitMinutes;
    document.getElementById('val-progress-pct').innerText = `${queueData.progressPct}%`;
    document.getElementById('progress-fill-bar').style.width = `${queueData.progressPct}%`;

    // 2. Status Banner Update
    const banner = document.getElementById('status-banner');
    const icon = document.getElementById('status-icon');
    const title = document.getElementById('status-title');
    const reason = document.getElementById('status-reason');
    const updated = document.getElementById('status-updated');

    banner.className = 'status-banner';
    if (queueData.status === 'EMERGENCY_SURGERY') {
      banner.classList.add('emergency');
      icon.innerText = '🔴';
      title.innerText = 'Queue Status: Emergency Delay';
    } else if (queueData.status === 'DELAYED') {
      banner.classList.add('delayed');
      icon.innerText = '🟠';
      title.innerText = 'Queue Status: Delayed';
    } else if (queueData.status === 'PAUSED') {
      banner.classList.add('paused');
      icon.innerText = '⏸️';
      title.innerText = 'Queue Status: Temporarily Paused';
    } else {
      icon.innerText = '🟢';
      title.innerText = 'Queue Status: Normal Pace';
    }
    reason.innerText = queueData.statusReason;
    updated.innerText = `Updated: ${queueData.lastUpdated}`;

    // 3. Flagship Smart Return Assistant AI Evaluation
    const aiResult = window.smartReturnAssistant.generateRecommendation(queueData, locData);
    this.renderReturnAssistant(aiResult);

    // 4. Trigger Smart Notification Check
    window.notificationSystem.checkQueueUpdate(queueData);

    // 5. Render Timeline Feed
    this.renderTimeline(queueData.timelineEvents);

    // 6. Doctor Panel Sync
    document.getElementById('doc-val-current').innerText = `#${queueData.currentToken}`;
    document.getElementById('doc-status-note').innerText = queueData.statusReason;

    // 7. Admin Panel Sync
    document.getElementById('admin-val-emergency').innerText = `+${queueData.emergencyDelays} m`;

    // 8. TV Display Sync
    document.getElementById('tv-val-current').innerText = queueData.currentToken;
    document.getElementById('tv-val-next').innerText = `${queueData.currentToken + 1} • ${queueData.currentToken + 2} • ${queueData.currentToken + 3}`;
    document.getElementById('tv-status-text').innerText = `Status: ${queueData.statusReason}`;
  }

  // Reactive Location Update Listener
  onLocationUpdate(locData) {
    document.getElementById('loc-val-dist').innerText = `${locData.distanceKm} km (${locData.distanceMeters}m)`;
    document.getElementById('loc-val-time').innerText = `${locData.travelTimeMinutes} mins`;
    document.getElementById('loc-val-traffic').innerText = locData.trafficCondition.toUpperCase();

    const warnBanner = document.getElementById('loc-warning-banner');
    if (locData.trafficWarning) {
      warnBanner.style.display = 'block';
      warnBanner.innerText = locData.trafficWarning;
    } else {
      warnBanner.style.display = 'none';
    }

    // Re-trigger return assistant update with new location matrix
    const queueData = window.queueEngine.getQueueMetrics();
    const aiResult = window.smartReturnAssistant.generateRecommendation(queueData, locData);
    this.renderReturnAssistant(aiResult);
  }

  // Render Smart Return Assistant Card
  renderReturnAssistant(ai) {
    document.getElementById('ai-rec-time').innerText = ai.returnTimeFormatted;
    document.getElementById('ai-confidence').innerText = `${ai.confidence}%`;

    const adviceBox = document.getElementById('ai-advice-box');
    const adviceTitle = document.getElementById('ai-advice-title');
    const adviceDesc = document.getElementById('ai-advice-desc');

    adviceBox.className = 'ai-advice-box';
    if (ai.adviceType === 'URGENT_RETURN' || ai.adviceType === 'YOUR_TURN') {
      adviceBox.classList.add('urgent');
    } else if (ai.adviceType === 'TRAVEL_BACK' || ai.adviceType === 'NEAR_WAITING') {
      adviceBox.classList.add('warning');
    }

    adviceTitle.innerHTML = ai.adviceTitle;
    adviceDesc.innerText = ai.adviceDesc;

    // Render Explanatory Reasoning Items (WHY)
    const reasoningContainer = document.getElementById('ai-reasoning-items');
    reasoningContainer.innerHTML = ai.reasoning.map(item => `
      <div class="tree-item">
        <span class="tree-icon">${item.icon}</span>
        <span>${item.text}</span>
      </div>
    `).join('');
  }

  // Render Timeline Events Feed
  renderTimeline(events) {
    const listEl = document.getElementById('timeline-list');
    if (!listEl) return;

    listEl.innerHTML = events.map(ev => `
      <div class="timeline-item">
        <div class="timeline-icon ${ev.type}">${ev.icon}</div>
        <div class="timeline-content">
          <div class="timeline-time">${ev.time}</div>
          <div class="timeline-text">${ev.text}</div>
        </div>
      </div>
    `).join('');
  }
}

window.app = new AppController();
document.addEventListener('DOMContentLoaded', () => window.app.init());
