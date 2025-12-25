/**
 * Google Apps Script for Epworth Village Integrated Assistant
 * 
 * This script handles:
 * 1. Form submissions processing
 * 2. Automatic scoring logic
 * 3. Spreadsheet updates
 * 4. Email notifications
 * 
 * To use:
 * 1. Open Google Sheets
 * 2. Go to Extensions > Apps Script
 * 3. Paste this code
 * 4. Set up triggers for form submissions
 */

// Configuration
const CONFIG = {
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE',
  NOTIFICATION_EMAIL: 'hr@epworthvillage.org',
  SHEETS: {
    CANDIDATES: 'Candidates',
    ASSESSMENTS: 'Personality Assessments',
    INTERVIEWS: 'Interview Evaluations',
    DECISIONS: 'Hiring Decisions'
  }
};

// Dimension definitions for scoring
const DIMENSIONS = {
  A: { odd: 'People-Focused', even: 'Task-Focused' },
  B: { odd: 'Structure', even: 'Flexibility' },
  C: { odd: 'Independent', even: 'Collaborative' },
  D: { odd: 'Stability', even: 'Innovation' },
  E: { odd: 'Harmony', even: 'Truth/Challenge' },
  F: { odd: 'Internal Stress', even: 'External Support' }
};

// Archetype patterns
const ARCHETYPES = {
  'Relationship Builder': { A: 'odd', B: 'even', C: 'even', E: 'odd' },
  'Thoughtful Organizer': { A: 'even', B: 'odd', C: 'odd', E: 'even' },
  'Adaptive Connector': { A: 'balanced', B: 'even', C: 'even', D: 'even' },
  'Careful Listener': { A: 'odd', D: 'odd', E: 'odd', F: 'odd' }
};

/**
 * Main entry point for form submission
 * Set this as a trigger for form submissions
 */
function onFormSubmit(e) {
  const formType = e.namedValues['Form Type']?.[0] || detectFormType(e);
  
  switch(formType) {
    case 'Assessment':
      processAssessmentForm(e);
      break;
    case 'Interview':
      processInterviewForm(e);
      break;
    case 'Candidate':
      processCandidateForm(e);
      break;
    default:
      Logger.log('Unknown form type: ' + formType);
  }
}

/**
 * Detect form type based on questions present
 */
function detectFormType(e) {
  const questions = Object.keys(e.namedValues);
  
  if (questions.some(q => q.includes('Dimension') || q.includes('A1') || q.includes('archetype'))) {
    return 'Assessment';
  }
  if (questions.some(q => q.includes('Interview') || q.includes('Scenario') || q.includes('Red Flag'))) {
    return 'Interview';
  }
  return 'Candidate';
}

/**
 * Process personality assessment form submission
 */
function processAssessmentForm(e) {
  const responses = e.namedValues;
  const candidateName = responses['Candidate Name']?.[0] || responses['Name']?.[0] || 'Unknown';
  const candidateEmail = responses['Email']?.[0] || '';
  
  // Calculate dimension scores
  const dimensionScores = calculateDimensionScores(responses);
  
  // Match to archetype
  const archetypeMatch = matchArchetype(dimensionScores);
  
  // Prepare data for spreadsheet
  const timestamp = new Date().toISOString();
  const assessmentId = 'ASM-' + Date.now();
  
  const rowData = [
    assessmentId,
    timestamp,
    candidateName,
    candidateEmail,
    archetypeMatch.primary,
    archetypeMatch.confidence + '%',
    formatDimensionScores(dimensionScores),
    archetypeMatch.secondary || ''
  ];
  
  // Append to spreadsheet
  const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
    .getSheetByName(CONFIG.SHEETS.ASSESSMENTS);
  
  if (sheet) {
    sheet.appendRow(rowData);
  }
  
  // Send notification email
  sendAssessmentNotification(candidateName, archetypeMatch, dimensionScores);
  
  Logger.log('Assessment processed for: ' + candidateName);
}

/**
 * Calculate dimension scores from form responses
 */
function calculateDimensionScores(responses) {
  const scores = {};
  
  Object.keys(DIMENSIONS).forEach(dim => {
    let oddCount = 0;
    let evenCount = 0;
    let total = 0;
    
    // Look for questions matching this dimension (e.g., A1, A2, A3, A4)
    for (let i = 1; i <= 4; i++) {
      const questionKey = dim + i;
      const response = responses[questionKey]?.[0];
      
      if (response) {
        total++;
        // Assume response value of 1 = odd trait, 2 = even trait
        if (parseInt(response) % 2 === 1) {
          oddCount++;
        } else {
          evenCount++;
        }
      }
    }
    
    scores[dim] = {
      odd: oddCount,
      even: evenCount,
      total: total,
      tendency: oddCount > evenCount ? 'odd' : evenCount > oddCount ? 'even' : 'balanced',
      strength: Math.abs(oddCount - evenCount) >= 2 ? 'strong' : 'moderate'
    };
  });
  
  return scores;
}

/**
 * Match dimension scores to archetype
 */
function matchArchetype(dimensionScores) {
  let bestMatch = { primary: null, confidence: 0, secondary: null };
  const scores = [];
  
  Object.entries(ARCHETYPES).forEach(([name, pattern]) => {
    let matchScore = 0;
    let totalPoints = Object.keys(pattern).length;
    
    Object.entries(pattern).forEach(([dim, expectedTendency]) => {
      const score = dimensionScores[dim];
      if (!score) return;
      
      if (expectedTendency === 'balanced' && score.tendency === 'balanced') {
        matchScore += 1;
      } else if (score.tendency === expectedTendency) {
        matchScore += score.strength === 'strong' ? 1 : 0.75;
      } else if (score.tendency === 'balanced') {
        matchScore += 0.5;
      }
    });
    
    const confidence = Math.round((matchScore / totalPoints) * 100);
    scores.push({ name, confidence });
  });
  
  // Sort by confidence
  scores.sort((a, b) => b.confidence - a.confidence);
  
  return {
    primary: scores[0]?.name || 'Unknown',
    confidence: scores[0]?.confidence || 0,
    secondary: scores[1]?.name || null
  };
}

/**
 * Format dimension scores for spreadsheet
 */
function formatDimensionScores(scores) {
  return Object.entries(scores)
    .map(([dim, score]) => `${dim}:${score.tendency}(${score.strength})`)
    .join('; ');
}

/**
 * Process interview evaluation form submission
 */
function processInterviewForm(e) {
  const responses = e.namedValues;
  const candidateName = responses['Candidate Name']?.[0] || 'Unknown';
  const interviewerName = responses['Interviewer Name']?.[0] || '';
  const overallScore = parseInt(responses['Overall Score']?.[0]) || 0;
  const recommendation = responses['Recommendation']?.[0] || '';
  
  // Collect red and green flags
  const redFlags = [];
  const greenFlags = [];
  
  Object.keys(responses).forEach(key => {
    if (key.includes('Red Flag')) {
      redFlags.push(...responses[key].filter(v => v));
    }
    if (key.includes('Green Flag')) {
      greenFlags.push(...responses[key].filter(v => v));
    }
  });
  
  // Calculate section scores
  const sectionScores = calculateSectionScores(responses);
  
  // Calculate recommendation based on framework
  const calculatedDecision = calculateHiringDecision(overallScore, redFlags.length, greenFlags.length);
  
  // Prepare data for spreadsheet
  const timestamp = new Date().toISOString();
  const evaluationId = 'EVAL-' + Date.now();
  
  const rowData = [
    evaluationId,
    timestamp,
    candidateName,
    interviewerName,
    overallScore,
    recommendation || calculatedDecision.recommendation,
    formatSectionScores(sectionScores),
    redFlags.join(', '),
    greenFlags.join(', '),
    responses['Notes']?.[0] || '',
    new Date().toLocaleDateString()
  ];
  
  // Append to spreadsheet
  const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
    .getSheetByName(CONFIG.SHEETS.INTERVIEWS);
  
  if (sheet) {
    sheet.appendRow(rowData);
  }
  
  // Send notification
  sendInterviewNotification(candidateName, overallScore, calculatedDecision);
  
  Logger.log('Interview evaluation processed for: ' + candidateName);
}

/**
 * Calculate section scores from interview responses
 */
function calculateSectionScores(responses) {
  const sections = {
    'Interview Reflection': ['IR1', 'IR2', 'IR3', 'IR4'],
    'Scenario Thinking': ['ST1', 'ST2', 'ST3'],
    'Self Assessment': ['SA2', 'SA5'],
    'Values Alignment': ['VA1', 'VA2', 'VA3', 'VA4'],
    'Team Support': ['TS1']
  };
  
  const scores = {};
  
  Object.entries(sections).forEach(([sectionName, questionIds]) => {
    let total = 0;
    let count = 0;
    
    questionIds.forEach(qId => {
      const response = responses[qId]?.[0];
      if (response && !isNaN(parseInt(response))) {
        total += parseInt(response);
        count++;
      }
    });
    
    if (count > 0) {
      scores[sectionName] = Math.round((total / count) * 100) / 100;
    }
  });
  
  return scores;
}

/**
 * Format section scores for spreadsheet
 */
function formatSectionScores(scores) {
  return Object.entries(scores)
    .map(([section, score]) => `${section}:${score}`)
    .join('; ');
}

/**
 * Calculate hiring decision based on framework
 */
function calculateHiringDecision(overallScore, redFlagsCount, greenFlagsCount) {
  if (overallScore >= 8 && greenFlagsCount >= 4 && redFlagsCount <= 1) {
    return {
      recommendation: 'OFFER',
      confidence: 'high',
      rationale: 'Strong score with multiple green flags'
    };
  }
  
  if (overallScore >= 6 && overallScore <= 7) {
    return {
      recommendation: 'MAYBE',
      confidence: 'medium',
      rationale: 'Moderate score - reference check needed'
    };
  }
  
  if (overallScore < 5 || redFlagsCount >= 3) {
    return {
      recommendation: 'NO',
      confidence: 'high',
      rationale: 'Low score or significant concerns'
    };
  }
  
  return {
    recommendation: 'MAYBE',
    confidence: 'low',
    rationale: 'Mixed results - additional review needed'
  };
}

/**
 * Process new candidate form submission
 */
function processCandidateForm(e) {
  const responses = e.namedValues;
  
  const timestamp = new Date().toISOString();
  const candidateId = 'CAN-' + Date.now();
  
  const rowData = [
    candidateId,
    timestamp,
    responses['Name']?.[0] || '',
    responses['Email']?.[0] || '',
    responses['Phone']?.[0] || '',
    responses['Position']?.[0] || '',
    responses['Source']?.[0] || '',
    responses['Notes']?.[0] || ''
  ];
  
  const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
    .getSheetByName(CONFIG.SHEETS.CANDIDATES);
  
  if (sheet) {
    sheet.appendRow(rowData);
  }
  
  Logger.log('Candidate added: ' + rowData[2]);
}

/**
 * Send assessment notification email
 */
function sendAssessmentNotification(candidateName, archetypeMatch, dimensionScores) {
  const subject = `[Epworth] Assessment Complete: ${candidateName}`;
  
  let body = `Personality Assessment Results\n\n`;
  body += `Candidate: ${candidateName}\n`;
  body += `Primary Archetype: ${archetypeMatch.primary} (${archetypeMatch.confidence}% match)\n`;
  body += `Secondary Archetype: ${archetypeMatch.secondary || 'N/A'}\n\n`;
  body += `Dimension Profile:\n`;
  
  Object.entries(dimensionScores).forEach(([dim, score]) => {
    const label = score.tendency === 'odd' ? DIMENSIONS[dim].odd : 
                  score.tendency === 'even' ? DIMENSIONS[dim].even : 'Balanced';
    body += `  ${dim}: ${label} (${score.strength})\n`;
  });
  
  body += `\n---\nEpworth Village Integrated Assistant`;
  
  try {
    MailApp.sendEmail(CONFIG.NOTIFICATION_EMAIL, subject, body);
  } catch (e) {
    Logger.log('Failed to send email: ' + e.message);
  }
}

/**
 * Send interview notification email
 */
function sendInterviewNotification(candidateName, overallScore, decision) {
  const subject = `[Epworth] Interview Complete: ${candidateName} - ${decision.recommendation}`;
  
  let body = `Interview Evaluation Results\n\n`;
  body += `Candidate: ${candidateName}\n`;
  body += `Overall Score: ${overallScore}/10\n`;
  body += `Recommendation: ${decision.recommendation}\n`;
  body += `Confidence: ${decision.confidence}\n`;
  body += `Rationale: ${decision.rationale}\n`;
  body += `\n---\nEpworth Village Integrated Assistant`;
  
  try {
    MailApp.sendEmail(CONFIG.NOTIFICATION_EMAIL, subject, body);
  } catch (e) {
    Logger.log('Failed to send email: ' + e.message);
  }
}

/**
 * Initialize spreadsheet with required sheets and headers
 * Run this once to set up the spreadsheet
 */
function initializeSpreadsheet() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  
  const sheetConfigs = {
    [CONFIG.SHEETS.CANDIDATES]: ['Candidate ID', 'Timestamp', 'Name', 'Email', 'Phone', 'Position', 'Source', 'Notes'],
    [CONFIG.SHEETS.ASSESSMENTS]: ['Assessment ID', 'Timestamp', 'Name', 'Email', 'Archetype', 'Match %', 'Dimensions', 'Secondary'],
    [CONFIG.SHEETS.INTERVIEWS]: ['Evaluation ID', 'Timestamp', 'Candidate', 'Interviewer', 'Score', 'Recommendation', 'Sections', 'Red Flags', 'Green Flags', 'Notes', 'Date'],
    [CONFIG.SHEETS.DECISIONS]: ['Decision ID', 'Timestamp', 'Candidate', 'Position', 'Decision', 'Start Date', 'Salary', 'Notes', 'Decided By']
  };
  
  Object.entries(sheetConfigs).forEach(([sheetName, headers]) => {
    let sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    
    // Set headers in first row
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Format header row
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#4a86e8')
      .setFontColor('white');
    
    // Freeze header row
    sheet.setFrozenRows(1);
  });
  
  Logger.log('Spreadsheet initialized successfully');
}

/**
 * Create a menu for manual operations
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Epworth Tools')
    .addItem('Initialize Sheets', 'initializeSpreadsheet')
    .addItem('Generate Report', 'generateSummaryReport')
    .addSeparator()
    .addItem('Test Assessment Scoring', 'testAssessmentScoring')
    .addToUi();
}

/**
 * Generate summary report
 */
function generateSummaryReport() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  
  // Get candidate count
  const candidatesSheet = ss.getSheetByName(CONFIG.SHEETS.CANDIDATES);
  const candidateCount = candidatesSheet ? candidatesSheet.getLastRow() - 1 : 0;
  
  // Get assessment count
  const assessmentsSheet = ss.getSheetByName(CONFIG.SHEETS.ASSESSMENTS);
  const assessmentCount = assessmentsSheet ? assessmentsSheet.getLastRow() - 1 : 0;
  
  // Get interview count
  const interviewsSheet = ss.getSheetByName(CONFIG.SHEETS.INTERVIEWS);
  const interviewCount = interviewsSheet ? interviewsSheet.getLastRow() - 1 : 0;
  
  // Get decisions by type
  const decisionsSheet = ss.getSheetByName(CONFIG.SHEETS.DECISIONS);
  let offers = 0, maybes = 0, nos = 0;
  
  if (decisionsSheet && decisionsSheet.getLastRow() > 1) {
    const decisions = decisionsSheet.getRange(2, 5, decisionsSheet.getLastRow() - 1, 1).getValues();
    decisions.forEach(row => {
      const decision = row[0].toString().toUpperCase();
      if (decision.includes('OFFER')) offers++;
      else if (decision.includes('MAYBE')) maybes++;
      else if (decision.includes('NO')) nos++;
    });
  }
  
  const report = `
EPWORTH VILLAGE HIRING SUMMARY
==============================
Generated: ${new Date().toLocaleString()}

Candidates in Pipeline: ${candidateCount}
Assessments Completed: ${assessmentCount}
Interviews Conducted: ${interviewCount}

Hiring Decisions:
  - Offers: ${offers}
  - Under Review: ${maybes}
  - Declined: ${nos}

Offer Rate: ${candidateCount > 0 ? Math.round((offers / candidateCount) * 100) : 0}%
  `;
  
  Logger.log(report);
  SpreadsheetApp.getUi().alert(report);
}

/**
 * Test function for development
 */
function testAssessmentScoring() {
  const testResponses = {
    'Candidate Name': ['Test Candidate'],
    'Email': ['test@example.com'],
    'A1': ['1'], 'A2': ['1'], 'A3': ['1'], 'A4': ['1'],  // People-focused
    'B1': ['2'], 'B2': ['2'], 'B3': ['2'], 'B4': ['2'],  // Flexibility
    'C1': ['2'], 'C2': ['2'], 'C3': ['2'], 'C4': ['2'],  // Collaborative
    'D1': ['1'], 'D2': ['1'], 'D3': ['1'], 'D4': ['1'],  // Stability
    'E1': ['1'], 'E2': ['1'], 'E3': ['1'], 'E4': ['1'],  // Harmony
    'F1': ['1'], 'F2': ['1'], 'F3': ['1'], 'F4': ['1']   // Internal
  };
  
  const dimensionScores = calculateDimensionScores(testResponses);
  const archetypeMatch = matchArchetype(dimensionScores);
  
  Logger.log('Test Results:');
  Logger.log('Dimensions: ' + JSON.stringify(dimensionScores));
  Logger.log('Archetype: ' + archetypeMatch.primary + ' (' + archetypeMatch.confidence + '%)');
  
  SpreadsheetApp.getUi().alert(
    'Test Results\n\n' +
    'Primary Archetype: ' + archetypeMatch.primary + '\n' +
    'Confidence: ' + archetypeMatch.confidence + '%'
  );
}
