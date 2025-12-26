/**
 * True Colors Personality Assessment
 * Gold, Green, Orange, Blue Communication Styles
 *
 * Colors:
 * GOLD - Organized, responsible, structured, dependable
 * GREEN - Analytical, logical, conceptual, inventive
 * ORANGE - Adventurous, spontaneous, action-oriented, flexible
 * BLUE - Empathetic, compassionate, relationship-focused, harmonious
 */

const express = require('express');
const router = express.Router();
const { sendAssessmentNotification } = require('../integrations/email');
const http = require('http');

// Helper function to save assessment to Google Sheets
async function saveToGoogleSheets(result) {
  const data = JSON.stringify({
    candidateName: result.candidate.name,
    candidateEmail: result.candidate.email,
    primaryColor: result.candidateResults.primaryColor.name,
    secondaryColor: result.candidateResults.secondaryColor.name,
    colorScores: {
      gold: result.interviewerReport.colorProfile.find(c => c.color === 'Gold')?.percentage || 0,
      green: result.interviewerReport.colorProfile.find(c => c.color === 'Green')?.percentage || 0,
      orange: result.interviewerReport.colorProfile.find(c => c.color === 'Orange')?.percentage || 0,
      blue: result.interviewerReport.colorProfile.find(c => c.color === 'Blue')?.percentage || 0
    }
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: process.env.PORT || 3000,
      path: '/api/sheets/assessments',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = http.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// True Colors Definitions
const TRUE_COLORS = {
  GOLD: {
    id: 'gold',
    name: 'Gold',
    color: '#D4AF37',
    tagline: 'The Responsible Planner',
    description: 'You are organized, dependable, and value structure. You bring stability and reliability to any team.',
    coreValues: ['Responsibility', 'Organization', 'Tradition', 'Security', 'Punctuality'],
    strengths: [
      'Highly organized and detail-oriented',
      'Dependable and follows through on commitments',
      'Creates and maintains efficient systems',
      'Thorough documentation and record-keeping',
      'Respects policies and procedures'
    ],
    challenges: [
      'May struggle with ambiguity or rapid change',
      'Can appear rigid or inflexible',
      'May focus too much on rules over relationships',
      'Can be overly critical of those who seem disorganized'
    ],
    inFamilyServices: {
      strengths: [
        'Excellent at documentation and case notes',
        'Reliable with appointments and follow-through',
        'Creates consistent structure for families',
        'Follows agency protocols carefully'
      ],
      growthAreas: [
        'Developing flexibility with unpredictable family situations',
        'Balancing procedures with relationship-building',
        'Adapting when plans change unexpectedly'
      ]
    },
    communication: {
      style: 'Direct, organized, and factual',
      prefers: 'Clear agendas, timelines, and written plans',
      avoids: 'Ambiguity, last-minute changes, disorganization'
    },
    stressResponse: 'May become more rigid, critical, or controlling under stress'
  },
  GREEN: {
    id: 'green',
    name: 'Green',
    color: '#2E8B57',
    tagline: 'The Analytical Thinker',
    description: 'You are logical, curious, and value knowledge. You bring innovative problem-solving and strategic thinking to any team.',
    coreValues: ['Knowledge', 'Competence', 'Logic', 'Independence', 'Innovation'],
    strengths: [
      'Strong analytical and problem-solving skills',
      'Sees the big picture and connections',
      'Innovative and creative solutions',
      'Calm under pressure',
      'Objective and fair-minded'
    ],
    challenges: [
      'May appear detached or unemotional',
      'Can over-analyze and delay action',
      'May struggle with emotional conversations',
      'Can seem arrogant or dismissive of others\' ideas'
    ],
    inFamilyServices: {
      strengths: [
        'Excellent at assessing complex family dynamics',
        'Develops creative intervention strategies',
        'Stays calm during crises',
        'Identifies patterns and root causes'
      ],
      growthAreas: [
        'Developing emotional attunement with families',
        'Balancing analysis with action',
        'Showing warmth and connection alongside competence'
      ]
    },
    communication: {
      style: 'Logical, questioning, and conceptual',
      prefers: 'Data, rationale, and time to think',
      avoids: 'Small talk, emotional appeals, being rushed'
    },
    stressResponse: 'May withdraw, become sarcastic, or over-intellectualize under stress'
  },
  ORANGE: {
    id: 'orange',
    name: 'Orange',
    color: '#FF8C00',
    tagline: 'The Adventurous Doer',
    description: 'You are energetic, adaptable, and action-oriented. You bring spontaneity and resourcefulness to any team.',
    coreValues: ['Freedom', 'Action', 'Excitement', 'Flexibility', 'Skill'],
    strengths: [
      'Highly adaptable and flexible',
      'Thrives in crisis situations',
      'Energetic and enthusiastic',
      'Resourceful problem-solver',
      'Excellent at building rapport quickly'
    ],
    challenges: [
      'May struggle with routine and documentation',
      'Can be impulsive or take unnecessary risks',
      'May get bored with long-term planning',
      'Can appear scattered or unfocused'
    ],
    inFamilyServices: {
      strengths: [
        'Excellent at de-escalation and crisis response',
        'Builds rapport with resistant families quickly',
        'Adapts to unpredictable home visit situations',
        'Brings energy and optimism to difficult cases'
      ],
      growthAreas: [
        'Developing consistency in documentation',
        'Following through on long-term case plans',
        'Slowing down to ensure thoroughness'
      ]
    },
    communication: {
      style: 'Informal, energetic, and action-focused',
      prefers: 'Variety, hands-on activities, immediate results',
      avoids: 'Lengthy meetings, excessive paperwork, rigid schedules'
    },
    stressResponse: 'May become impulsive, scattered, or escape-seeking under stress'
  },
  BLUE: {
    id: 'blue',
    name: 'Blue',
    color: '#4169E1',
    tagline: 'The Compassionate Connector',
    description: 'You are empathetic, sincere, and relationship-focused. You bring warmth and genuine connection to any team.',
    coreValues: ['Relationships', 'Authenticity', 'Harmony', 'Compassion', 'Connection'],
    strengths: [
      'Deeply empathetic and understanding',
      'Excellent at building trust and rapport',
      'Creates safe, supportive environments',
      'Strong communication and listening skills',
      'Inspires and motivates others'
    ],
    challenges: [
      'May take things too personally',
      'Can struggle with conflict or tough conversations',
      'May over-invest emotionally in cases',
      'Can have difficulty with boundaries'
    ],
    inFamilyServices: {
      strengths: [
        'Builds deep trust with families',
        'Creates safe space for vulnerable conversations',
        'Advocates passionately for children and families',
        'Naturally trauma-informed in approach'
      ],
      growthAreas: [
        'Developing professional boundaries',
        'Having difficult accountability conversations',
        'Managing emotional investment and self-care'
      ]
    },
    communication: {
      style: 'Warm, personal, and encouraging',
      prefers: 'Personal connection, meaningful conversations, appreciation',
      avoids: 'Conflict, criticism, impersonal interactions'
    },
    stressResponse: 'May become emotional, withdraw, or seek excessive reassurance under stress'
  }
};

// Assessment Questions - Forced Choice Format
const QUESTIONS = [
  {
    id: 'Q1',
    text: 'When starting a new project, I prefer to:',
    options: [
      { value: 'gold', label: 'Create a detailed plan with clear steps and timeline' },
      { value: 'green', label: 'Research and understand all aspects before beginning' },
      { value: 'orange', label: 'Jump in and figure it out as I go' },
      { value: 'blue', label: 'Discuss with others and get everyone aligned' }
    ]
  },
  {
    id: 'Q2',
    text: 'In meetings, I typically:',
    options: [
      { value: 'gold', label: 'Follow the agenda and keep things on track' },
      { value: 'green', label: 'Ask questions and challenge assumptions' },
      { value: 'orange', label: 'Look for opportunities to take action' },
      { value: 'blue', label: 'Make sure everyone feels heard and included' }
    ]
  },
  {
    id: 'Q3',
    text: 'When plans change unexpectedly, I:',
    options: [
      { value: 'gold', label: 'Feel stressed and want to reorganize quickly' },
      { value: 'green', label: 'Analyze why the change happened and what it means' },
      { value: 'orange', label: 'Adapt easily and see it as an opportunity' },
      { value: 'blue', label: 'Check in on how others are handling the change' }
    ]
  },
  {
    id: 'Q4',
    text: 'I feel most satisfied at work when I:',
    options: [
      { value: 'gold', label: 'Complete tasks on time with high quality' },
      { value: 'green', label: 'Solve a complex problem or learn something new' },
      { value: 'orange', label: 'Take on exciting challenges and see immediate results' },
      { value: 'blue', label: 'Make a real difference in someone\'s life' }
    ]
  },
  {
    id: 'Q5',
    text: 'When working with a difficult person, I:',
    options: [
      { value: 'gold', label: 'Focus on the task and set clear expectations' },
      { value: 'green', label: 'Try to understand their perspective logically' },
      { value: 'orange', label: 'Use humor and charm to break the tension' },
      { value: 'blue', label: 'Try to connect with them on a personal level' }
    ]
  },
  {
    id: 'Q6',
    text: 'My ideal work environment is:',
    options: [
      { value: 'gold', label: 'Structured with clear expectations and procedures' },
      { value: 'green', label: 'Intellectually stimulating with room for innovation' },
      { value: 'orange', label: 'Fast-paced with variety and freedom' },
      { value: 'blue', label: 'Collaborative with supportive relationships' }
    ]
  },
  {
    id: 'Q7',
    text: 'When making decisions, I rely most on:',
    options: [
      { value: 'gold', label: 'Policies, precedent, and proven methods' },
      { value: 'green', label: 'Logic, data, and careful analysis' },
      { value: 'orange', label: 'Instinct, experience, and quick assessment' },
      { value: 'blue', label: 'Values, feelings, and impact on people' }
    ]
  },
  {
    id: 'Q8',
    text: 'When stressed, I tend to:',
    options: [
      { value: 'gold', label: 'Become more controlling or critical' },
      { value: 'green', label: 'Withdraw and need time alone to think' },
      { value: 'orange', label: 'Become restless and look for escape or distraction' },
      { value: 'blue', label: 'Become emotional and need reassurance' }
    ]
  },
  {
    id: 'Q9',
    text: 'I am most frustrated by people who:',
    options: [
      { value: 'gold', label: 'Are disorganized or unreliable' },
      { value: 'green', label: 'Are illogical or don\'t think things through' },
      { value: 'orange', label: 'Are rigid or slow to act' },
      { value: 'blue', label: 'Are cold or don\'t value relationships' }
    ]
  },
  {
    id: 'Q10',
    text: 'When giving feedback, I:',
    options: [
      { value: 'gold', label: 'Focus on specific behaviors and expectations' },
      { value: 'green', label: 'Explain the rationale and provide objective assessment' },
      { value: 'orange', label: 'Keep it brief and action-oriented' },
      { value: 'blue', label: 'Balance honesty with encouragement and support' }
    ]
  },
  {
    id: 'Q11',
    text: 'When a family is struggling, my first instinct is to:',
    options: [
      { value: 'gold', label: 'Create a structured plan with clear steps' },
      { value: 'green', label: 'Assess the situation and identify root causes' },
      { value: 'orange', label: 'Take immediate action to address urgent needs' },
      { value: 'blue', label: 'Build trust and understand their experience' }
    ]
  },
  {
    id: 'Q12',
    text: 'In documentation and paperwork, I am:',
    options: [
      { value: 'gold', label: 'Thorough and detailed - I enjoy getting it right' },
      { value: 'green', label: 'Analytical - I focus on accurate assessment' },
      { value: 'orange', label: 'Efficient - I get it done but prefer fieldwork' },
      { value: 'blue', label: 'Thoughtful - I focus on capturing the human story' }
    ]
  },
  {
    id: 'Q13',
    text: 'When I disagree with a decision, I:',
    options: [
      { value: 'gold', label: 'Follow the decision but document my concerns' },
      { value: 'green', label: 'Present my logical case and evidence' },
      { value: 'orange', label: 'Speak up directly and advocate for change' },
      { value: 'blue', label: 'Consider the impact on relationships before responding' }
    ]
  },
  {
    id: 'Q14',
    text: 'I build trust with families by:',
    options: [
      { value: 'gold', label: 'Being reliable, consistent, and following through' },
      { value: 'green', label: 'Demonstrating competence and giving good advice' },
      { value: 'orange', label: 'Being authentic, flexible, and non-judgmental' },
      { value: 'blue', label: 'Showing genuine care and really listening' }
    ]
  },
  {
    id: 'Q15',
    text: 'When working with a crisis situation, I:',
    options: [
      { value: 'gold', label: 'Follow established protocols and procedures' },
      { value: 'green', label: 'Quickly assess the situation and determine priorities' },
      { value: 'orange', label: 'Stay calm, adapt, and take decisive action' },
      { value: 'blue', label: 'Focus on the emotional needs of those involved' }
    ]
  },
  {
    id: 'Q16',
    text: 'I believe the best teams:',
    options: [
      { value: 'gold', label: 'Have clear roles, responsibilities, and accountability' },
      { value: 'green', label: 'Challenge each other and value diverse perspectives' },
      { value: 'orange', label: 'Are flexible, energetic, and get things done' },
      { value: 'blue', label: 'Support each other and work together harmoniously' }
    ]
  },
  {
    id: 'Q17',
    text: 'When I receive criticism, I:',
    options: [
      { value: 'gold', label: 'Consider if I failed to meet expectations and how to improve' },
      { value: 'green', label: 'Evaluate if the criticism is logical and valid' },
      { value: 'orange', label: 'Take what\'s useful and move on quickly' },
      { value: 'blue', label: 'Feel hurt but try to understand the intent behind it' }
    ]
  },
  {
    id: 'Q18',
    text: 'I recharge and recover by:',
    options: [
      { value: 'gold', label: 'Getting organized and accomplishing small tasks' },
      { value: 'green', label: 'Having quiet time to think, read, or learn' },
      { value: 'orange', label: 'Doing something active, fun, or adventurous' },
      { value: 'blue', label: 'Spending quality time with people I care about' }
    ]
  },
  {
    id: 'Q19',
    text: 'When a parent is resistant to services, I:',
    options: [
      { value: 'gold', label: 'Explain requirements and consequences clearly' },
      { value: 'green', label: 'Try to understand their reasoning and address concerns' },
      { value: 'orange', label: 'Try a different approach and stay persistent' },
      { value: 'blue', label: 'Build relationship first and find what matters to them' }
    ]
  },
  {
    id: 'Q20',
    text: 'At the end of a difficult day, I feel best when I:',
    options: [
      { value: 'gold', label: 'Know I did my job correctly and nothing fell through cracks' },
      { value: 'green', label: 'Learned something valuable from the experience' },
      { value: 'orange', label: 'Handled whatever came up and made it through' },
      { value: 'blue', label: 'Made a meaningful connection with someone' }
    ]
  }
];

// Scoring Logic
function calculateColorScores(responses) {
  const scores = {
    gold: 0,
    green: 0,
    orange: 0,
    blue: 0
  };

  responses.forEach(response => {
    if (scores.hasOwnProperty(response.color)) {
      scores[response.color]++;
    }
  });

  const total = responses.length;

  return {
    gold: { count: scores.gold, percentage: Math.round((scores.gold / total) * 100) },
    green: { count: scores.green, percentage: Math.round((scores.green / total) * 100) },
    orange: { count: scores.orange, percentage: Math.round((scores.orange / total) * 100) },
    blue: { count: scores.blue, percentage: Math.round((scores.blue / total) * 100) }
  };
}

function determineColorOrder(colorScores) {
  const sorted = Object.entries(colorScores)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([color, data]) => ({
      color,
      ...data,
      colorData: TRUE_COLORS[color.toUpperCase()]
    }));

  return {
    primary: sorted[0],
    secondary: sorted[1],
    tertiary: sorted[2],
    quaternary: sorted[3],
    all: sorted
  };
}

function generateCandidateReport(colorOrder) {
  const primary = colorOrder.primary.colorData;
  const secondary = colorOrder.secondary.colorData;

  return {
    primaryColor: {
      name: primary.name,
      color: primary.color,
      tagline: primary.tagline,
      description: primary.description,
      percentage: colorOrder.primary.percentage
    },
    secondaryColor: {
      name: secondary.name,
      color: secondary.color,
      tagline: secondary.tagline,
      description: secondary.description,
      percentage: colorOrder.secondary.percentage
    },
    colorSpectrum: colorOrder.all.map(c => ({
      name: c.colorData.name,
      color: c.colorData.color,
      percentage: c.percentage
    }))
  };
}

function generateInterviewerReport(colorOrder) {
  const primary = colorOrder.primary.colorData;
  const secondary = colorOrder.secondary.colorData;

  return {
    summary: {
      primaryColor: primary.name,
      primaryPercentage: colorOrder.primary.percentage,
      secondaryColor: secondary.name,
      secondaryPercentage: colorOrder.secondary.percentage,
      description: primary.description
    },
    colorProfile: colorOrder.all.map(c => ({
      color: c.colorData.name,
      hexColor: c.colorData.color,
      percentage: c.percentage,
      count: c.count
    })),
    primaryDetails: {
      name: primary.name,
      tagline: primary.tagline,
      coreValues: primary.coreValues,
      strengths: primary.strengths,
      challenges: primary.challenges,
      communication: primary.communication,
      stressResponse: primary.stressResponse
    },
    secondaryDetails: {
      name: secondary.name,
      tagline: secondary.tagline,
      coreValues: secondary.coreValues,
      strengths: secondary.strengths
    },
    familyServicesProfile: {
      strengths: primary.inFamilyServices.strengths,
      growthAreas: primary.inFamilyServices.growthAreas,
      secondaryStrengths: secondary.inFamilyServices.strengths
    },
    supervisionRecommendations: generateSupervisionRecommendations(primary, secondary),
    teamDynamics: generateTeamDynamicsInsights(colorOrder)
  };
}

function generateSupervisionRecommendations(primary, secondary) {
  const recommendations = {
    GOLD: [
      'Provide clear expectations and written guidelines',
      'Give regular feedback on performance',
      'Respect their need for organization and planning',
      'Help them develop flexibility for unpredictable situations'
    ],
    GREEN: [
      'Allow time for independent thinking and analysis',
      'Explain the "why" behind decisions and policies',
      'Value their innovative ideas and problem-solving',
      'Support development of emotional connection skills'
    ],
    ORANGE: [
      'Provide variety and new challenges',
      'Give freedom with clear accountability',
      'Support with documentation and follow-through',
      'Channel their energy toward positive outcomes'
    ],
    BLUE: [
      'Build a personal, supportive relationship',
      'Provide regular appreciation and recognition',
      'Help establish healthy boundaries',
      'Support self-care and emotional processing'
    ]
  };

  return {
    primaryRecommendations: recommendations[primary.name.toUpperCase()],
    blendedApproach: `This candidate blends ${primary.name} and ${secondary.name} - balance ${primary.name}'s need for ${primary.coreValues[0].toLowerCase()} with ${secondary.name}'s value of ${secondary.coreValues[0].toLowerCase()}.`
  };
}

function generateTeamDynamicsInsights(colorOrder) {
  const primary = colorOrder.primary.colorData.name.toUpperCase();

  const insights = {
    GOLD: {
      worksWellWith: 'Blues (both value commitment) and Greens (both appreciate competence)',
      potentialFriction: 'Oranges (different pace and structure preferences)',
      contribution: 'Brings organization, reliability, and follow-through to the team'
    },
    GREEN: {
      worksWellWith: 'Golds (both value competence) and other Greens (intellectual stimulation)',
      potentialFriction: 'Blues (different decision-making styles)',
      contribution: 'Brings analysis, innovation, and objective perspective to the team'
    },
    ORANGE: {
      worksWellWith: 'Blues (both are people-oriented) and other Oranges (energy match)',
      potentialFriction: 'Golds (different structure preferences)',
      contribution: 'Brings energy, adaptability, and crisis management to the team'
    },
    BLUE: {
      worksWellWith: 'Oranges (both are people-focused) and Golds (complementary strengths)',
      potentialFriction: 'Greens (different communication styles)',
      contribution: 'Brings empathy, connection, and team harmony'
    }
  };

  return insights[primary];
}

// API Routes

// Get assessment questions
router.get('/questions', (req, res) => {
  res.json({
    success: true,
    totalQuestions: QUESTIONS.length,
    colors: Object.values(TRUE_COLORS).map(c => ({
      id: c.id,
      name: c.name,
      color: c.color,
      tagline: c.tagline
    })),
    questions: QUESTIONS
  });
});

// Get color descriptions
router.get('/colors', (req, res) => {
  res.json({
    success: true,
    data: Object.values(TRUE_COLORS).map(c => ({
      id: c.id,
      name: c.name,
      color: c.color,
      tagline: c.tagline,
      description: c.description,
      coreValues: c.coreValues,
      strengths: c.strengths
    }))
  });
});

// Get specific color details
router.get('/color/:colorId', (req, res) => {
  const color = Object.values(TRUE_COLORS).find(c =>
    c.id === req.params.colorId.toLowerCase() ||
    c.name.toLowerCase() === req.params.colorId.toLowerCase()
  );

  if (!color) {
    return res.status(404).json({
      success: false,
      message: 'Color not found'
    });
  }

  res.json({
    success: true,
    data: color
  });
});

// Submit assessment and get results
router.post('/submit', (req, res) => {
  const { candidateName, candidateEmail, responses } = req.body;

  if (!responses || !Array.isArray(responses)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide assessment responses'
    });
  }

  // Validate responses
  const validResponses = responses.filter(r =>
    r.questionId && r.color && ['gold', 'green', 'orange', 'blue'].includes(r.color.toLowerCase())
  );

  if (validResponses.length < QUESTIONS.length * 0.75) {
    return res.status(400).json({
      success: false,
      message: 'Incomplete assessment. Please answer at least 75% of questions.'
    });
  }

  // Calculate scores
  const colorScores = calculateColorScores(validResponses);
  const colorOrder = determineColorOrder(colorScores);

  // Generate both reports
  const candidateReport = generateCandidateReport(colorOrder);
  const interviewerReport = generateInterviewerReport(colorOrder);

  const result = {
    success: true,
    assessmentId: `TC-${Date.now()}`,
    timestamp: new Date().toISOString(),
    candidate: {
      name: candidateName || 'Anonymous',
      email: candidateEmail || null
    },
    responsesReceived: validResponses.length,
    totalQuestions: QUESTIONS.length,
    // Candidate sees this
    candidateResults: candidateReport,
    // Interviewer sees this (more detailed)
    interviewerReport
  };

  // Send email notification (async, don't block response)
  sendAssessmentNotification(result).catch(err => {
    console.error('Email notification failed:', err);
  });

  // Save to Google Sheets (async, don't block response)
  saveToGoogleSheets(result).catch(err => {
    console.error('Google Sheets save failed:', err);
  });

  res.json(result);
});

module.exports = router;
