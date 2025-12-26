/**
 * Epworth Family Resources Interview Assistant
 * Main Application JavaScript
 */

// API Base URL
const API_BASE = '/api';

// State
let assessmentQuestions = [];
let scenarios = [];
let interviewForm = null;

// PIN Protection State
const INTERVIEWER_PIN = '8853';
const PROTECTED_TABS = ['questionnaire', 'interview'];
let unlockedTabs = [];
let pendingTabId = null;

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
  loadQuestionnaire();
});

// ===================================
// Tab Navigation
// ===================================

function initializeTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.dataset.tab;

      // Check if tab requires PIN protection
      if (PROTECTED_TABS.includes(tabId) && !unlockedTabs.includes(tabId)) {
        showPinModal(tabId);
        return;
      }

      showTab(tabId);
    });
  });
}

function showTab(tabId) {
  // Check if tab requires PIN protection
  if (PROTECTED_TABS.includes(tabId) && !unlockedTabs.includes(tabId)) {
    showPinModal(tabId);
    return;
  }

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
// PIN Protection
// ===================================

function showPinModal(tabId) {
  pendingTabId = tabId;
  const modal = document.getElementById('pin-modal');
  const pinInput = document.getElementById('pin-input');
  const pinError = document.getElementById('pin-error');

  // Reset modal state
  pinInput.value = '';
  pinError.style.display = 'none';

  modal.classList.add('open');
  pinInput.focus();
}

function closePinModal() {
  const modal = document.getElementById('pin-modal');
  modal.classList.remove('open');
  pendingTabId = null;
}

function verifyPin() {
  const pinInput = document.getElementById('pin-input');
  const pinError = document.getElementById('pin-error');
  const enteredPin = pinInput.value;

  if (enteredPin === INTERVIEWER_PIN) {
    // PIN correct - unlock the tab
    if (pendingTabId && !unlockedTabs.includes(pendingTabId)) {
      unlockedTabs.push(pendingTabId);
    }
    closePinModal();

    // Now show the tab
    if (pendingTabId) {
      // Update tab buttons
      document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === pendingTabId);
      });

      // Update tab content
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === pendingTabId);
      });
    }

    showAlert('success', 'Access granted. Welcome, interviewer!');
  } else {
    // PIN incorrect - show error
    pinError.style.display = 'block';
    pinInput.value = '';
    pinInput.focus();

    // Shake animation
    pinInput.classList.add('shake');
    setTimeout(() => pinInput.classList.remove('shake'), 500);
  }
}

// Handle Enter key in PIN input
document.addEventListener('DOMContentLoaded', () => {
  const pinInput = document.getElementById('pin-input');
  if (pinInput) {
    pinInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        verifyPin();
      }
    });
  }
});

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

  // Shuffle options for each question so colors aren't always in same order
  const shuffledQuestions = questions.map(q => ({
    ...q,
    options: shuffleArray([...q.options])
  }));

  container.innerHTML = shuffledQuestions.map((q, index) => `
    <div class="question-card" data-question-id="${q.id}">
      <h4>Question ${index + 1} of ${questions.length}</h4>
      <p class="question-text">${q.text}</p>
      <div class="question-options">
        ${q.options.map((opt, optIndex) => `
          <label class="option-label">
            <input type="radio" name="q_${q.id}" value="${opt.value}" data-color="${opt.value}">
            <span class="option-letter">${String.fromCharCode(65 + optIndex)}</span>
            <span class="option-text">${opt.label}</span>
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
        // Build color scores object from spectrum
        const colorScores = {};
        data.candidateResults.colorSpectrum.forEach(c => {
          colorScores[c.name.toLowerCase()] = c.percentage;
        });

        await fetch(`${API_BASE}/sheets/assessments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidateName,
            candidateEmail,
            primaryColor: data.candidateResults.primaryColor.name,
            secondaryColor: data.candidateResults.secondaryColor.name,
            colorScores
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
  const report = data.candidateResults;
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
        ${report.colorSpectrum.map(colorData => `
          <div class="score-bar-item" style="margin: 12px 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-weight: 500;">${colorData.name}</span>
              <span>${colorData.percentage}%</span>
            </div>
            <div style="background: var(--gray-200); border-radius: 4px; height: 24px; overflow: hidden;">
              <div style="background: ${colorData.color}; height: 100%; width: ${colorData.percentage}%; transition: width 0.5s ease;"></div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="results-sections">
      <div class="results-section">
        <h4>What This Means For You</h4>
        <p style="margin-bottom: 12px;">As a <strong>${primary.name}</strong>, you naturally bring ${primary.tagline.toLowerCase().replace('the ', '')} qualities to your work.</p>
        <p>Your secondary <strong>${secondary.name}</strong> adds ${secondary.tagline.toLowerCase().replace('the ', '')} tendencies that complement your primary style.</p>
      </div>

      <div class="results-section">
        <h4>In Family Services Work</h4>
        <p>Your ${primary.name} nature means you'll likely excel at building trust with families through your natural approach. Your blend with ${secondary.name} gives you additional versatility.</p>
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
        <p><strong>Situation:</strong></p>
        <p style="margin-top: 8px; white-space: pre-line;">${scenario.situation}</p>
      </div>

      <div class="scenario-questions">
        ${scenario.questions.map((q, qIndex) => `
          <div class="scenario-question">
            <label for="scenario_${scenario.id}_q${qIndex + 1}">
              <strong>Question ${qIndex + 1}:</strong> ${q.text}
            </label>
            ${q.guidance ? `<p class="question-guidance"><em>Consider: ${q.guidance}</em></p>` : ''}
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
// Interview Questionnaire
// ===================================

let questionnaireData = null;

async function loadQuestionnaire() {
  try {
    const response = await fetch(`${API_BASE}/interview/templates/questions`);
    const data = await response.json();

    if (data.success) {
      questionnaireData = data.templates;
      renderQuestionnaire(data.templates);
    }
  } catch (error) {
    console.error('Failed to load questionnaire:', error);
  }
}

function renderQuestionnaire(templates) {
  const container = document.getElementById('questionnaire-container');

  if (!container) {
    console.warn('Questionnaire container not found - element may not exist in DOM');
    return;
  }

  const sections = [
    { id: 'opening', name: 'Opening Questions', description: 'First impressions and introduction', color: '#6366f1' },
    { id: 'experience', name: 'Experience Questions', description: 'Background and work history', color: '#0891b2' },
    { id: 'values', name: 'Values & Mission Fit', description: 'Alignment with Epworth core values', color: '#059669' },
    { id: 'closing', name: 'Closing Questions', description: 'Final assessment and next steps', color: '#7c3aed' }
  ];

  container.innerHTML = sections.map(section => {
    const questions = templates[section.id] || [];

    return `
      <div class="questionnaire-section" data-section="${section.id}">
        <div class="questionnaire-section-header" style="border-left: 4px solid ${section.color};">
          <h3 style="color: ${section.color};">${section.name}</h3>
          <p>${section.description}</p>
          <span class="question-count">${questions.length} questions</span>
        </div>

        <div class="questionnaire-questions">
          ${questions.map((q, index) => `
            <div class="questionnaire-item" data-question-id="${section.id}_q${index + 1}">
              <div class="questionnaire-item-header">
                <span class="question-number">${index + 1}</span>
                <p class="question-text">${q}</p>
              </div>

              <div class="questionnaire-rating">
                <span class="rating-label">Rating:</span>
                <div class="rating-buttons">
                  <label class="rating-btn concern">
                    <input type="radio" name="${section.id}_q${index + 1}_rating" value="1">
                    <span>1</span>
                    <small>Concern</small>
                  </label>
                  <label class="rating-btn adequate">
                    <input type="radio" name="${section.id}_q${index + 1}_rating" value="2">
                    <span>2</span>
                    <small>Adequate</small>
                  </label>
                  <label class="rating-btn strong">
                    <input type="radio" name="${section.id}_q${index + 1}_rating" value="3">
                    <span>3</span>
                    <small>Strong</small>
                  </label>
                  <label class="rating-btn skip">
                    <input type="radio" name="${section.id}_q${index + 1}_rating" value="0">
                    <span>-</span>
                    <small>Skip</small>
                  </label>
                </div>
              </div>

              <div class="questionnaire-notes">
                <label for="${section.id}_q${index + 1}_notes">Notes / Candidate Response Summary:</label>
                <textarea
                  id="${section.id}_q${index + 1}_notes"
                  rows="3"
                  placeholder="Capture key points from the candidate's answer..."
                ></textarea>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');

  // Add event listeners for rating button styling
  container.querySelectorAll('.rating-btn input').forEach(radio => {
    radio.addEventListener('change', function() {
      const ratingGroup = this.closest('.rating-buttons');
      ratingGroup.querySelectorAll('.rating-btn').forEach(btn => btn.classList.remove('selected'));
      this.closest('.rating-btn').classList.add('selected');
    });
  });
}

function calculateQuestionnaireSummary() {
  const candidateName = document.getElementById('questionnaire-candidate-name').value;

  if (!candidateName) {
    showAlert('warning', 'Please enter the candidate name');
    return;
  }

  const sections = ['opening', 'experience', 'values', 'closing'];
  const sectionNames = {
    opening: 'Opening',
    experience: 'Experience',
    values: 'Values',
    closing: 'Closing'
  };

  const results = {};
  let totalScore = 0;
  let totalQuestions = 0;

  sections.forEach(section => {
    const questions = document.querySelectorAll(`[data-section="${section}"] .questionnaire-item`);
    let sectionScore = 0;
    let sectionAnswered = 0;

    questions.forEach(item => {
      const rating = item.querySelector('input[type="radio"]:checked');
      if (rating && rating.value !== '0') {
        sectionScore += parseInt(rating.value);
        sectionAnswered++;
      }
    });

    results[section] = {
      name: sectionNames[section],
      answered: sectionAnswered,
      total: questions.length,
      score: sectionScore,
      average: sectionAnswered > 0 ? (sectionScore / sectionAnswered).toFixed(2) : 'N/A'
    };

    totalScore += sectionScore;
    totalQuestions += sectionAnswered;
  });

  const overallAverage = totalQuestions > 0 ? (totalScore / totalQuestions).toFixed(2) : 'N/A';
  const overallRating = totalQuestions > 0 ?
    (overallAverage >= 2.5 ? 'Strong' : overallAverage >= 1.5 ? 'Adequate' : 'Concern') : 'N/A';

  const container = document.getElementById('questionnaire-summary');
  container.innerHTML = `
    <h3>Interview Summary for ${candidateName}</h3>

    <div class="summary-overall" style="background: ${overallRating === 'Strong' ? '#dcfce7' : overallRating === 'Adequate' ? '#fef3c7' : overallRating === 'Concern' ? '#fee2e2' : '#f3f4f6'};
         border: 2px solid ${overallRating === 'Strong' ? '#22c55e' : overallRating === 'Adequate' ? '#f59e0b' : overallRating === 'Concern' ? '#ef4444' : '#9ca3af'};
         padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
      <div style="font-size: 3rem; font-weight: 700; color: ${overallRating === 'Strong' ? '#22c55e' : overallRating === 'Adequate' ? '#f59e0b' : overallRating === 'Concern' ? '#ef4444' : '#6b7280'};">
        ${overallAverage}
      </div>
      <div style="font-size: 1.25rem; font-weight: 600;">Overall Average: ${overallRating}</div>
      <div style="color: var(--gray-600); margin-top: 8px;">${totalQuestions} questions rated</div>
    </div>

    <div class="summary-sections" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
      ${sections.map(section => {
        const data = results[section];
        const rating = data.average !== 'N/A' ?
          (parseFloat(data.average) >= 2.5 ? 'Strong' : parseFloat(data.average) >= 1.5 ? 'Adequate' : 'Concern') : 'N/A';
        const color = rating === 'Strong' ? '#22c55e' : rating === 'Adequate' ? '#f59e0b' : rating === 'Concern' ? '#ef4444' : '#6b7280';

        return `
          <div class="summary-section-card" style="background: white; padding: 16px; border-radius: 8px; border-left: 4px solid ${color};">
            <h4 style="margin: 0 0 8px 0;">${data.name}</h4>
            <div style="font-size: 1.5rem; font-weight: 700; color: ${color};">${data.average}</div>
            <div style="font-size: 0.875rem; color: var(--gray-500);">${data.answered}/${data.total} rated</div>
            <div style="font-size: 0.75rem; color: ${color}; font-weight: 500; margin-top: 4px;">${rating}</div>
          </div>
        `;
      }).join('')}
    </div>

    <div style="margin-top: 20px; padding: 16px; background: var(--gray-50); border-radius: 8px;">
      <p style="margin: 0; font-size: 0.875rem; color: var(--gray-600);">
        <strong>Note:</strong> This is a preview summary. Submit the questionnaire to save all responses and notes to Google Sheets.
      </p>
    </div>
  `;

  container.style.display = 'block';
  container.scrollIntoView({ behavior: 'smooth' });
}

async function submitQuestionnaire() {
  const candidateName = document.getElementById('questionnaire-candidate-name').value;
  const interviewerName = document.getElementById('questionnaire-interviewer-name').value;
  const position = document.getElementById('questionnaire-position').value;

  if (!candidateName || !interviewerName) {
    showAlert('warning', 'Please enter candidate and interviewer names');
    return;
  }

  // Collect all responses
  const sections = ['opening', 'experience', 'values', 'closing'];
  const responses = {};
  let totalScore = 0;
  let totalQuestions = 0;

  sections.forEach(section => {
    responses[section] = [];
    const questions = document.querySelectorAll(`[data-section="${section}"] .questionnaire-item`);

    questions.forEach((item, index) => {
      const rating = item.querySelector('input[type="radio"]:checked');
      const notes = item.querySelector('textarea').value.trim();
      const questionText = item.querySelector('.question-text').textContent;

      const ratingValue = rating ? parseInt(rating.value) : null;

      if (ratingValue && ratingValue > 0) {
        totalScore += ratingValue;
        totalQuestions++;
      }

      responses[section].push({
        questionNumber: index + 1,
        question: questionText,
        rating: ratingValue,
        notes: notes
      });
    });
  });

  const overallAverage = totalQuestions > 0 ? (totalScore / totalQuestions) : 0;

  try {
    // Save to Google Sheets
    await fetch(`${API_BASE}/sheets/interviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateName,
        interviewerName,
        overallScore: Math.round(overallAverage * 3.33), // Convert to 1-10 scale
        recommendation: overallAverage >= 2.5 ? 'yes' : overallAverage >= 1.5 ? 'maybe' : 'no',
        sectionScores: {
          opening: { average: calculateSectionAverage(responses.opening) },
          experience: { average: calculateSectionAverage(responses.experience) },
          values: { average: calculateSectionAverage(responses.values) },
          closing: { average: calculateSectionAverage(responses.closing) }
        },
        notes: `Interview questionnaire completed. Overall average: ${overallAverage.toFixed(2)}/3`
      })
    });

    showAlert('success', 'Questionnaire submitted successfully!');

    // Show success modal
    showModal(`
      <h3>Questionnaire Submitted</h3>
      <p><strong>Candidate:</strong> ${candidateName}</p>
      <p><strong>Interviewer:</strong> ${interviewerName}</p>
      <p><strong>Position:</strong> ${position}</p>
      <p><strong>Overall Average:</strong> ${overallAverage.toFixed(2)}/3</p>
      <p><strong>Questions Rated:</strong> ${totalQuestions}</p>
      <p style="margin-top: 16px; color: var(--gray-600);">
        The questionnaire has been saved. You can now proceed to the Evaluation tab for final decision.
      </p>
      <button class="btn-primary" style="margin-top: 16px;" onclick="closeModal(); showTab('interview');">
        Go to Evaluation
      </button>
    `);
  } catch (error) {
    console.error('Questionnaire submission failed:', error);
    showAlert('error', 'Failed to submit questionnaire');
  }
}

function calculateSectionAverage(sectionResponses) {
  const rated = sectionResponses.filter(r => r.rating && r.rating > 0);
  if (rated.length === 0) return 0;
  const total = rated.reduce((sum, r) => sum + r.rating, 0);
  return (total / rated.length).toFixed(2);
}

function resetQuestionnaire() {
  document.getElementById('questionnaire-candidate-name').value = '';
  document.getElementById('questionnaire-interviewer-name').value = '';
  document.getElementById('questionnaire-position').value = 'Family Life Specialist';

  document.querySelectorAll('#questionnaire-container input[type="radio"]').forEach(radio => {
    radio.checked = false;
  });

  document.querySelectorAll('#questionnaire-container textarea').forEach(textarea => {
    textarea.value = '';
  });

  document.querySelectorAll('.rating-btn').forEach(btn => {
    btn.classList.remove('selected');
  });

  document.getElementById('questionnaire-summary').style.display = 'none';
}

// ===================================
// Utilities
// ===================================

// Fisher-Yates shuffle for randomizing options
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

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
