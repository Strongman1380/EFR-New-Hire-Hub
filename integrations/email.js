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

// Check if email is configured
function isEmailConfigured() {
  return !!(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.NOTIFICATION_EMAIL);
}

module.exports = {
  sendAssessmentNotification,
  sendScenarioNotification,
  sendInterviewNotification,
  isEmailConfigured
};
