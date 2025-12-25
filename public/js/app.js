/**
 * Epworth Village Integrated Assistant
 * Main Application JavaScript
 */

// API Base URL
const API_BASE = '/api';

// State
let assessmentQuestions = [];
let scenarios = [];
let interviewForm = null;

// Color definitions for True Colors
const TRUE_COLORS = {
  gold: { name: 'Gold', color: '#D4AF37', tagline: 'The Responsible Planner' },
  green: { name: 'Green', color: '#2E8B57', tagline: 'The Analytical Thinker' },
  orange: { name: 'Orange', color: '#FF8C00', tagline: 'The Adventurous Doer' },
  blue: { name: 'Blue', color: '#4169E1', tagline: 'The Compassionate Connector' }
};

// ===================================
// Initialization
// ===================================

document.addEventListener('DOMContentLoaded', () => {
  initializeTabs();
  loadAssessmentQuestions();
  loadScenarios();
  loadInterviewForm();
});

// ===================================
// Tab Navigation
// ===================================

function initializeTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.dataset.tab;
      showTab(tabId);
    });
  });
}

function showTab(tabId) {
  // Update tab buttons
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabId);
  });

  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === tabId);
  });
}

// ===================================
// Dashboard
// ===================================

async function checkSheetsConnection() {
  try {
    const response = await fetch(`${API_BASE}/sheets/status`);
    const data = await response.json();

    if (data.connected) {
      showAlert('success', `Connected to Google Sheets: ${data.spreadsheetTitle}`);
    } else {
      showAlert('warning', 'Google Sheets not configured. Check your .env file.');
    }
  } catch (error) {
    showAlert('error', 'Failed to check Sheets connection');
  }
}

// ===================================
// True Colors Assessment
// ===================================

async function loadAssessmentQuestions() {
  try {
    const response = await fetch(`${API_BASE}/assessment/questions`);
    const data = await response.json();

    if (data.success) {
      assessmentQuestions = data.questions;
      renderAssessmentQuestions(data.questions);
    }
  } catch (error) {
    console.error('Failed to load assessment questions:', error);
  }
}

function renderAssessmentQuestions(questions) {
  const container = document.getElementById('assessment-questions');

  container.innerHTML = questions.map((q, index) => `
    <div class="question-card" data-question-id="${q.id}">
      <h4>Question ${index + 1} of ${questions.length}</h4>
      <p class="question-text">${q.text}</p>
      <div class="question-options color-options">
        ${q.options.map(opt => `
          <label class="option-label color-option" style="border-left: 4px solid ${TRUE_COLORS[opt.color].color};">
            <input type="radio" name="q_${q.id}" value="${opt.color}" data-color="${opt.color}">
            <div class="option-content">
              <span class="color-badge-small" style="background: ${TRUE_COLORS[opt.color].color};">${TRUE_COLORS[opt.color].name}</span>
              <span class="option-text">${opt.text}</span>
            </div>
          </label>
        `).join('')}
      </div>
    </div>
  `).join('');

  // Add event listeners for option styling
  container.querySelectorAll('.option-label').forEach(label => {
    const radio = label.querySelector('input');
    radio.addEventListener('change', () => {
      // Remove selected from siblings
      label.closest('.question-options').querySelectorAll('.option-label').forEach(l => {
        l.classList.remove('selected');
      });
      label.classList.add('selected');
    });
  });
}

async function submitAssessment() {
  const candidateName = document.getElementById('candidate-name').value;
  const candidateEmail = document.getElementById('candidate-email').value;

  if (!candidateName) {
    showAlert('warning', 'Please enter your name');
    return;
  }

  // Collect responses
  const responses = [];
  document.querySelectorAll('.question-card').forEach(card => {
    const questionId = card.dataset.questionId;
    const selected = card.querySelector('input:checked');

    if (selected) {
      responses.push({
        questionId,
        color: selected.dataset.color
      });
    }
  });

  if (responses.length < assessmentQuestions.length) {
    showAlert('warning', 'Please answer all questions before submitting');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/assessment/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateName,
        candidateEmail,
        responses
      })
    });

    const data = await response.json();

    if (data.success) {
      renderAssessmentResults(data);

      // Save to Google Sheets if connected
      try {
        await fetch(`${API_BASE}/sheets/assessments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidateName,
            primaryColor: data.candidateReport.primaryColor.name,
            secondaryColor: data.candidateReport.secondaryColor.name,
            colorScores: data.candidateReport.colorScores
          })
        });
      } catch (e) {
        console.log('Could not save to sheets:', e);
      }

      showAlert('success', 'Assessment submitted successfully!');
    }
  } catch (error) {
    console.error('Assessment submission failed:', error);
    showAlert('error', 'Failed to submit assessment');
  }
}

function renderAssessmentResults(data) {
  const container = document.getElementById('assessment-results');
  const report = data.candidateReport;
  const primary = report.primaryColor;
  const secondary = report.secondaryColor;

  container.innerHTML = `
    <div class="results-header">
      <h3>True Colors Results for ${data.candidate.name}</h3>

      <div class="primary-color-result" style="background: linear-gradient(135deg, ${primary.color}15, ${primary.color}30); border: 2px solid ${primary.color}; border-radius: 12px; padding: 24px; margin: 20px 0;">
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
          <div style="width: 60px; height: 60px; background: ${primary.color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 1.5rem;">
            ${primary.name.charAt(0)}
          </div>
          <div>
            <h2 style="margin: 0; color: ${primary.color};">Primary: ${primary.name}</h2>
            <p style="margin: 4px 0 0 0; color: var(--gray-600);">${primary.tagline}</p>
          </div>
        </div>
        <p style="font-size: 1.1rem; line-height: 1.6;">${primary.description}</p>
      </div>

      <div class="secondary-color-result" style="background: ${secondary.color}10; border-left: 4px solid ${secondary.color}; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
        <h4 style="color: ${secondary.color}; margin: 0 0 8px 0;">Secondary: ${secondary.name} - ${secondary.tagline}</h4>
        <p style="margin: 0; color: var(--gray-600);">${secondary.description}</p>
      </div>
    </div>

    <div class="color-scores-chart" style="margin: 24px 0;">
      <h4>Your Color Distribution</h4>
      <div class="scores-bars">
        ${Object.entries(report.colorScores).sort((a, b) => b[1] - a[1]).map(([color, score]) => `
          <div class="score-bar-item" style="margin: 12px 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-weight: 500;">${TRUE_COLORS[color].name}</span>
              <span>${score} points</span>
            </div>
            <div style="background: var(--gray-200); border-radius: 4px; height: 24px; overflow: hidden;">
              <div style="background: ${TRUE_COLORS[color].color}; height: 100%; width: ${(score / 20) * 100}%; transition: width 0.5s ease;"></div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="results-sections">
      <div class="results-section">
        <h4>Your Strengths</h4>
        <ul>
          ${report.strengths.map(s => `<li>${s}</li>`).join('')}
        </ul>
      </div>

      <div class="results-section">
        <h4>Work Style</h4>
        <ul>
          ${report.workStyle.map(w => `<li>${w}</li>`).join('')}
        </ul>
      </div>

      <div class="results-section">
        <h4>Communication Tips</h4>
        <ul>
          ${report.communicationTips.map(c => `<li>${c}</li>`).join('')}
        </ul>
      </div>
    </div>

    <div style="margin-top: 24px; padding: 16px; background: var(--gray-50); border-radius: 8px;">
      <p style="font-size: 0.875rem; color: var(--gray-600); margin: 0;">
        <strong>Note:</strong> Your full detailed results have been submitted to the hiring team.
        This is your personal summary to help you understand your True Colors profile.
      </p>
    </div>
  `;

  container.style.display = 'block';
  container.scrollIntoView({ behavior: 'smooth' });
}

function resetAssessment() {
  document.getElementById('candidate-name').value = '';
  document.getElementById('candidate-email').value = '';
  document.querySelectorAll('.question-card input').forEach(input => {
    input.checked = false;
  });
  document.querySelectorAll('.option-label').forEach(label => {
    label.classList.remove('selected');
  });
  document.getElementById('assessment-results').style.display = 'none';
}

// ===================================
// Scenarios
// ===================================

async function loadScenarios() {
  try {
    const response = await fetch(`${API_BASE}/scenarios/all`);
    const data = await response.json();

    if (data.success) {
      scenarios = data.scenarios;
      renderScenarios(data.scenarios);
    }
  } catch (error) {
    console.error('Failed to load scenarios:', error);
  }
}

function renderScenarios(scenarioList) {
  const container = document.getElementById('scenarios-container');

  container.innerHTML = scenarioList.map((scenario, index) => `
    <div class="scenario-card" data-scenario-id="${scenario.id}">
      <div class="scenario-header">
        <h3>Scenario ${index + 1}: ${scenario.title}</h3>
        <span class="scenario-category">${scenario.category}</span>
      </div>

      <div class="scenario-context">
        <p><strong>Background:</strong> ${scenario.context}</p>
        <p style="margin-top: 12px;">${scenario.situation}</p>
      </div>

      <div class="scenario-questions">
        ${scenario.questions.map((q, qIndex) => `
          <div class="scenario-question">
            <label for="scenario_${scenario.id}_q${qIndex + 1}">
              <strong>Question ${qIndex + 1}:</strong> ${q.question}
            </label>
            ${q.guidance ? `<p class="question-guidance">${q.guidance}</p>` : ''}
            <textarea
              id="scenario_${scenario.id}_q${qIndex + 1}"
              rows="4"
              placeholder="Type your response here..."
              data-scenario="${scenario.id}"
              data-question="${qIndex + 1}"
            ></textarea>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

async function submitScenarios() {
  const candidateName = document.getElementById('scenario-candidate-name').value;
  const candidateEmail = document.getElementById('scenario-candidate-email').value;

  if (!candidateName) {
    showAlert('warning', 'Please enter your name');
    return;
  }

  // Collect all responses
  const responses = {};
  let hasEmptyResponses = false;

  scenarios.forEach(scenario => {
    responses[scenario.id] = {};
    scenario.questions.forEach((_, qIndex) => {
      const textarea = document.querySelector(`#scenario_${scenario.id}_q${qIndex + 1}`);
      const value = textarea.value.trim();
      responses[scenario.id][`q${qIndex + 1}`] = value;

      if (!value) {
        hasEmptyResponses = true;
      }
    });
  });

  if (hasEmptyResponses) {
    if (!confirm('Some questions are unanswered. Do you want to submit anyway?')) {
      return;
    }
  }

  try {
    const response = await fetch(`${API_BASE}/scenarios/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateName,
        candidateEmail,
        responses
      })
    });

    const data = await response.json();

    if (data.success) {
      // Save to Google Sheets if connected
      try {
        await fetch(`${API_BASE}/sheets/scenarios`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidateName,
            candidateEmail,
            submissionId: data.submissionId,
            responses
          })
        });
      } catch (e) {
        console.log('Could not save to sheets:', e);
      }

      showScenarioSubmissionResult(data);
      showAlert('success', 'Scenarios submitted successfully!');
    }
  } catch (error) {
    console.error('Scenario submission failed:', error);
    showAlert('error', 'Failed to submit scenarios');
  }
}

function showScenarioSubmissionResult(data) {
  const container = document.getElementById('scenario-results');

  container.innerHTML = `
    <div class="submission-success">
      <div class="success-icon">&#10003;</div>
      <h3>Scenarios Submitted Successfully!</h3>
      <p><strong>Submission ID:</strong> ${data.submissionId}</p>
      <p><strong>Submitted:</strong> ${new Date(data.submittedAt).toLocaleString()}</p>
      <p style="margin-top: 16px; color: var(--gray-600);">
        Your responses have been recorded and will be reviewed by the hiring team.
        Thank you for taking the time to complete these scenarios.
      </p>
      <div style="margin-top: 16px; padding: 12px; background: var(--gray-50); border-radius: 8px;">
        <p style="font-size: 0.875rem; margin: 0;">
          <strong>What happens next?</strong> The hiring team will review your responses
          as part of the interview process. They may ask follow-up questions during your interview.
        </p>
      </div>
    </div>
  `;

  container.style.display = 'block';
  container.scrollIntoView({ behavior: 'smooth' });
}

function resetScenarios() {
  document.getElementById('scenario-candidate-name').value = '';
  document.getElementById('scenario-candidate-email').value = '';
  document.querySelectorAll('.scenario-card textarea').forEach(textarea => {
    textarea.value = '';
  });
  document.getElementById('scenario-results').style.display = 'none';
}

// ===================================
// Interview Evaluation
// ===================================

async function loadInterviewForm() {
  try {
    const response = await fetch(`${API_BASE}/interview/form`);
    const data = await response.json();

    if (data.success) {
      interviewForm = data;
      renderInterviewSections(data.sections);
      renderFlags(data.greenFlags, data.redFlags);
      loadQuestionTemplates();
    }
  } catch (error) {
    console.error('Failed to load interview form:', error);
  }
}

function renderInterviewSections(sections) {
  const container = document.getElementById('interview-sections');

  container.innerHTML = sections.map(section => `
    <div class="form-section" data-section-id="${section.id}">
      <h3>${section.name}</h3>
      <p style="color: var(--gray-500); margin-bottom: 16px;">${section.description}</p>

      ${section.questions.map(q => renderInterviewQuestion(q)).join('')}
    </div>
  `).join('');
}

function renderInterviewQuestion(question) {
  switch (question.type) {
    case 'textarea':
      return `
        <div class="form-group">
          <label for="${question.id}">${question.text} ${question.required ? '*' : ''}</label>
          <textarea id="${question.id}" rows="3" ${question.required ? 'required' : ''}></textarea>
        </div>
      `;

    case 'scale':
      return `
        <div class="form-group">
          <label>${question.text} ${question.required ? '*' : ''}</label>
          ${question.rubric ? `
            <div style="font-size: 0.75rem; color: var(--gray-500); margin-bottom: 8px;">
              3=Strong, 2=Adequate, 1=Concern
            </div>
          ` : ''}
          <div class="scale-rating">
            ${[1, 2, 3].map(val => `
              <div class="scale-option">
                <input type="radio" name="${question.id}" id="${question.id}_${val}" value="${val}">
                <label for="${question.id}_${val}">
                  <div class="scale-value">${val}</div>
                  <div class="scale-label">${val === 3 ? 'Strong' : val === 2 ? 'Adequate' : 'Concern'}</div>
                </label>
              </div>
            `).join('')}
          </div>
        </div>
      `;

    case 'number':
      return `
        <div class="form-group">
          <label for="${question.id}">${question.text} ${question.required ? '*' : ''}</label>
          <input type="number" id="${question.id}" min="${question.min || 1}" max="${question.max || 10}" ${question.required ? 'required' : ''}>
        </div>
      `;

    case 'select':
      return `
        <div class="form-group">
          <label for="${question.id}">${question.text} ${question.required ? '*' : ''}</label>
          <select id="${question.id}" ${question.required ? 'required' : ''}>
            <option value="">Select...</option>
            ${question.options.map(opt => `
              <option value="${opt.value}">${opt.label}</option>
            `).join('')}
          </select>
        </div>
      `;

    default:
      return '';
  }
}

function renderFlags(greenFlags, redFlags) {
  // Render green flags list
  const greenList = document.getElementById('green-flags-list');
  greenList.innerHTML = greenFlags.map(f => `<li>${f.label}</li>`).join('');

  // Render red flags list
  const redList = document.getElementById('red-flags-list');
  redList.innerHTML = redFlags.map(f => `<li>${f.label}</li>`).join('');

  // Render checkboxes
  const greenCheckboxes = document.getElementById('green-flags-checkboxes');
  greenCheckboxes.innerHTML = greenFlags.map(f => `
    <label class="flag-checkbox">
      <input type="checkbox" name="green_flag" value="${f.id}">
      <span><strong>${f.label}</strong> - ${f.description}</span>
    </label>
  `).join('');

  const redCheckboxes = document.getElementById('red-flags-checkboxes');
  redCheckboxes.innerHTML = redFlags.map(f => `
    <label class="flag-checkbox">
      <input type="checkbox" name="red_flag" value="${f.id}">
      <span><strong>${f.label}</strong> - ${f.description}</span>
    </label>
  `).join('');
}

async function loadQuestionTemplates() {
  try {
    const response = await fetch(`${API_BASE}/interview/templates/questions`);
    const data = await response.json();

    if (data.success) {
      const container = document.getElementById('question-templates');
      const sectionOrder = ['opening', 'experience', 'values', 'closing'];
      const sectionLabels = {
        opening: 'Opening Questions',
        experience: 'Experience Questions',
        values: 'Values & Mission Fit Questions',
        closing: 'Closing Questions'
      };

      container.innerHTML = sectionOrder.map(category => {
        const questions = data.templates[category] || [];
        return `
          <div class="template-group">
            <div class="template-header" onclick="toggleTemplate(this)">
              ${sectionLabels[category] || category}
              <span>&#x25BC;</span>
            </div>
            <div class="template-content">
              <ul>
                ${questions.map(q => `<li>${q}</li>`).join('')}
              </ul>
            </div>
          </div>
        `;
      }).join('');
    }
  } catch (error) {
    console.error('Failed to load templates:', error);
  }
}

function toggleTemplate(header) {
  const content = header.nextElementSibling;
  content.classList.toggle('open');
  header.querySelector('span').textContent = content.classList.contains('open') ? '\u25B2' : '\u25BC';
}

async function calculateDecisionPreview() {
  const overallScore = parseInt(document.getElementById('overall-score').value) || 0;
  const greenFlags = Array.from(document.querySelectorAll('input[name="green_flag"]:checked')).map(cb => cb.value);
  const redFlags = Array.from(document.querySelectorAll('input[name="red_flag"]:checked')).map(cb => cb.value);

  if (!overallScore) {
    showAlert('warning', 'Please enter an overall score');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/interview/calculate-decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ overallScore, greenFlags, redFlags })
    });

    const data = await response.json();

    if (data.success) {
      const preview = document.getElementById('decision-preview');
      const decision = data.decision;

      preview.className = `decision-preview ${decision.recommendation.toLowerCase().replace(' ', '_')}`;
      preview.innerHTML = `
        <h3>Decision Preview</h3>
        <div style="display: flex; align-items: center; gap: 16px; margin: 16px 0;">
          <div style="font-size: 2rem; font-weight: 700;">
            ${decision.recommendation === 'STRONG YES' ? '&#x2705;' :
              decision.recommendation === 'YES' ? '&#x2714;' :
              decision.recommendation === 'MAYBE' ? '&#x1F914;' :
              decision.recommendation === 'NO' ? '&#x274C;' : '&#x26D4;'}
            ${decision.recommendation}
          </div>
          <div>
            <div>Confidence: <strong>${decision.confidence}</strong></div>
            <div style="color: var(--gray-600);">${decision.rationale}</div>
          </div>
        </div>
        ${decision.nextSteps ? `
          <div style="margin-top: 16px;">
            <h4>Recommended Next Steps:</h4>
            <ul>
              ${decision.nextSteps.map(step => `<li>${step}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      `;

      preview.style.display = 'block';
    }
  } catch (error) {
    console.error('Decision calculation failed:', error);
    showAlert('error', 'Failed to calculate decision');
  }
}

async function submitInterview() {
  const candidateName = document.getElementById('interview-candidate-name').value;
  const interviewerName = document.getElementById('interviewer-name').value;
  const position = document.getElementById('position-applied').value;
  const overallScore = parseInt(document.getElementById('overall-score').value);
  const recommendation = document.getElementById('recommendation').value;
  const rationale = document.getElementById('decision-rationale').value;

  if (!candidateName || !interviewerName || !overallScore || !recommendation || !rationale) {
    showAlert('warning', 'Please fill in all required fields');
    return;
  }

  // Collect responses
  const responses = [];
  document.querySelectorAll('#interview-sections .form-section').forEach(section => {
    section.querySelectorAll('input, select, textarea').forEach(input => {
      if (input.type === 'radio') {
        if (input.checked) {
          responses.push({
            questionId: input.name,
            value: parseInt(input.value)
          });
        }
      } else if (input.value) {
        responses.push({
          questionId: input.id,
          value: input.type === 'number' ? parseInt(input.value) : input.value
        });
      }
    });
  });

  // Collect flags
  const greenFlags = Array.from(document.querySelectorAll('input[name="green_flag"]:checked')).map(cb => cb.value);
  const redFlags = Array.from(document.querySelectorAll('input[name="red_flag"]:checked')).map(cb => cb.value);

  try {
    const response = await fetch(`${API_BASE}/interview/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateInfo: {
          name: candidateName,
          interviewer: interviewerName,
          position
        },
        responses,
        decision: {
          overallScore,
          recommendation,
          rationale,
          redFlags,
          greenFlags
        }
      })
    });

    const data = await response.json();

    if (data.success) {
      // Save to Google Sheets
      try {
        await fetch(`${API_BASE}/sheets/interviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidateName,
            interviewerName,
            overallScore,
            recommendation,
            sectionScores: data.report.sectionScores,
            redFlags,
            greenFlags,
            notes: rationale
          })
        });
      } catch (e) {
        console.log('Could not save to sheets:', e);
      }

      showAlert('success', 'Interview evaluation submitted successfully!');
      showModal(`
        <h3>Evaluation Complete</h3>
        <p><strong>Candidate:</strong> ${candidateName}</p>
        <p><strong>Interviewer:</strong> ${interviewerName}</p>
        <p><strong>Score:</strong> ${overallScore}/10</p>
        <p><strong>Recommendation:</strong> ${data.report.recommendation.recommendation}</p>
        <p><strong>Confidence:</strong> ${data.report.recommendation.confidence}</p>
        <p style="margin-top: 16px;">${data.report.recommendation.rationale}</p>
      `);
    }
  } catch (error) {
    console.error('Interview submission failed:', error);
    showAlert('error', 'Failed to submit evaluation');
  }
}

function resetInterview() {
  document.getElementById('interview-candidate-name').value = '';
  document.getElementById('interviewer-name').value = '';
  document.getElementById('position-applied').value = 'Family Life Specialist';
  document.getElementById('overall-score').value = '';
  document.getElementById('recommendation').value = '';
  document.getElementById('decision-rationale').value = '';

  document.querySelectorAll('#interview-sections input, #interview-sections select, #interview-sections textarea').forEach(el => {
    if (el.type === 'radio' || el.type === 'checkbox') {
      el.checked = false;
    } else {
      el.value = '';
    }
  });

  document.querySelectorAll('input[name="green_flag"], input[name="red_flag"]').forEach(cb => {
    cb.checked = false;
  });

  document.getElementById('decision-preview').style.display = 'none';
}

// ===================================
// Utilities
// ===================================

function showAlert(type, message) {
  // Create alert element
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = message;
  alert.style.position = 'fixed';
  alert.style.top = '100px';
  alert.style.right = '20px';
  alert.style.zIndex = '1001';
  alert.style.minWidth = '300px';
  alert.style.animation = 'fadeIn 0.3s ease';

  document.body.appendChild(alert);

  // Remove after 4 seconds
  setTimeout(() => {
    alert.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => alert.remove(), 300);
  }, 4000);
}

function showModal(content) {
  const modal = document.getElementById('modal');
  const modalBody = document.getElementById('modal-body');
  modalBody.innerHTML = content;
  modal.classList.add('open');
}

function closeModal() {
  const modal = document.getElementById('modal');
  modal.classList.remove('open');
}

// Close modal on background click
document.getElementById('modal')?.addEventListener('click', (e) => {
  if (e.target.id === 'modal') {
    closeModal();
  }
});

// Add fadeOut animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeOut {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(-10px); }
  }
`;
document.head.appendChild(style);
