// Automated Workflows Module
export function initializeWorkflows() {
  const workflowSteps = document.getElementById('workflow-steps');
  const addStepBtn = document.getElementById('add-workflow-step');
  const saveWorkflowBtn = document.getElementById('save-workflow');
  const activeWorkflowsList = document.getElementById('active-workflows-list');

  let workflows = JSON.parse(localStorage.getItem('workflows')) || [];
  let currentWorkflow = { steps: [] };

  function addWorkflowStep() {
    const stepType = prompt('Step type (call, email, task, wait):');
    if (!stepType) return;

    let stepConfig = {};

    switch (stepType) {
      case 'call':
        stepConfig = {
          action: 'make_call',
          phone: prompt('Phone number:'),
          message: prompt('Message to play:')
        };
        break;
      case 'email':
        stepConfig = {
          action: 'send_email',
          to: prompt('Email address:'),
          subject: prompt('Subject:'),
          body: prompt('Email body:')
        };
        break;
      case 'task':
        stepConfig = {
          action: 'create_task',
          title: prompt('Task title:'),
          assignee: prompt('Assignee:')
        };
        break;
      case 'wait':
        stepConfig = {
          action: 'wait',
          duration: parseInt(prompt('Wait duration (minutes):'))
        };
        break;
    }

    const step = {
      id: Date.now(),
      type: stepType,
      config: stepConfig,
      order: currentWorkflow.steps.length
    };

    currentWorkflow.steps.push(step);
    updateWorkflowSteps();
  }

  function updateWorkflowSteps() {
    workflowSteps.innerHTML = '';

    currentWorkflow.steps.forEach((step, index) => {
      const stepDiv = document.createElement('div');
      stepDiv.className = 'workflow-step';
      stepDiv.innerHTML = `
        <div class="step-header">
          <span class="step-number">${index + 1}</span>
          <span class="step-type">${step.type}</span>
          <button class="button btn-sm btn-danger" onclick="removeWorkflowStep(${step.id})">Remove</button>
        </div>
        <div class="step-config">
          ${formatStepConfig(step.config)}
        </div>
      `;
      workflowSteps.appendChild(stepDiv);
    });
  }

  function formatStepConfig(config) {
    return Object.entries(config).map(([key, value]) =>
      `<div><strong>${key}:</strong> ${value}</div>`
    ).join('');
  }

  function removeWorkflowStep(stepId) {
    currentWorkflow.steps = currentWorkflow.steps.filter(step => step.id !== stepId);
    updateWorkflowSteps();
  }

  function saveWorkflow() {
    if (currentWorkflow.steps.length === 0) {
      alert('Please add at least one step to the workflow');
      return;
    }

    const name = prompt('Workflow name:');
    if (!name) return;

    const workflow = {
      id: Date.now(),
      name,
      steps: currentWorkflow.steps,
      createdAt: new Date(),
      active: true
    };

    workflows.push(workflow);
    localStorage.setItem('workflows', JSON.stringify(workflows));
    updateActiveWorkflows();

    // Reset current workflow
    currentWorkflow = { steps: [] };
    updateWorkflowSteps();

    alert('Workflow saved!');
  }

  function updateActiveWorkflows() {
    activeWorkflowsList.innerHTML = '';

    workflows.forEach(workflow => {
      const li = document.createElement('li');
      li.className = 'workflow-item';
      li.innerHTML = `
        <div class="workflow-info">
          <strong>${workflow.name}</strong>
          <span>Steps: ${workflow.steps.length}</span>
        </div>
        <div class="workflow-actions">
          <button class="button btn-sm" onclick="runWorkflow(${workflow.id})">Run</button>
          <button class="button btn-sm btn-secondary" onclick="editWorkflow(${workflow.id})">Edit</button>
          <button class="button btn-sm btn-danger" onclick="deleteWorkflow(${workflow.id})">Delete</button>
        </div>
      `;
      activeWorkflowsList.appendChild(li);
    });
  }

  function runWorkflow(workflowId) {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return;

    alert(`Running workflow: ${workflow.name}`);
    // In real implementation, execute workflow steps
  }

  function editWorkflow(workflowId) {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return;

    currentWorkflow = { ...workflow };
    updateWorkflowSteps();
  }

  function deleteWorkflow(workflowId) {
    if (confirm('Are you sure you want to delete this workflow?')) {
      workflows = workflows.filter(w => w.id !== workflowId);
      localStorage.setItem('workflows', JSON.stringify(workflows));
      updateActiveWorkflows();
    }
  }

  addStepBtn.addEventListener('click', addWorkflowStep);
  saveWorkflowBtn.addEventListener('click', saveWorkflow);

  // Expose functions globally
  window.removeWorkflowStep = removeWorkflowStep;
  window.runWorkflow = runWorkflow;
  window.editWorkflow = editWorkflow;
  window.deleteWorkflow = deleteWorkflow;

  updateActiveWorkflows();
}