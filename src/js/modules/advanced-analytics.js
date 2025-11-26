// Advanced Analytics Dashboard Module
// Provides custom reporting and insights with drag-and-drop dashboard builder

import { getCallHistory } from './call-logging.js';
import { feedbackState } from './feedback.js';

export const analyticsState = {
  dashboards: [],
  widgets: [],
  dataSources: [],
  customQueries: [],
  activeDashboard: null
};

// Default dashboard widgets
const defaultWidgets = [
  {
    id: 'call-volume-chart',
    name: 'Call Volume Trend',
    type: 'line-chart',
    dataSource: 'calls',
    config: {
      title: 'Daily Call Volume',
      xAxis: 'date',
      yAxis: 'count',
      timeRange: '30d'
    }
  },
  {
    id: 'response-time-gauge',
    name: 'Average Response Time',
    type: 'gauge',
    dataSource: 'calls',
    config: {
      title: 'Avg Response Time',
      target: 30, // seconds
      unit: 'seconds'
    }
  },
  {
    id: 'satisfaction-score',
    name: 'Customer Satisfaction',
    type: 'metric',
    dataSource: 'feedback',
    config: {
      title: 'CSAT Score',
      format: 'percentage',
      target: 85
    }
  },
  {
    id: 'agent-performance-table',
    name: 'Agent Performance',
    type: 'table',
    dataSource: 'agents',
    config: {
      title: 'Top Performers',
      columns: ['name', 'calls', 'avgDuration', 'satisfaction'],
      sortBy: 'calls',
      limit: 10
    }
  }
];

// Default dashboards
const defaultDashboards = [
  {
    id: 'overview',
    name: 'Call Center Overview',
    description: 'Key metrics and performance indicators',
    widgets: ['call-volume-chart', 'response-time-gauge', 'satisfaction-score'],
    layout: {
      columns: 3,
      rows: 2,
      widgetSizes: {
        'call-volume-chart': { w: 2, h: 1 },
        'response-time-gauge': { w: 1, h: 1 },
        'satisfaction-score': { w: 1, h: 1 }
      }
    },
    isDefault: true
  },
  {
    id: 'agent-performance',
    name: 'Agent Performance',
    description: 'Detailed agent metrics and analytics',
    widgets: ['agent-performance-table'],
    layout: {
      columns: 1,
      rows: 1,
      widgetSizes: {
        'agent-performance-table': { w: 1, h: 1 }
      }
    }
  }
];

export function initializeAdvancedAnalytics(doc = document) {
  loadAnalyticsData();
  setupAnalyticsEventListeners(doc);
  renderAnalyticsDashboard(doc);
  initializeCharts();
}

export function initializeCharts() {
  // Initialize Chart.js charts if available
  if (typeof Chart !== 'undefined') {
    // Find all canvas elements that need charts
    const chartCanvases = document.querySelectorAll('canvas[data-chart-type]');
    chartCanvases.forEach(canvas => {
      const chartType = canvas.dataset.chartType;
      const chartData = JSON.parse(canvas.dataset.chartData || '[]');

      new Chart(canvas.getContext('2d'), {
        type: chartType,
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    });
  }
}

function loadAnalyticsData() {
  try {
    const saved = localStorage.getItem('analytics-data');
    if (saved) {
      const data = JSON.parse(saved);
      analyticsState.dashboards = data.dashboards || defaultDashboards;
      analyticsState.widgets = data.widgets || defaultWidgets;
      analyticsState.customQueries = data.customQueries || [];
      analyticsState.activeDashboard = data.activeDashboard || 'overview';
    } else {
      analyticsState.dashboards = defaultDashboards;
      analyticsState.widgets = defaultWidgets;
      analyticsState.customQueries = [];
      analyticsState.activeDashboard = 'overview';
      saveAnalyticsData();
    }
  } catch (error) {
    console.error('Error loading analytics data:', error);
    analyticsState.dashboards = defaultDashboards;
    analyticsState.widgets = defaultWidgets;
  }
}

function saveAnalyticsData() {
  try {
    const data = {
      dashboards: analyticsState.dashboards,
      widgets: analyticsState.widgets,
      customQueries: analyticsState.customQueries,
      activeDashboard: analyticsState.activeDashboard
    };
    localStorage.setItem('analytics-data', JSON.stringify(data));
  } catch (error) {
    console.error('Error saving analytics data:', error);
  }
}

function setupAnalyticsEventListeners(doc) {
  // Dashboard switching
  doc.addEventListener('click', handleDashboardActions);

  // Data updates from other modules
  doc.addEventListener('analytics:data-update', handleDataUpdate);

  // Real-time updates
  setInterval(updateLiveData, 30000); // Update every 30 seconds
}

function renderAnalyticsDashboard(doc) {
  const container = doc.getElementById('analytics-dashboard-container');
  if (!container) return;

  const activeDashboard = analyticsState.dashboards.find(d => d.id === analyticsState.activeDashboard);

  container.innerHTML = `
    <div class="analytics-section">
      <div class="analytics-header">
        <div class="dashboard-selector">
          <h3>Analytics Dashboard</h3>
          <select id="dashboard-select" onchange="switchDashboard(this.value)">
            ${analyticsState.dashboards.map(d => `
              <option value="${d.id}" ${d.id === analyticsState.activeDashboard ? 'selected' : ''}>
                ${d.name}
              </option>
            `).join('')}
          </select>
        </div>
        <div class="dashboard-actions">
          <button class="btn-sm" onclick="createNewDashboard()">New Dashboard</button>
          <button class="btn-sm btn-secondary" onclick="editDashboard()">Edit Layout</button>
          <button class="btn-sm btn-outline" onclick="exportDashboard()">Export</button>
        </div>
      </div>

      ${activeDashboard ? renderDashboard(activeDashboard) : '<div class="empty-state">No dashboard selected</div>'}

      <div class="analytics-footer">
        <div class="data-sources">
          <h4>Data Sources</h4>
          <div class="source-list">
            <span class="source-tag">📞 Calls</span>
            <span class="source-tag">👥 Agents</span>
            <span class="source-tag">⭐ Feedback</span>
            <span class="source-tag">⏱️ Time Tracking</span>
            <span class="source-tag">🎯 QA Scores</span>
          </div>
        </div>
        <div class="last-updated">
          Last updated: <span id="last-updated">${new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  `;

  if (activeDashboard) {
    renderDashboardWidgets(activeDashboard, doc);
  }
}

function renderDashboard(dashboard) {
  const { layout } = dashboard;
  const gridStyle = `grid-template-columns: repeat(${layout.columns}, 1fr); grid-template-rows: repeat(${layout.rows}, 1fr);`;

  return `
    <div class="dashboard-grid" style="${gridStyle}">
      ${dashboard.widgets.map(widgetId => {
        const widget = analyticsState.widgets.find(w => w.id === widgetId);
        if (!widget) return '';

        const size = layout.widgetSizes[widgetId] || { w: 1, h: 1 };
        const gridStyle = `grid-column: span ${size.w}; grid-row: span ${size.h};`;

        return `
          <div class="dashboard-widget" style="${gridStyle}" data-widget-id="${widgetId}">
            <div class="widget-header">
              <h4>${widget.name}</h4>
              <div class="widget-controls">
                <button class="btn-icon" onclick="refreshWidget('${widgetId}')" title="Refresh">🔄</button>
                <button class="btn-icon" onclick="configureWidget('${widgetId}')" title="Configure">⚙️</button>
              </div>
            </div>
            <div class="widget-content" id="widget-${widgetId}">
              <div class="widget-loading">Loading...</div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderDashboardWidgets(dashboard, doc) {
  dashboard.widgets.forEach(widgetId => {
    const widget = analyticsState.widgets.find(w => w.id === widgetId);
    if (!widget) return;

    const container = doc.getElementById(`widget-${widgetId}`);
    if (!container) return;

    renderWidget(widget, container);
  });
}

function renderWidget(widget, container) {
  switch (widget.type) {
    case 'line-chart':
      renderLineChart(widget, container);
      break;
    case 'gauge':
      renderGauge(widget, container);
      break;
    case 'metric':
      renderMetric(widget, container);
      break;
    case 'table':
      renderTable(widget, container);
      break;
    default:
      container.innerHTML = '<div class="widget-error">Unknown widget type</div>';
  }
}

function renderLineChart(widget, container) {
  let data;
  if (widget.dataSource === 'calls') {
    data = getCallVolumeData(widget.config.timeRange || '30d');
  } else if (widget.dataSource === 'feedback') {
    data = getFeedbackTrends();
  } else {
    data = generateMockChartData(widget.config.timeRange || '30d');
  }

  container.innerHTML = `
    <div class="chart-container">
      <canvas id="chart-${widget.id}" width="300" height="200"></canvas>
    </div>
  `;

  // In a real implementation, use Chart.js or similar
  setTimeout(() => {
    const canvas = document.getElementById(`chart-${widget.id}`);
    if (canvas) {
      renderSimpleChart(canvas, data);
    }
  }, 100);
}

function renderGauge(widget, container) {
  let value;
  if (widget.dataSource === 'calls') {
    value = getAverageResponseTime();
  } else {
    value = Math.floor(Math.random() * 60) + 15; // Mock value
  }
  const percentage = Math.min((value / widget.config.target) * 100, 100);

  container.innerHTML = `
    <div class="gauge-container">
      <div class="gauge">
        <div class="gauge-fill" style="transform: rotate(${(percentage / 100) * 180 - 90}deg)"></div>
        <div class="gauge-center"></div>
      </div>
      <div class="gauge-value">
        <span class="value">${value}</span>
        <span class="unit">${widget.config.unit}</span>
      </div>
      <div class="gauge-target">Target: ${widget.config.target}${widget.config.unit}</div>
    </div>
  `;
}

function renderMetric(widget, container) {
  let value;
  if (widget.dataSource === 'feedback') {
    const score = getCustomerSatisfactionScore();
    value = `${score}%`;
  } else {
    value = widget.config.format === 'percentage'
      ? `${Math.floor(Math.random() * 20) + 80}%`
      : Math.floor(Math.random() * 1000);
  }

  const isGood = widget.config.target
    ? (widget.config.format === 'percentage' ? parseInt(value) >= widget.config.target : value >= widget.config.target)
    : true;

  container.innerHTML = `
    <div class="metric-container">
      <div class="metric-value ${isGood ? 'good' : 'warning'}">${value}</div>
      <div class="metric-label">${widget.config.title}</div>
      ${widget.config.target ? `<div class="metric-target">Target: ${widget.config.target}${widget.config.format === 'percentage' ? '%' : ''}</div>` : ''}
    </div>
  `;
}

function renderTable(widget, container) {
  let data;
  if (widget.dataSource === 'calls') {
    data = getAgentPerformanceData().map(agent => ({
      name: agent.agent,
      calls: agent.totalCalls,
      avgDuration: `${Math.floor(agent.avgDuration / 60)}:${(agent.avgDuration % 60).toString().padStart(2, '0')}`,
      satisfaction: `${agent.satisfaction}%`
    }));
  } else {
    // Mock agent performance data
    data = [
      { name: 'Alice Johnson', calls: 45, avgDuration: '8:32', satisfaction: '92%' },
      { name: 'Bob Smith', calls: 38, avgDuration: '7:15', satisfaction: '88%' },
      { name: 'Carol Davis', calls: 52, avgDuration: '9:01', satisfaction: '95%' },
      { name: 'David Wilson', calls: 29, avgDuration: '6:48', satisfaction: '85%' }
    ];
  }

  container.innerHTML = `
    <div class="table-container">
      <table class="analytics-table">
        <thead>
          <tr>
            ${widget.config.columns.map(col => `<th>${col}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.slice(0, widget.config.limit || 10).map(row => `
            <tr>
              ${widget.config.columns.map(col => `<td>${row[col]}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function generateMockChartData(timeRange) {
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 14;
  const data = [];

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.floor(Math.random() * 50) + 20
    });
  }

  return data;
}

function renderSimpleChart(canvas, data) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Simple line chart implementation
  ctx.strokeStyle = '#3498db';
  ctx.lineWidth = 2;
  ctx.beginPath();

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  data.forEach((point, index) => {
    const x = (index / (data.length - 1)) * (width - 40) + 20;
    const y = height - 20 - ((point.value - minValue) / range) * (height - 40);

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();

  // Add points
  ctx.fillStyle = '#3498db';
  data.forEach((point, index) => {
    const x = (index / (data.length - 1)) * (width - 40) + 20;
    const y = height - 20 - ((point.value - minValue) / range) * (height - 40);

    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fill();
  });
}

function handleDashboardActions(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const action = button.dataset.action;
  const dashboardId = button.dataset.dashboardId;

  switch (action) {
    case 'switch':
      switchDashboard(dashboardId);
      break;
    case 'edit':
      editDashboard(dashboardId);
      break;
    case 'delete':
      deleteDashboard(dashboardId);
      break;
  }
}

function switchDashboard(dashboardId) {
  analyticsState.activeDashboard = dashboardId;
  saveAnalyticsData();
  renderAnalyticsDashboard(document);
}

function createNewDashboard() {
  const name = prompt('Dashboard name:');
  if (!name) return;

  const dashboard = {
    id: `dashboard-${Date.now()}`,
    name,
    description: 'Custom dashboard',
    widgets: [],
    layout: {
      columns: 3,
      rows: 2,
      widgetSizes: {}
    },
    isDefault: false
  };

  analyticsState.dashboards.push(dashboard);
  analyticsState.activeDashboard = dashboard.id;
  saveAnalyticsData();
  renderAnalyticsDashboard(document);
  showToast('Dashboard created!', 'success');
}

function editDashboard() {
  // TODO: Implement dashboard editor
  showToast('Dashboard editor coming soon!', 'info');
}

function exportDashboard() {
  const dashboard = analyticsState.dashboards.find(d => d.id === analyticsState.activeDashboard);
  if (!dashboard) return;

  const exportData = {
    dashboard,
    widgets: dashboard.widgets.map(id => analyticsState.widgets.find(w => w.id === id)).filter(Boolean),
    exportedAt: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${dashboard.name.toLowerCase().replace(/\s+/g, '-')}-dashboard.json`;
  a.click();
  URL.revokeObjectURL(url);

  showToast('Dashboard exported!', 'success');
}

function handleDataUpdate(event) {
  // Refresh widgets when data updates
  const { dataSource } = event.detail;
  updateWidgetsForDataSource(dataSource);
}

function updateWidgetsForDataSource(dataSource) {
  const affectedWidgets = analyticsState.widgets.filter(w => w.dataSource === dataSource);
  affectedWidgets.forEach(widget => {
    const container = document.getElementById(`widget-${widget.id}`);
    if (container) {
      renderWidget(widget, container);
    }
  });
}

function updateLiveData() {
  // Update timestamp
  const timestamp = document.getElementById('last-updated');
  if (timestamp) {
    timestamp.textContent = new Date().toLocaleTimeString();
  }

  // Refresh live widgets
  updateWidgetsForDataSource('calls');
}

// Data processing functions
export function getCallVolumeData(timeRange = '30d') {
  const calls = getCallHistory();
  const now = new Date();
  const days = timeRange === '30d' ? 30 : timeRange === '7d' ? 7 : 1;

  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const dayCalls = calls.filter(call => {
      const callDate = new Date(call.startTime).toISOString().split('T')[0];
      return callDate === dateStr;
    });

    data.push({
      date: dateStr,
      count: dayCalls.length,
      inbound: dayCalls.filter(c => c.callType === 'inbound').length,
      outbound: dayCalls.filter(c => c.callType === 'outbound').length
    });
  }

  return data;
}

export function getAverageResponseTime() {
  const calls = getCallHistory();
  if (calls.length === 0) return 0;

  // For demo purposes, simulate response time based on call duration
  const avgDuration = calls.reduce((sum, call) => sum + (call.duration || 0), 0) / calls.length;
  return Math.floor(avgDuration / 1000); // Convert to seconds
}

export function getCustomerSatisfactionScore() {
  const responses = feedbackState.responses;
  if (responses.length === 0) return 0;

  let totalScore = 0;
  let count = 0;

  responses.forEach(response => {
    response.answers.forEach(answer => {
      if (answer.type === 'rating' && answer.value) {
        const options = answer.options || [];
        const score = options.indexOf(answer.value) + 1; // 1-based rating
        if (score > 0) {
          totalScore += score;
          count++;
        }
      }
    });
  });

  return count > 0 ? Math.round((totalScore / count / 5) * 100) : 0; // Convert to percentage
}

export function getAgentPerformanceData() {
  const calls = getCallHistory();

  // Group calls by agent (for now, we'll simulate different agents)
  const agents = ['Agent A', 'Agent B', 'Agent C'];
  const agentData = agents.map(agent => {
    const agentCalls = calls.filter((_, index) => index % agents.length === agents.indexOf(agent));
    const totalCalls = agentCalls.length;
    const avgDuration = totalCalls > 0 ?
      agentCalls.reduce((sum, call) => sum + (call.duration || 0), 0) / totalCalls : 0;

    return {
      agent,
      totalCalls,
      avgDuration: Math.floor(avgDuration / 1000), // seconds
      satisfaction: Math.floor(Math.random() * 20) + 80 // Simulated satisfaction
    };
  });

  return agentData;
}

export function getFeedbackTrends() {
  const responses = feedbackState.responses;
  const now = new Date();
  const data = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const dayResponses = responses.filter(response => {
      const responseDate = new Date(response.timestamp).toISOString().split('T')[0];
      return responseDate === dateStr;
    });

    data.push({
      date: dateStr,
      responses: dayResponses.length,
      avgRating: dayResponses.length > 0 ? getCustomerSatisfactionScore() : 0
    });
  }

  return data;
}

// Global functions
window.switchDashboard = switchDashboard;
window.createNewDashboard = createNewDashboard;
window.editDashboard = editDashboard;
window.exportDashboard = exportDashboard;
window.refreshWidget = (widgetId) => {
  const widget = analyticsState.widgets.find(w => w.id === widgetId);
  if (widget) {
    const container = document.getElementById(`widget-${widget.id}`);
    if (container) {
      renderWidget(widget, container);
    }
  }
};
window.configureWidget = (widgetId) => {
  showToast('Widget configuration coming soon!', 'info');
};

// Import toast for notifications
import { showToast } from '../utils/toast.js';