/**
 * Google Sheets Integration
 * Backend integration for syncing with Google Sheets as legacy database
 * 
 * Flow: Google Form -> Google Apps Script -> Scoring Logic -> Spreadsheet Update
 */

const express = require('express');
const { google } = require('googleapis');
const router = express.Router();

// Sheet names for different modules
const SHEET_NAMES = {
  CANDIDATES: 'Candidates',
  ASSESSMENTS: 'Personality Assessments',
  INTERVIEWS: 'Interview Evaluations',
  RESOURCES: 'Resource Directory',
  DECISIONS: 'Hiring Decisions'
};

// Initialize Google Sheets API
async function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  
  const client = await auth.getClient();
  return google.sheets({ version: 'v4', auth: client });
}

// Helper function to format date for sheets
function formatDate(date = new Date()) {
  return date.toISOString().split('T')[0];
}

// Helper function to format timestamp
function formatTimestamp(date = new Date()) {
  return date.toISOString();
}

// API Routes

// Health check for sheets connection
router.get('/status', async (req, res) => {
  try {
    if (!process.env.GOOGLE_SHEETS_ID) {
      return res.json({
        success: false,
        connected: false,
        message: 'Google Sheets ID not configured'
      });
    }
    
    const sheets = await getGoogleSheetsClient();
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID
    });
    
    res.json({
      success: true,
      connected: true,
      spreadsheetTitle: spreadsheet.data.properties?.title,
      sheets: spreadsheet.data.sheets?.map(s => s.properties?.title)
    });
  } catch (error) {
    res.json({
      success: false,
      connected: false,
      message: 'Failed to connect to Google Sheets',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get data from a specific sheet
router.get('/data/:sheetName', async (req, res) => {
  try {
    const sheets = await getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: `${req.params.sheetName}!A:Z`
    });
    
    const rows = response.data.values || [];
    const headers = rows[0] || [];
    const data = rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i] || '';
      });
      return obj;
    });
    
    res.json({
      success: true,
      sheet: req.params.sheetName,
      rowCount: data.length,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Append candidate data
router.post('/candidates', async (req, res) => {
  try {
    const { name, email, phone, position, source, notes } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Candidate name is required'
      });
    }
    
    const sheets = await getGoogleSheetsClient();
    const timestamp = formatTimestamp();
    const candidateId = `CAN-${Date.now()}`;
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: `${SHEET_NAMES.CANDIDATES}!A:H`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          candidateId,
          timestamp,
          name,
          email || '',
          phone || '',
          position || '',
          source || '',
          notes || ''
        ]]
      }
    });
    
    res.json({
      success: true,
      message: 'Candidate added successfully',
      candidateId,
      timestamp
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add candidate',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Append assessment results
router.post('/assessments', async (req, res) => {
  try {
    const { candidateId, candidateName, archetype, matchPercentage, dimensionScores, valuesAlignment } = req.body;
    
    if (!candidateName || !archetype) {
      return res.status(400).json({
        success: false,
        message: 'Candidate name and archetype are required'
      });
    }
    
    const sheets = await getGoogleSheetsClient();
    const timestamp = formatTimestamp();
    const assessmentId = `ASM-${Date.now()}`;
    
    // Format dimension scores as string
    const dimensionString = dimensionScores 
      ? Object.entries(dimensionScores).map(([k, v]) => `${k}:${v.tendency}`).join('; ')
      : '';
    
    // Format values alignment
    const valuesString = valuesAlignment
      ? Object.entries(valuesAlignment).map(([k, v]) => `${k}:${v.score}`).join('; ')
      : '';
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: `${SHEET_NAMES.ASSESSMENTS}!A:H`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          assessmentId,
          timestamp,
          candidateId || '',
          candidateName,
          archetype,
          matchPercentage || '',
          dimensionString,
          valuesString
        ]]
      }
    });
    
    res.json({
      success: true,
      message: 'Assessment saved successfully',
      assessmentId,
      timestamp
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to save assessment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Append interview evaluation
router.post('/interviews', async (req, res) => {
  try {
    const { 
      candidateId, 
      candidateName, 
      interviewerName,
      overallScore, 
      recommendation, 
      sectionScores, 
      redFlags, 
      greenFlags,
      notes 
    } = req.body;
    
    if (!candidateName || overallScore === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Candidate name and overall score are required'
      });
    }
    
    const sheets = await getGoogleSheetsClient();
    const timestamp = formatTimestamp();
    const evaluationId = `EVAL-${Date.now()}`;
    
    // Format section scores
    const sectionString = sectionScores
      ? Object.entries(sectionScores).map(([k, v]) => `${k}:${v.average}`).join('; ')
      : '';
    
    // Format flags
    const redFlagsString = (redFlags || []).join(', ');
    const greenFlagsString = (greenFlags || []).join(', ');
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: `${SHEET_NAMES.INTERVIEWS}!A:L`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          evaluationId,
          timestamp,
          candidateId || '',
          candidateName,
          interviewerName || '',
          overallScore,
          recommendation || '',
          sectionString,
          redFlagsString,
          greenFlagsString,
          notes || '',
          formatDate()
        ]]
      }
    });
    
    res.json({
      success: true,
      message: 'Interview evaluation saved successfully',
      evaluationId,
      timestamp
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to save interview evaluation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Record hiring decision
router.post('/decisions', async (req, res) => {
  try {
    const {
      candidateId,
      candidateName,
      position,
      decision,
      startDate,
      salary,
      notes,
      decidedBy
    } = req.body;
    
    if (!candidateName || !decision) {
      return res.status(400).json({
        success: false,
        message: 'Candidate name and decision are required'
      });
    }
    
    const sheets = await getGoogleSheetsClient();
    const timestamp = formatTimestamp();
    const decisionId = `DEC-${Date.now()}`;
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: `${SHEET_NAMES.DECISIONS}!A:J`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          decisionId,
          timestamp,
          candidateId || '',
          candidateName,
          position || '',
          decision,
          startDate || '',
          salary || '',
          notes || '',
          decidedBy || ''
        ]]
      }
    });
    
    res.json({
      success: true,
      message: 'Hiring decision recorded successfully',
      decisionId,
      timestamp
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to record decision',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Initialize sheets with headers
router.post('/initialize', async (req, res) => {
  try {
    const sheets = await getGoogleSheetsClient();
    
    // Headers for each sheet
    const sheetHeaders = {
      [SHEET_NAMES.CANDIDATES]: ['Candidate ID', 'Timestamp', 'Name', 'Email', 'Phone', 'Position', 'Source', 'Notes'],
      [SHEET_NAMES.ASSESSMENTS]: ['Assessment ID', 'Timestamp', 'Candidate ID', 'Name', 'Archetype', 'Match %', 'Dimensions', 'Values Alignment'],
      [SHEET_NAMES.INTERVIEWS]: ['Evaluation ID', 'Timestamp', 'Candidate ID', 'Name', 'Interviewer', 'Score', 'Recommendation', 'Section Scores', 'Red Flags', 'Green Flags', 'Notes', 'Date'],
      [SHEET_NAMES.DECISIONS]: ['Decision ID', 'Timestamp', 'Candidate ID', 'Name', 'Position', 'Decision', 'Start Date', 'Salary', 'Notes', 'Decided By'],
      [SHEET_NAMES.RESOURCES]: ['Resource ID', 'Name', 'Phone', 'Address', 'Category', 'Specialty', 'Counties', 'Hours', 'Website', 'Description']
    };
    
    // Create sheets if they don't exist
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID
    });
    
    const existingSheets = spreadsheet.data.sheets?.map(s => s.properties?.title) || [];
    const sheetsToCreate = Object.keys(sheetHeaders).filter(name => !existingSheets.includes(name));
    
    if (sheetsToCreate.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: process.env.GOOGLE_SHEETS_ID,
        requestBody: {
          requests: sheetsToCreate.map(title => ({
            addSheet: { properties: { title } }
          }))
        }
      });
    }
    
    // Add headers to each sheet
    const updates = Object.entries(sheetHeaders).map(([sheetName, headers]) => ({
      range: `${sheetName}!A1:${String.fromCharCode(64 + headers.length)}1`,
      values: [headers]
    }));
    
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      requestBody: {
        valueInputOption: 'RAW',
        data: updates
      }
    });
    
    res.json({
      success: true,
      message: 'Sheets initialized successfully',
      sheets: Object.keys(sheetHeaders)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to initialize sheets',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Search across sheets
router.get('/search', async (req, res) => {
  try {
    const { q, sheet } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const sheets = await getGoogleSheetsClient();
    const sheetsToSearch = sheet ? [sheet] : Object.values(SHEET_NAMES);
    const results = [];
    
    for (const sheetName of sheetsToSearch) {
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: process.env.GOOGLE_SHEETS_ID,
          range: `${sheetName}!A:Z`
        });
        
        const rows = response.data.values || [];
        const headers = rows[0] || [];
        const searchLower = q.toLowerCase();
        
        rows.slice(1).forEach((row, index) => {
          const rowText = row.join(' ').toLowerCase();
          if (rowText.includes(searchLower)) {
            const obj = { _sheet: sheetName, _row: index + 2 };
            headers.forEach((header, i) => {
              obj[header] = row[i] || '';
            });
            results.push(obj);
          }
        });
      } catch (e) {
        // Sheet might not exist, continue
      }
    }
    
    res.json({
      success: true,
      query: q,
      resultCount: results.length,
      results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Export data as JSON (for backup)
router.get('/export/:sheetName', async (req, res) => {
  try {
    const sheets = await getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: `${req.params.sheetName}!A:Z`
    });
    
    const rows = response.data.values || [];
    const headers = rows[0] || [];
    const data = rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i] || '';
      });
      return obj;
    });
    
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.sheetName}-${formatDate()}.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.json({
      exportDate: formatTimestamp(),
      sheet: req.params.sheetName,
      rowCount: data.length,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Export failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
