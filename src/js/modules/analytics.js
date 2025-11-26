// Analytics Dashboard Module
import { getCallHistory } from './call-logging.js';

export function initializeAnalytics() {
  const tabs = document.querySelectorAll('.analytics-tab');
  const contents = document.querySelectorAll('.analytics-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      document.getElementById(tab.dataset.tab + '-tab').classList.add('active');
    });
  });

  updateOverviewMetrics();
}

function updateOverviewMetrics() {
  const callHistory = getCallHistory();
  const totalCalls = callHistory.length;
  const completedCalls = callHistory.filter(call => call.status === 'completed');

  // Calculate average duration
  const totalDuration = completedCalls.reduce((sum, call) => sum + (call.duration || 0), 0);
  const avgDuration = completedCalls.length > 0 ? totalDuration / completedCalls.length : 0;

  // Mock resolution rate (in real app, this would be tracked)
  const resolutionRate = Math.floor(Math.random() * 20) + 80; // 80-100%

  document.getElementById('total-calls').textContent = totalCalls;
  document.getElementById('avg-duration').textContent = formatDuration(avgDuration);
  document.getElementById('resolution-rate').textContent = resolutionRate + '%';
}

function formatDuration(ms) {
  const minutes = Math.floor(ms / 1000 / 60);
  const seconds = Math.floor((ms / 1000) % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// For charts, use Chart.js if available
export function initializeCharts() {
  // Initialize charts when Chart.js is available
  const callsChartCanvas = document.getElementById('calls-chart');
  if (callsChartCanvas && typeof Chart !== 'undefined') {
    const ctx = callsChartCanvas.getContext('2d');
    const callHistory = getCallHistory();
    const last7Days = Array.from({length: 7}, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toLocaleDateString();
    });

    const callCounts = last7Days.map(dateStr => {
      return callHistory.filter(call => {
        const callDate = new Date(call.startTime).toLocaleDateString();
        return callDate === dateStr;
      }).length;
    });

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: last7Days,
        datasets: [{
          label: 'Calls per Day',
          data: callCounts,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }
}