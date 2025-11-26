// Advanced Reporting Module
import { getCallHistory } from './call-logging.js';

export function initializeAdvancedReporting() {
  const reportTypeSelect = document.getElementById('report-type');
  const startDateInput = document.getElementById('report-start-date');
  const endDateInput = document.getElementById('report-end-date');
  const generateBtn = document.getElementById('generate-report');
  const clearFiltersBtn = document.getElementById('clear-filters');
  const exportReportBtn = document.getElementById('export-report');
  const reportOutput = document.getElementById('report-output');

  generateBtn.addEventListener('click', generateReport);
  clearFiltersBtn.addEventListener('click', clearFilters);
  exportReportBtn.addEventListener('click', exportReport);

  // Set default date range (last 30 days)
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  startDateInput.value = thirtyDaysAgo.toISOString().split('T')[0];
  endDateInput.value = today.toISOString().split('T')[0];
}

function generateReport() {
  const reportType = document.getElementById('report-type').value;
  const startDate = new Date(document.getElementById('report-start-date').value);
  const endDate = new Date(document.getElementById('report-end-date').value);

  const calls = getCallHistory().filter(call => {
    const callDate = new Date(call.startTime);
    return callDate >= startDate && callDate <= endDate;
  });

  let reportContent = '';

  switch (reportType) {
    case 'calls':
      reportContent = generateCallReport(calls);
      break;
    case 'performance':
      reportContent = generatePerformanceReport(calls);
      break;
    case 'qa':
      reportContent = generateQAReport(calls);
      break;
    default:
      reportContent = '<p>Please select a report type</p>';
  }

  document.getElementById('report-output').innerHTML = reportContent;
}

function generateCallReport(calls) {
  const totalCalls = calls.length;
  const inboundCalls = calls.filter(c => c.callType === 'inbound').length;
  const outboundCalls = calls.filter(c => c.callType === 'outbound').length;
  const completedCalls = calls.filter(c => c.status === 'completed').length;

  const totalDuration = calls.reduce((sum, call) => sum + (call.duration || 0), 0);
  const avgDuration = totalCalls > 0 ? totalDuration / totalCalls : 0;

  return `
    <h3>Call Report</h3>
    <div class="report-summary">
      <div class="metric">Total Calls: ${totalCalls}</div>
      <div class="metric">Inbound: ${inboundCalls}</div>
      <div class="metric">Outbound: ${outboundCalls}</div>
      <div class="metric">Completed: ${completedCalls}</div>
      <div class="metric">Average Duration: ${formatDuration(avgDuration)}</div>
    </div>
    <table class="report-table">
      <thead>
        <tr>
          <th>Caller</th>
          <th>Type</th>
          <th>Start Time</th>
          <th>Duration</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${calls.map(call => `
          <tr>
            <td>${call.callerName}</td>
            <td>${call.callType}</td>
            <td>${new Date(call.startTime).toLocaleString()}</td>
            <td>${call.duration ? formatDuration(call.duration) : 'N/A'}</td>
            <td>${call.status}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function generatePerformanceReport(calls) {
  // Mock performance data
  return `
    <h3>Performance Report</h3>
    <div class="report-summary">
      <div class="metric">Average Handle Time: ${formatDuration(480000)}</div>
      <div class="metric">First Call Resolution: 87%</div>
      <div class="metric">Customer Satisfaction: 92%</div>
      <div class="metric">Calls per Hour: 12.5</div>
    </div>
    <div class="performance-trends">
      <h4>Trends</h4>
      <p>Performance has improved by 5% compared to last month.</p>
    </div>
  `;
}

function generateQAReport(calls) {
  // Mock QA data
  return `
    <h3>QA Report</h3>
    <div class="report-summary">
      <div class="metric">Average QA Score: 88%</div>
      <div class="metric">Calls Reviewed: ${Math.floor(calls.length * 0.3)}</div>
      <div class="metric">Compliance Rate: 95%</div>
    </div>
    <div class="qa-insights">
      <h4>Common Issues</h4>
      <ul>
        <li>Greeting consistency: 98% compliance</li>
        <li>Empathy demonstration: 92% compliance</li>
        <li>Issue resolution: 85% compliance</li>
      </ul>
    </div>
  `;
}

function formatDuration(ms) {
  const minutes = Math.floor(ms / 1000 / 60);
  const seconds = Math.floor((ms / 1000) % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function clearFilters() {
  const reportTypeSelect = document.getElementById('report-type');
  const startDateInput = document.getElementById('report-start-date');
  const endDateInput = document.getElementById('report-end-date');
  const reportOutput = document.getElementById('report-output');

  // Reset to defaults
  reportTypeSelect.selectedIndex = 0;

  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  startDateInput.value = thirtyDaysAgo.toISOString().split('T')[0];
  endDateInput.value = today.toISOString().split('T')[0];

  // Clear report output
  reportOutput.innerHTML = `
    <div class="no-reports">
      <h4>No Reports Generated</h4>
      <p>Select your report parameters above and click "Generate Report" to view results.</p>
    </div>
  `;
}

function exportReport() {
  const reportType = document.getElementById('report-type').value;
  const startDate = document.getElementById('report-start-date').value;
  const endDate = document.getElementById('report-end-date').value;
  const reportOutput = document.getElementById('report-output');

  // Get report data
  const calls = getCallHistory().filter(call => {
    const callDate = new Date(call.startTime);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return callDate >= start && callDate <= end;
  });

  let csvContent = '';

  switch (reportType) {
    case 'calls':
      csvContent = generateCallCSV(calls);
      break;
    case 'performance':
      csvContent = generatePerformanceCSV(calls);
      break;
    case 'qa':
      csvContent = generateQACSV(calls);
      break;
    default:
      alert('Please generate a report first');
      return;
  }

  // Create and download CSV file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${reportType}_report_${startDate}_to_${endDate}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function generateCallCSV(calls) {
  const headers = ['Caller Name', 'Call Type', 'Start Time', 'Duration', 'Status'];
  const rows = calls.map(call => [
    call.callerName,
    call.callType,
    new Date(call.startTime).toLocaleString(),
    call.duration ? formatDuration(call.duration) : 'N/A',
    call.status
  ]);

  return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
}

function generatePerformanceCSV(calls) {
  const headers = ['Metric', 'Value'];
  const metrics = [
    ['Total Calls', calls.length],
    ['Average Handle Time', formatDuration(480000)],
    ['First Call Resolution', '87%'],
    ['Customer Satisfaction', '92%'],
    ['Calls per Hour', '12.5']
  ];

  return [headers, ...metrics].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
}

function generateQACSV(calls) {
  const headers = ['Metric', 'Value'];
  const metrics = [
    ['Average QA Score', '88%'],
    ['Calls Reviewed', Math.floor(calls.length * 0.3)],
    ['Compliance Rate', '95%'],
    ['Greeting Consistency', '98%'],
    ['Empathy Demonstration', '92%'],
    ['Issue Resolution', '85%']
  ];

  return [headers, ...metrics].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
}