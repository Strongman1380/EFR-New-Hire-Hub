/**
 * Email Integration
 * Sends notifications when candidates submit assessments/scenarios
 */

const nodemailer = require('nodemailer');

// Create transporter based on environment config
function createTransporter() {
  // Check if email is configured
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

// Format color for display
function getColorEmoji(color) {
  const emojis = {
    gold: '🟡',
    green: '🟢',
    orange: '🟠',
    blue: '🔵'
  };
  return emojis[color.toLowerCase()] || '⚪';
}

// Send True Colors Assessment notification
async function sendAssessmentNotification(data) {
  const transporter = createTransporter();
  if (!transporter) {
    console.log('Email not configured - skipping notification');
    return { sent: false, reason: 'Email not configured' };
  }

  const { candidate, candidateResults, interviewerReport, assessmentId, timestamp } = data;
  const primary = candidateResults.primaryColor;
  const secondary = candidateResults.secondaryColor;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6b46c1, #553c9a); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f7fafc; padding: 20px; border: 1px solid #e2e8f0; }
        .color-box { padding: 15px; border-radius: 8px; margin: 10px 0; }
        .primary { background: ${primary.color}20; border-left: 4px solid ${primary.color}; }
        .secondary { background: ${secondary.color}15; border-left: 4px solid ${secondary.color}; }
        .section { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .score-bar { background: #e2e8f0; border-radius: 4px; height: 20px; margin: 5px 0; }
        .score-fill { height: 100%; border-radius: 4px; }
        h1 { margin: 0; }
        h2 { color: #6b46c1; }
        .footer { text-align: center; padding: 20px; color: #718096; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎨 New True Colors Assessment</h1>
          <p>A candidate has completed the personality assessment</p>
        </div>

        <div class="content">
          <h2>Candidate Information</h2>
          <p><strong>Name:</strong> ${candidate.name}</p>
          <p><strong>Email:</strong> ${candidate.email || 'Not provided'}</p>
          <p><strong>Submitted:</strong> ${new Date(timestamp).toLocaleString()}</p>
          <p><strong>Assessment ID:</strong> ${assessmentId}</p>

          <h2>Results Summary</h2>

          <div class="color-box primary">
            <h3>${getColorEmoji(primary.name)} Primary: ${primary.name}</h3>
            <p><strong>${primary.tagline}</strong></p>
            <p>${primary.description}</p>
          </div>

          <div class="color-box secondary">
            <h3>${getColorEmoji(secondary.name)} Secondary: ${secondary.name}</h3>
            <p><strong>${secondary.tagline}</strong></p>
          </div>

          <div class="section">
            <h3>Color Distribution</h3>
            ${candidateResults.colorSpectrum.map(c => `
              <div style="margin: 8px 0;">
                <div style="display: flex; justify-content: space-between;">
                  <span>${getColorEmoji(c.name)} ${c.name}</span>
                  <span><strong>${c.percentage}%</strong></span>
                </div>
                <div class="score-bar">
                  <div class="score-fill" style="width: ${c.percentage}%; background: ${c.color};"></div>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="section">
            <h3>Family Services Fit</h3>
            <h4>Strengths:</h4>
            <ul>
              ${interviewerReport.familyServicesProfile.strengths.map(s => `<li>${s}</li>`).join('')}
            </ul>
            <h4>Growth Areas:</h4>
            <ul>
              ${interviewerReport.familyServicesProfile.growthAreas.map(g => `<li>${g}</li>`).join('')}
            </ul>
          </div>

          <div class="section">
            <h3>Supervision Recommendations</h3>
            <ul>
              ${interviewerReport.supervisionRecommendations.primaryRecommendations.map(r => `<li>${r}</li>`).join('')}
            </ul>
            <p><em>${interviewerReport.supervisionRecommendations.blendedApproach}</em></p>
          </div>

          <div class="section">
            <h3>Team Dynamics</h3>
            <p><strong>Works well with:</strong> ${interviewerReport.teamDynamics.worksWellWith}</p>
            <p><strong>Potential friction:</strong> ${interviewerReport.teamDynamics.potentialFriction}</p>
            <p><strong>Team contribution:</strong> ${interviewerReport.teamDynamics.contribution}</p>
          </div>
        </div>

        <div class="footer">
          <p>Epworth Family Resources Interview Assistant</p>
          <p>This is an automated notification. View full details in your Google Sheet.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"Epworth Interview Assistant" <${process.env.EMAIL_USER}>`,
      to: process.env.NOTIFICATION_EMAIL,
      subject: `🎨 True Colors Assessment: ${candidate.name} - Primary ${primary.name}`,
      html: htmlContent
    });

    console.log(`Assessment notification sent for ${candidate.name}`);
    return { sent: true };
  } catch (error) {
    console.error('Failed to send assessment email:', error);
    return { sent: false, error: error.message };
  }
}

// Send Scenario submission notification
async function sendScenarioNotification(data) {
  const transporter = createTransporter();
  if (!transporter) {
    console.log('Email not configured - skipping notification');
    return { sent: false, reason: 'Email not configured' };
  }

  const { candidateName, candidateEmail, submissionId, submittedAt, responses, scenarios } = data;

  // Build response summary
  let responseHtml = '';
  if (scenarios && responses) {
    scenarios.forEach(scenario => {
      const scenarioResponses = responses[scenario.id] || {};
      responseHtml += `
        <div class="section">
          <h3>${scenario.title}</h3>
          <p><em>${scenario.category}</em></p>
          <p><strong>Context:</strong> ${scenario.context}</p>
          ${scenario.questions.map((q, i) => `
            <div style="margin: 15px 0; padding: 10px; background: #f7fafc; border-radius: 4px;">
              <p><strong>Q${i + 1}:</strong> ${q.question}</p>
              <p style="white-space: pre-wrap; background: white; padding: 10px; border-radius: 4px; border: 1px solid #e2e8f0;">
                ${scenarioResponses[`q${i + 1}`] || '<em>No response</em>'}
              </p>
            </div>
          `).join('')}
        </div>
      `;
    });
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6b46c1, #553c9a); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f7fafc; padding: 20px; border: 1px solid #e2e8f0; }
        .section { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #9f7aea; }
        h1 { margin: 0; }
        h2 { color: #6b46c1; }
        .footer { text-align: center; padding: 20px; color: #718096; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 New Scenario Submission</h1>
          <p>A candidate has completed the in-home scenarios</p>
        </div>

        <div class="content">
          <h2>Candidate Information</h2>
          <p><strong>Name:</strong> ${candidateName}</p>
          <p><strong>Email:</strong> ${candidateEmail || 'Not provided'}</p>
          <p><strong>Submitted:</strong> ${new Date(submittedAt).toLocaleString()}</p>
          <p><strong>Submission ID:</strong> ${submissionId}</p>

          <h2>Scenario Responses</h2>
          ${responseHtml}
        </div>

        <div class="footer">
          <p>Epworth Family Resources Interview Assistant</p>
          <p>Review responses during the interview to discuss their thinking.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"Epworth Interview Assistant" <${process.env.EMAIL_USER}>`,
      to: process.env.NOTIFICATION_EMAIL,
      subject: `📋 Scenario Submission: ${candidateName}`,
      html: htmlContent
    });

    console.log(`Scenario notification sent for ${candidateName}`);
    return { sent: true };
  } catch (error) {
    console.error('Failed to send scenario email:', error);
    return { sent: false, error: error.message };
  }
}

// Send Interview Evaluation notification
async function sendInterviewNotification(data) {
  const transporter = createTransporter();
  if (!transporter) {
    console.log('Email not configured - skipping notification');
    return { sent: false, reason: 'Email not configured' };
  }

  const { candidateInfo, decision, report } = data;

  const recommendationColors = {
    'strong_yes': '#38a169',
    'yes': '#68d391',
    'maybe': '#d69e2e',
    'no': '#e53e3e',
    'strong_no': '#c53030'
  };

  const recommendationEmojis = {
    'strong_yes': '✅',
    'yes': '👍',
    'maybe': '🤔',
    'no': '👎',
    'strong_no': '❌'
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6b46c1, #553c9a); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f7fafc; padding: 20px; border: 1px solid #e2e8f0; }
        .recommendation { padding: 20px; border-radius: 8px; text-align: center; margin: 15px 0; }
        .section { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .flags { display: flex; gap: 20px; }
        .flag-column { flex: 1; }
        .green-flag { color: #38a169; }
        .red-flag { color: #e53e3e; }
        h1 { margin: 0; }
        h2 { color: #6b46c1; }
        .footer { text-align: center; padding: 20px; color: #718096; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📝 Interview Evaluation Complete</h1>
          <p>An interviewer has submitted their evaluation</p>
        </div>

        <div class="content">
          <h2>Interview Details</h2>
          <p><strong>Candidate:</strong> ${candidateInfo.name}</p>
          <p><strong>Position:</strong> ${candidateInfo.position}</p>
          <p><strong>Interviewer:</strong> ${candidateInfo.interviewer}</p>

          <div class="recommendation" style="background: ${recommendationColors[decision.recommendation] || '#718096'}20; border: 2px solid ${recommendationColors[decision.recommendation] || '#718096'};">
            <h2 style="margin: 0; color: ${recommendationColors[decision.recommendation] || '#718096'};">
              ${recommendationEmojis[decision.recommendation] || '❓'} ${decision.recommendation.replace('_', ' ').toUpperCase()}
            </h2>
            <p style="font-size: 2rem; margin: 10px 0;"><strong>${decision.overallScore}/10</strong></p>
          </div>

          <div class="section">
            <h3>Rationale</h3>
            <p>${decision.rationale}</p>
          </div>

          <div class="section">
            <h3>Observed Indicators</h3>
            <div class="flags">
              <div class="flag-column">
                <h4 class="green-flag">✅ Green Flags</h4>
                <ul>
                  ${(decision.greenFlags || []).map(f => `<li>${f}</li>`).join('') || '<li>None noted</li>'}
                </ul>
              </div>
              <div class="flag-column">
                <h4 class="red-flag">⚠️ Red Flags</h4>
                <ul>
                  ${(decision.redFlags || []).map(f => `<li>${f}</li>`).join('') || '<li>None noted</li>'}
                </ul>
              </div>
            </div>
          </div>

          ${report && report.recommendation ? `
          <div class="section">
            <h3>System Analysis</h3>
            <p><strong>Recommendation:</strong> ${report.recommendation.recommendation}</p>
            <p><strong>Confidence:</strong> ${report.recommendation.confidence}</p>
            <p>${report.recommendation.rationale}</p>
          </div>
          ` : ''}
        </div>

        <div class="footer">
          <p>Epworth Family Resources Interview Assistant</p>
          <p>View full details in your Google Sheet.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"Epworth Interview Assistant" <${process.env.EMAIL_USER}>`,
      to: process.env.NOTIFICATION_EMAIL,
      subject: `📝 Interview: ${candidateInfo.name} - ${recommendationEmojis[decision.recommendation] || ''} ${decision.recommendation.replace('_', ' ').toUpperCase()} (${decision.overallScore}/10)`,
      html: htmlContent
    });

    console.log(`Interview notification sent for ${candidateInfo.name}`);
    return { sent: true };
  } catch (error) {
    console.error('Failed to send interview email:', error);
    return { sent: false, error: error.message };
  }
}

// Send Employee Review notification
async function sendReviewNotification(data) {
  const transporter = createTransporter();
  if (!transporter) {
    console.log('Email not configured - skipping notification');
    return { sent: false, reason: 'Email not configured' };
  }

  const {
    employeeName,
    dateOfHire,
    reviewDate,
    department,
    supervisor,
    reviewType,
    ratings,
    comments,
    summary,
    submittedAt
  } = data;

  // Format review type for display
  const reviewTypeLabels = {
    '6-month': '6 Month Initial Review',
    '12-month': '12 Month Evaluation',
    'annual': 'Annual Review'
  };

  // Calculate section averages
  const perfValues = Object.values(ratings.performance).filter(v => v !== null);
  const perfAvg = perfValues.length > 0 ? (perfValues.reduce((a, b) => a + b, 0) / perfValues.length).toFixed(2) : 'N/A';

  const relValues = Object.values(ratings.relationship).filter(v => v !== null);
  const relAvg = relValues.length > 0 ? (relValues.reduce((a, b) => a + b, 0) / relValues.length).toFixed(2) : 'N/A';

  const govValues = Object.values(ratings.governance).filter(v => v !== null);
  const govAvg = govValues.length > 0 ? (govValues.reduce((a, b) => a + b, 0) / govValues.length).toFixed(2) : 'N/A';

  // Get rating color
  function getRatingColor(value) {
    if (value >= 4.5) return '#059669';
    if (value >= 3.5) return '#22c55e';
    if (value >= 2.5) return '#eab308';
    if (value >= 1.5) return '#f97316';
    return '#ef4444';
  }

  // Get rating label
  function getRatingLabel(value) {
    if (value === 5) return 'Significant Strength';
    if (value === 4) return 'Strength';
    if (value === 3) return 'Acceptable';
    if (value === 2) return 'Needs Development';
    if (value === 1) return 'Needs Significant Development';
    return 'Not Rated';
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1a365d, #2c5282); color: white; padding: 24px; border-radius: 8px 8px 0 0; }
        .content { background: #f7fafc; padding: 24px; border: 1px solid #e2e8f0; }
        .section { background: white; padding: 20px; border-radius: 8px; margin: 16px 0; border: 1px solid #e2e8f0; }
        .summary-box { background: linear-gradient(135deg, #1a365d, #2c5282); color: white; padding: 24px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .summary-grid { display: flex; justify-content: center; gap: 30px; margin-top: 16px; }
        .summary-item { text-align: center; }
        .summary-value { font-size: 2rem; font-weight: bold; }
        .summary-label { font-size: 0.75rem; opacity: 0.8; text-transform: uppercase; }
        .rating-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        .rating-row:last-child { border-bottom: none; }
        .rating-value { font-weight: bold; padding: 2px 8px; border-radius: 4px; color: white; }
        .bonus-badge { background: #fcd34d; color: #1a365d; padding: 8px 16px; border-radius: 20px; font-weight: bold; display: inline-block; margin-top: 12px; }
        h1 { margin: 0; }
        h2 { color: #1a365d; border-bottom: 2px solid #3182ce; padding-bottom: 8px; }
        h3 { color: #2c5282; margin-bottom: 12px; }
        .footer { text-align: center; padding: 20px; color: #718096; font-size: 12px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .info-item { padding: 8px 0; }
        .info-label { font-size: 0.75rem; color: #718096; text-transform: uppercase; }
        .info-value { font-weight: 500; }
        .comment-box { background: #f7fafc; padding: 12px; border-radius: 6px; border-left: 3px solid #3182ce; margin: 8px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Employee Performance Review</h1>
          <p>${reviewTypeLabels[reviewType] || reviewType}</p>
        </div>

        <div class="content">
          <!-- Summary Box -->
          <div class="summary-box">
            <h2 style="color: white; border: none; margin: 0 0 8px 0;">Review Summary</h2>
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-value">${summary.totalPoints}</div>
                <div class="summary-label">Total Points (of 75)</div>
              </div>
              <div class="summary-item">
                <div class="summary-value">${summary.average}</div>
                <div class="summary-label">Average Rating (of 5.0)</div>
              </div>
            </div>
            ${reviewType === '12-month' && summary.bonusEligible ? `
              <div class="bonus-badge">Bonus: ${summary.bonusAmount}</div>
            ` : ''}
          </div>

          <!-- Employee Information -->
          <div class="section">
            <h3>Employee Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Employee Name</div>
                <div class="info-value">${employeeName}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Department</div>
                <div class="info-value">${department || 'Not specified'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Date of Hire</div>
                <div class="info-value">${dateOfHire ? new Date(dateOfHire).toLocaleDateString() : 'Not specified'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Review Date</div>
                <div class="info-value">${new Date(reviewDate).toLocaleDateString()}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Supervisor</div>
                <div class="info-value">${supervisor}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Review Type</div>
                <div class="info-value">${reviewTypeLabels[reviewType] || reviewType}</div>
              </div>
            </div>
          </div>

          <!-- Job Performance -->
          <div class="section">
            <h3>Job Performance (Avg: ${perfAvg})</h3>
            ${Object.entries(ratings.performance).map(([key, value]) => `
              <div class="rating-row">
                <span>${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                <span class="rating-value" style="background: ${value ? getRatingColor(value) : '#9ca3af'};">
                  ${value || '-'} ${value ? `- ${getRatingLabel(value)}` : ''}
                </span>
              </div>
            `).join('')}
          </div>

          <!-- Relationship -->
          <div class="section">
            <h3>Relationship (Avg: ${relAvg})</h3>
            ${Object.entries(ratings.relationship).map(([key, value]) => `
              <div class="rating-row">
                <span>${key.charAt(0).toUpperCase() + key.slice(1)}</span>
                <span class="rating-value" style="background: ${value ? getRatingColor(value) : '#9ca3af'};">
                  ${value || '-'} ${value ? `- ${getRatingLabel(value)}` : ''}
                </span>
              </div>
            `).join('')}
          </div>

          <!-- Governance & Compliance -->
          <div class="section">
            <h3>Governance & Compliance (Avg: ${govAvg})</h3>
            ${Object.entries(ratings.governance).map(([key, value]) => `
              <div class="rating-row">
                <span>${key.charAt(0).toUpperCase() + key.slice(1)}</span>
                <span class="rating-value" style="background: ${value ? getRatingColor(value) : '#9ca3af'};">
                  ${value || '-'} ${value ? `- ${getRatingLabel(value)}` : ''}
                </span>
              </div>
            `).join('')}
          </div>

          <!-- Comments -->
          ${(comments.strengths || comments.improvements || comments.goals) ? `
          <div class="section">
            <h3>Comments & Goals</h3>
            ${comments.strengths ? `
              <div style="margin-bottom: 16px;">
                <strong>Strengths & Accomplishments:</strong>
                <div class="comment-box">${comments.strengths}</div>
              </div>
            ` : ''}
            ${comments.improvements ? `
              <div style="margin-bottom: 16px;">
                <strong>Areas for Improvement:</strong>
                <div class="comment-box">${comments.improvements}</div>
              </div>
            ` : ''}
            ${comments.goals ? `
              <div>
                <strong>Goals for Next Review Period:</strong>
                <div class="comment-box">${comments.goals}</div>
              </div>
            ` : ''}
          </div>
          ` : ''}
        </div>

        <div class="footer">
          <p>Epworth Family Resources | Employee Performance Review</p>
          <p>Submitted: ${new Date(submittedAt).toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"Epworth HR System" <${process.env.EMAIL_USER}>`,
      to: process.env.NOTIFICATION_EMAIL,
      subject: `Employee Review: ${employeeName} - ${reviewTypeLabels[reviewType] || reviewType} (${summary.average}/5.0)`,
      html: htmlContent
    });

    console.log(`Review notification sent for ${employeeName}`);
    return { sent: true };
  } catch (error) {
    console.error('Failed to send review email:', error);
    return { sent: false, error: error.message };
  }
}

// Check if email is configured
function isEmailConfigured() {
  return !!(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.NOTIFICATION_EMAIL);
}

module.exports = {
  sendAssessmentNotification,
  sendScenarioNotification,
  sendInterviewNotification,
  sendReviewNotification,
  isEmailConfigured
};
