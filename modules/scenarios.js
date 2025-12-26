/**
 * In-Home Family Services Scenario Assessment
 * Candidate-Facing Scenarios for Pre-Interview Completion
 *
 * Focus: In-home family services situations
 * - Working with families in their homes
 * - Crisis response during home visits
 * - Building relationships with resistant parents
 * - Safety assessment and documentation
 * - Trauma-informed interactions
 */

const express = require('express');
const router = express.Router();
const { sendScenarioNotification } = require('../integrations/email');

// Scenario Definitions - In-Home Family Services Only
const SCENARIOS = [
  {
    id: 'SC1',
    title: 'Parent in Recovery - Signs of Relapse',
    category: 'Addiction & Safety',
    difficulty: 'Complex',
    situation: `You arrive for a scheduled home visit with Maria (32) and her son Carlos (8). Maria has been in recovery from opioid addiction for 6 months and making good progress. Today, you notice:

• Several empty beer bottles in the kitchen sink
• Maria seems slightly unsteady and her speech is slower than usual
• Carlos quietly tells you "Mom was sad last night and had some beers"
• When you check in with Maria, she says "It's just beer, not the hard stuff. I can handle it."
• Your next check-in with the DHHS caseworker is scheduled for tomorrow`,
    questions: [
      {
        id: 'SC1_Q1',
        text: 'What are you noticing in this situation, and what concerns you most?',
        type: 'textarea',
        guidance: 'Consider both immediate safety and longer-term recovery implications'
      },
      {
        id: 'SC1_Q2',
        text: 'How would you approach talking to Maria about what you observed? What would you say?',
        type: 'textarea',
        guidance: 'Think about non-judgmental, trauma-informed communication'
      },
      {
        id: 'SC1_Q3',
        text: 'What is your responsibility here regarding safety, reporting, and maintaining your relationship with Maria?',
        type: 'textarea',
        guidance: 'Consider mandatory reporting obligations vs. collaborative problem-solving'
      },
      {
        id: 'SC1_Q4',
        text: 'If Maria becomes defensive or angry, how would you respond?',
        type: 'textarea',
        guidance: 'Think about de-escalation and maintaining professional boundaries'
      },
      {
        id: 'SC1_Q5',
        text: 'How would you document this visit? What specific language would you use?',
        type: 'textarea',
        guidance: 'Focus on objective, behavioral documentation'
      }
    ],
    scoringCriteria: [
      'Recognizes alcohol use as potential relapse behavior',
      'Uses non-judgmental, curious communication',
      'Balances accountability with compassion',
      'Understands mandatory reporting requirements',
      'Documents objectively without judgment'
    ]
  },
  {
    id: 'SC2',
    title: 'Trauma Response in a Child',
    category: 'Trauma & Family Dynamics',
    difficulty: 'Complex',
    situation: `You're working with the Rodriguez family. Dad (Jorge) recently completed anger management after a domestic violence incident 8 months ago. During your home visit with Jorge and his daughter Sofia (14):

• Sofia won't make eye contact with her father
• When Jorge tries to talk to her, she gives one-word answers and looks away
• Jorge is frustrated: "She won't even try. I've done everything—took classes, got help, I'm sober. When is she going to forgive me?"
• Sofia leaves the room without explanation
• Jorge turns to you: "She's being disrespectful. Can you talk to her?"
• Later, Sofia privately tells you: "I'm still scared of him sometimes."`,
    questions: [
      {
        id: 'SC2_Q1',
        text: 'What do you think is happening with Sofia? Why might she be responding this way?',
        type: 'textarea',
        guidance: 'Consider trauma responses and the impact of witnessing domestic violence'
      },
      {
        id: 'SC2_Q2',
        text: 'How would you help Jorge understand Sofia\'s behavior without shaming him for his past?',
        type: 'textarea',
        guidance: 'Balance validating his efforts while educating about trauma'
      },
      {
        id: 'SC2_Q3',
        text: 'Sofia told you privately that she\'s still scared of her dad. What do you do with this information?',
        type: 'textarea',
        guidance: 'Consider confidentiality, safety, and the therapeutic relationship'
      },
      {
        id: 'SC2_Q4',
        text: 'What would you say to Sofia (privately) to help her feel seen and heard?',
        type: 'textarea',
        guidance: 'Think about validating without making promises you can\'t keep'
      },
      {
        id: 'SC2_Q5',
        text: 'What would be your goals for the next 2-3 home visits with this family?',
        type: 'textarea',
        guidance: 'Consider realistic, small-step interventions for rebuilding trust'
      }
    ],
    scoringCriteria: [
      'Understands trauma responses in children',
      'Can hold both perspectives without taking sides',
      'Navigates confidentiality appropriately',
      'Uses age-appropriate, validating language with the child',
      'Develops realistic intervention plans'
    ]
  },
  {
    id: 'SC3',
    title: 'Crisis During Home Visit - Mental Health Emergency',
    category: 'Crisis Response',
    difficulty: 'High',
    situation: `You arrive for a home visit with the Thompson family. Mom (Angela, 38) has a history of depression and anxiety. When you arrive:

• Angela answers the door in pajamas, hasn't showered in days
• The house is unusually messy with dishes piled up
• Her two children (ages 6 and 9) are watching TV unsupervised
• Angela tells you she hasn't slept in three days
• She says: "I just can't do this anymore. Everyone would be better off without me."
• The children seem unaware of their mother's distress
• Angela's phone shows multiple missed calls from her sister`,
    questions: [
      {
        id: 'SC3_Q1',
        text: 'What is your immediate assessment of this situation? What are your priorities?',
        type: 'textarea',
        guidance: 'Consider safety assessment and triage'
      },
      {
        id: 'SC3_Q2',
        text: 'How do you respond to Angela\'s statement that "everyone would be better off without me"?',
        type: 'textarea',
        guidance: 'Think about suicide assessment and crisis intervention'
      },
      {
        id: 'SC3_Q3',
        text: 'What steps do you take in the next 30 minutes? Be specific about actions and order.',
        type: 'textarea',
        guidance: 'Consider immediate safety, support resources, and documentation'
      },
      {
        id: 'SC3_Q4',
        text: 'How do you involve the children appropriately while managing this crisis?',
        type: 'textarea',
        guidance: 'Balance child safety with not alarming them unnecessarily'
      },
      {
        id: 'SC3_Q5',
        text: 'What are the limits of your role in this situation? When do you need to involve others?',
        type: 'textarea',
        guidance: 'Understand professional boundaries and when to escalate'
      }
    ],
    scoringCriteria: [
      'Correctly identifies potential suicidal ideation',
      'Knows crisis intervention basics',
      'Prioritizes immediate safety appropriately',
      'Understands professional limits and when to escalate',
      'Considers impact on children while managing adult crisis'
    ]
  },
  {
    id: 'SC4',
    title: 'Resistant Parent - Service Non-Compliance',
    category: 'Engagement & Boundaries',
    difficulty: 'Moderate',
    situation: `You've been assigned to work with the Mitchell family. Mom (Tanya, 29) has a 4-year-old son (Jayden) and is court-ordered to participate in in-home family services after neglect allegations. During your visits over the past month:

• Tanya has cancelled 3 of your 6 scheduled visits at the last minute
• When you do meet, she sits with arms crossed and gives minimal responses
• She says: "I don't need this. CPS is just out to get me because I'm poor."
• "Those other workers didn't help. Why should you be any different?"
• Jayden is clean and fed, but Tanya rarely interacts with him during your visits
• Your supervisor is asking for progress updates`,
    questions: [
      {
        id: 'SC4_Q1',
        text: 'What do you think is driving Tanya\'s resistance? What might be underneath her anger?',
        type: 'textarea',
        guidance: 'Consider her history and context'
      },
      {
        id: 'SC4_Q2',
        text: 'How would you approach building a relationship with Tanya given her resistance?',
        type: 'textarea',
        guidance: 'Think about engagement strategies for resistant clients'
      },
      {
        id: 'SC4_Q3',
        text: 'She says "Why should you be any different?" How do you respond?',
        type: 'textarea',
        guidance: 'Consider authenticity and managing expectations'
      },
      {
        id: 'SC4_Q4',
        text: 'How do you balance respecting her autonomy with the court-ordered nature of services?',
        type: 'textarea',
        guidance: 'Think about mandated vs. voluntary dynamics'
      },
      {
        id: 'SC4_Q5',
        text: 'What would you report to your supervisor about progress with this family?',
        type: 'textarea',
        guidance: 'Consider honest reporting while advocating for the family'
      }
    ],
    scoringCriteria: [
      'Shows empathy for client\'s perspective and history',
      'Has strategies for building trust with resistant clients',
      'Responds authentically without being defensive',
      'Understands mandated service dynamics',
      'Can report honestly while maintaining advocacy stance'
    ]
  },
  {
    id: 'SC5',
    title: 'Suspected Child Abuse - Mandatory Reporting',
    category: 'Safety & Reporting',
    difficulty: 'High',
    situation: `You've been working with the Davis family for two months. Mom (Keisha) and her partner (Marcus) have two children: Destiny (7) and Marcus Jr. (4). Today during your home visit:

• You notice Destiny has a bruise on her upper arm that looks like finger marks
• When you ask casually, Destiny says "I fell" and looks at her mom
• Keisha quickly says "She's so clumsy, always falling"
• Marcus is in the other room but you notice Destiny keeps watching the doorway
• Keisha then says privately: "Please don't make a big deal of this. I'm afraid if you report, Marcus will leave and I can't afford rent alone."
• Keisha has disclosed to you previously that Marcus has a "temper" but insisted he's never hurt the kids`,
    questions: [
      {
        id: 'SC5_Q1',
        text: 'What observations are concerning you, and why?',
        type: 'textarea',
        guidance: 'Identify specific behavioral and physical indicators'
      },
      {
        id: 'SC5_Q2',
        text: 'What is your legal and ethical obligation in this situation?',
        type: 'textarea',
        guidance: 'Consider mandatory reporting requirements'
      },
      {
        id: 'SC5_Q3',
        text: 'How do you talk to Keisha about your obligation to report, given her fear?',
        type: 'textarea',
        guidance: 'Balance honesty about requirements with maintaining relationship'
      },
      {
        id: 'SC5_Q4',
        text: 'What specific information would you include in your report?',
        type: 'textarea',
        guidance: 'Focus on objective observations and statements'
      },
      {
        id: 'SC5_Q5',
        text: 'How do you continue working with this family after making a report?',
        type: 'textarea',
        guidance: 'Consider ongoing relationship and safety planning'
      }
    ],
    scoringCriteria: [
      'Correctly identifies indicators of potential abuse',
      'Understands mandatory reporting obligations',
      'Communicates honestly while maintaining compassion',
      'Documents objectively and completely',
      'Has plan for ongoing engagement after reporting'
    ]
  },
  {
    id: 'SC6',
    title: 'Co-Occurring Addiction and Grief',
    category: 'Addiction & Trauma',
    difficulty: 'Complex',
    situation: `You're working with the Williams family. Mom (Patricia, 45) lost her adult son to overdose 18 months ago. She has two remaining children at home: Devon (16) and Alicia (12). Patricia is 9 months sober from alcohol and prescription pills.

During today's home visit:

• Patricia tells you the anniversary of her son's death is next week
• She admits: "I almost used last weekend. I had the bottle in my hand. But I called my sponsor instead."
• Devon is angry: "She acts like he was the only one who died. We're still here, but she's always sad."
• Alicia is anxious and keeps asking you: "Is my mom going to be okay? Is she going to drink again?"
• Patricia looks exhausted and says: "I don't know how to be there for them when I can barely get through the day."`,
    questions: [
      {
        id: 'SC6_Q1',
        text: 'What is Patricia dealing with beyond just staying sober?',
        type: 'textarea',
        guidance: 'Consider complicated grief and parenting while in recovery'
      },
      {
        id: 'SC6_Q2',
        text: 'Patricia tells you she "almost used" but didn\'t. How do you respond to this disclosure?',
        type: 'textarea',
        guidance: 'Think about supporting recovery without shaming'
      },
      {
        id: 'SC6_Q3',
        text: 'How do you support Devon\'s anger without dismissing Patricia\'s grief?',
        type: 'textarea',
        guidance: 'Consider holding space for multiple family members\' experiences'
      },
      {
        id: 'SC6_Q4',
        text: 'What would you say to 12-year-old Alicia about her concerns?',
        type: 'textarea',
        guidance: 'Think about age-appropriate reassurance without false promises'
      },
      {
        id: 'SC6_Q5',
        text: 'What resources or supports might help this family, and how would you introduce them?',
        type: 'textarea',
        guidance: 'Consider grief support, family counseling, recovery resources'
      }
    ],
    scoringCriteria: [
      'Understands complicated grief and recovery intersection',
      'Validates recovery efforts and normalizes urges',
      'Can hold space for multiple perspectives',
      'Uses age-appropriate communication with children',
      'Knows community resources and how to connect families'
    ]
  }
];

// Scoring Guide for Interviewers
const SCORING_RUBRIC = {
  3: {
    label: 'Strong',
    description: 'Demonstrates clear understanding, uses trauma-informed approach, provides specific and appropriate responses'
  },
  2: {
    label: 'Adequate',
    description: 'Shows basic understanding, generally appropriate responses with some areas needing development'
  },
  1: {
    label: 'Concern',
    description: 'Missing key elements, concerning approach, or significantly incomplete understanding'
  }
};

// Assessment Categories for Scoring
const ASSESSMENT_CATEGORIES = [
  {
    id: 'trauma_informed',
    name: 'Trauma-Informed Thinking',
    description: 'Understands how trauma shapes behavior and responds accordingly'
  },
  {
    id: 'problem_solving',
    name: 'Problem-Solving Approach',
    description: 'Practical, creative, and appropriate solutions to complex situations'
  },
  {
    id: 'non_judgment',
    name: 'Non-Judgment & Compassion',
    description: 'Sees humanity in families while maintaining appropriate accountability'
  },
  {
    id: 'boundaries',
    name: 'Boundaries & Professional Limits',
    description: 'Knows when to act, when to refer, and when to involve others'
  },
  {
    id: 'communication',
    name: 'Communication & Language',
    description: 'Uses respectful, clear, non-blaming language appropriate to the audience'
  },
  {
    id: 'self_awareness',
    name: 'Self-Awareness',
    description: 'Recognizes own reactions, biases, and limitations'
  },
  {
    id: 'safety_assessment',
    name: 'Safety Assessment',
    description: 'Correctly identifies and prioritizes safety concerns'
  }
];

// API Routes

// Get all scenarios (for candidate to complete)
router.get('/all', (req, res) => {
  res.json({
    success: true,
    count: SCENARIOS.length,
    instructions: 'Please read each scenario carefully and provide thoughtful, detailed responses. There are no "right" answers - we want to understand how you think through complex situations.',
    estimatedTime: '45-60 minutes',
    scenarios: SCENARIOS.map(s => ({
      id: s.id,
      title: s.title,
      category: s.category,
      difficulty: s.difficulty,
      situation: s.situation,
      questions: s.questions
    }))
  });
});

// Get a specific scenario
router.get('/:scenarioId', (req, res) => {
  const scenario = SCENARIOS.find(s => s.id === req.params.scenarioId);

  if (!scenario) {
    return res.status(404).json({
      success: false,
      message: 'Scenario not found'
    });
  }

  res.json({
    success: true,
    data: {
      id: scenario.id,
      title: scenario.title,
      category: scenario.category,
      difficulty: scenario.difficulty,
      situation: scenario.situation,
      questions: scenario.questions
    }
  });
});

// Get scenario list (titles only)
router.get('/', (req, res) => {
  res.json({
    success: true,
    scenarios: SCENARIOS.map(s => ({
      id: s.id,
      title: s.title,
      category: s.category,
      difficulty: s.difficulty
    }))
  });
});

// Get scoring rubric (for interviewers)
router.get('/scoring/rubric', (req, res) => {
  res.json({
    success: true,
    rubric: SCORING_RUBRIC,
    categories: ASSESSMENT_CATEGORIES,
    scenarios: SCENARIOS.map(s => ({
      id: s.id,
      title: s.title,
      scoringCriteria: s.scoringCriteria
    }))
  });
});

// Submit scenario responses (candidate submission)
router.post('/submit', (req, res) => {
  const { candidateName, candidateEmail, responses } = req.body;

  if (!candidateName) {
    return res.status(400).json({
      success: false,
      message: 'Candidate name is required'
    });
  }

  if (!responses || !Array.isArray(responses) || responses.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Scenario responses are required'
    });
  }

  // Validate responses have content
  const validResponses = responses.filter(r =>
    r.questionId && r.response && r.response.trim().length > 0
  );

  // Calculate completion percentage
  const totalQuestions = SCENARIOS.reduce((sum, s) => sum + s.questions.length, 0);
  const completionPercentage = Math.round((validResponses.length / totalQuestions) * 100);

  if (completionPercentage < 50) {
    return res.status(400).json({
      success: false,
      message: 'Please complete at least 50% of the scenario questions'
    });
  }

  // Organize responses by scenario
  const organizedResponses = {};
  SCENARIOS.forEach(scenario => {
    const scenarioResponses = responses.filter(r =>
      r.questionId && r.questionId.startsWith(scenario.id)
    );

    organizedResponses[scenario.id] = {
      scenarioTitle: scenario.title,
      category: scenario.category,
      responses: scenarioResponses.map(r => {
        const question = scenario.questions.find(q => q.id === r.questionId);
        return {
          questionId: r.questionId,
          questionText: question ? question.text : 'Unknown question',
          response: r.response
        };
      }),
      scoringCriteria: scenario.scoringCriteria
    };
  });

  const submissionId = `SCEN-${Date.now()}`;
  const submittedAt = new Date().toISOString();

  const result = {
    success: true,
    submissionId,
    submittedAt,
    timestamp: submittedAt,
    candidate: {
      name: candidateName,
      email: candidateEmail || null
    },
    completionPercentage,
    totalResponses: validResponses.length,
    totalQuestions,
    scenarioResponses: organizedResponses,
    // For interviewer use
    scoringTemplate: ASSESSMENT_CATEGORIES.map(cat => ({
      category: cat.name,
      description: cat.description,
      score: null,
      notes: ''
    }))
  };

  // Send email notification (async, don't block response)
  sendScenarioNotification({
    candidateName,
    candidateEmail,
    submissionId,
    submittedAt,
    responses: organizedResponses,
    scenarios: SCENARIOS
  }).catch(err => {
    console.error('Scenario email notification failed:', err);
  });

  res.json(result);
});

// Score scenario responses (interviewer submission)
router.post('/score', (req, res) => {
  const { submissionId, interviewerName, categoryScores, overallNotes, recommendation } = req.body;

  if (!submissionId || !interviewerName) {
    return res.status(400).json({
      success: false,
      message: 'Submission ID and interviewer name are required'
    });
  }

  if (!categoryScores || !Array.isArray(categoryScores)) {
    return res.status(400).json({
      success: false,
      message: 'Category scores are required'
    });
  }

  // Calculate overall score
  const validScores = categoryScores.filter(s => s.score && s.score >= 1 && s.score <= 3);
  const averageScore = validScores.length > 0
    ? validScores.reduce((sum, s) => sum + s.score, 0) / validScores.length
    : 0;

  const result = {
    success: true,
    scoringId: `SCORE-${Date.now()}`,
    submissionId,
    interviewerName,
    timestamp: new Date().toISOString(),
    categoryScores,
    averageScore: Math.round(averageScore * 100) / 100,
    overallRating: averageScore >= 2.5 ? 'Strong' : averageScore >= 1.5 ? 'Adequate' : 'Concern',
    overallNotes,
    recommendation
  };

  res.json(result);
});

module.exports = router;
