/**
 * Interviewer Evaluation Form
 * For Hiring Team to Complete During/After Interview
 *
 * Sections:
 * 1. Opening Questions - First impressions and introduction
 * 2. Experience Questions - Background and work history
 * 3. Values Questions - Alignment with Epworth mission
 * 4. Closing Questions - Final assessment and next steps
 */

const express = require('express');
const router = express.Router();

// Evaluation Scale
const EVALUATION_SCALE = {
  3: { label: 'Strong', description: 'Exceeds expectations, clear competency demonstrated' },
  2: { label: 'Adequate', description: 'Meets expectations, shows potential' },
  1: { label: 'Concern', description: 'Below expectations, raises questions' }
};

// Interview Question Templates - For Interviewer Reference
const QUESTION_TEMPLATES = {
  opening: [
    'Tell me about yourself and what brought you to apply for this position.',
    'What do you know about Epworth Family Resources and our mission?',
    'Why are you interested in in-home family services specifically?',
    'What does "family preservation" mean to you?',
    'Tell me about your journey to this type of work.',
    'What are you hoping to find in your next role?'
  ],
  experience: [
    'Describe your experience working with families in crisis.',
    'Tell me about a time you worked with someone struggling with addiction. What did you learn?',
    'Describe a situation where you had to build trust with someone who was initially resistant.',
    'Tell me about a time you had to make a difficult decision about child safety.',
    'How have you handled a situation where you disagreed with a supervisor or policy?',
    'Describe your experience with documentation and case notes.',
    'Tell me about a time you had to de-escalate a tense situation.',
    'What experience do you have coordinating with other agencies (courts, schools, mental health)?',
    'Describe a time you received difficult feedback. How did you respond?',
    'Tell me about a family you worked with that had a positive outcome. What contributed to that?'
  ],
  values: [
    'What does trauma-informed care mean to you? Give an example of how you practice it.',
    'How do you balance child safety with keeping families together?',
    'What does it mean to be "non-judgmental" in this work? Give a specific example.',
    'How do you maintain professional boundaries while building genuine relationships?',
    'Describe your self-care practices. How do you manage the emotional weight of this work?',
    'What role does accountability play in your work with families?',
    'How do you approach working with families whose values differ from your own?',
    'What does recovery and healing look like to you?',
    'How do you handle situations where a parent is not making progress?',
    'What is your understanding of generational trauma and how it affects families?'
  ],
  closing: [
    'What questions do you have for us about the role or organization?',
    'Is there anything about your experience or qualifications we haven\'t covered that you\'d like to share?',
    'What does your ideal supervision and support look like?',
    'What would success look like for you in the first 90 days?',
    'Do you have any concerns about the role that we could address?',
    'What are you most excited about regarding this opportunity?'
  ]
};

// Red Flags to Watch For
const RED_FLAGS = [
  { id: 'RF1', label: 'Vague answers', description: 'Unable to provide specific examples or details' },
  { id: 'RF2', label: 'Lack of self-awareness', description: 'Cannot identify areas for growth or improvement' },
  { id: 'RF3', label: 'External motivation only', description: 'Focused solely on pay/schedule without mission connection' },
  { id: 'RF4', label: 'Defensive responses', description: 'Becomes defensive when asked follow-up questions' },
  { id: 'RF5', label: 'Blaming others', description: 'Consistently attributes problems to others without self-reflection' },
  { id: 'RF6', label: 'Inconsistent stories', description: 'Details change or contradict throughout interview' },
  { id: 'RF7', label: 'Poor boundaries', description: 'Shares inappropriate personal information or demonstrates boundary issues' },
  { id: 'RF8', label: 'Lack of trauma awareness', description: 'Shows no understanding of trauma-informed principles' },
  { id: 'RF9', label: 'Judgmental language', description: 'Uses stigmatizing or blaming language about families' },
  { id: 'RF10', label: 'Rigid thinking', description: 'Unable to consider multiple perspectives or adapt approach' }
];

// Green Flags to Look For
const GREEN_FLAGS = [
  { id: 'GF1', label: 'Growth mindset', description: 'Shows genuine willingness to learn and develop' },
  { id: 'GF2', label: 'Appropriate vulnerability', description: 'Shares challenges and lessons learned authentically' },
  { id: 'GF3', label: 'Specific examples', description: 'Provides detailed, relevant examples from experience' },
  { id: 'GF4', label: 'Mission connection', description: 'Demonstrates genuine alignment with family preservation values' },
  { id: 'GF5', label: 'Self-awareness', description: 'Accurately assesses own strengths and growth areas' },
  { id: 'GF6', label: 'Empathy with boundaries', description: 'Shows compassion while maintaining professional stance' },
  { id: 'GF7', label: 'Team orientation', description: 'Values collaboration and supporting colleagues' },
  { id: 'GF8', label: 'Accountability', description: 'Takes responsibility for actions and outcomes' },
  { id: 'GF9', label: 'Curiosity', description: 'Asks thoughtful questions, wants to understand' },
  { id: 'GF10', label: 'Realistic expectations', description: 'Understands challenges of the work without being deterred' }
];

// Interview Evaluation Sections (for Interviewer to Complete)
const EVALUATION_SECTIONS = {
  OPENING: {
    id: 'opening',
    name: 'Opening & First Impressions',
    description: 'Initial assessment of candidate presentation and motivation',
    questions: [
      {
        id: 'OPN1',
        text: 'How did the candidate present themselves? (professionalism, communication, demeanor)',
        type: 'scale',
        required: true
      },
      {
        id: 'OPN2',
        text: 'How well did they articulate their interest in this specific role?',
        type: 'scale',
        required: true
      },
      {
        id: 'OPN3',
        text: 'What was your overall first impression?',
        type: 'textarea',
        required: true
      },
      {
        id: 'OPN4',
        text: 'Did they demonstrate knowledge of Epworth and our mission?',
        type: 'scale',
        required: true
      }
    ]
  },
  EXPERIENCE: {
    id: 'experience',
    name: 'Experience & Background',
    description: 'Assessment of relevant experience and skills',
    questions: [
      {
        id: 'EXP1',
        text: 'Quality of examples from previous experience',
        type: 'scale',
        required: true,
        rubric: {
          3: 'Provided specific, detailed, relevant examples',
          2: 'Examples were adequate but lacked depth',
          1: 'Vague or no relevant examples provided'
        }
      },
      {
        id: 'EXP2',
        text: 'Experience with families in crisis or trauma',
        type: 'scale',
        required: true,
        rubric: {
          3: 'Significant relevant experience, demonstrated learning',
          2: 'Some experience, shows potential',
          1: 'Limited or no relevant experience'
        }
      },
      {
        id: 'EXP3',
        text: 'Experience with addiction/substance use issues',
        type: 'scale',
        required: true,
        rubric: {
          3: 'Strong understanding, direct experience, non-judgmental approach',
          2: 'Basic understanding, some exposure',
          1: 'Limited understanding or concerning attitudes'
        }
      },
      {
        id: 'EXP4',
        text: 'Crisis response and de-escalation skills',
        type: 'scale',
        required: true,
        rubric: {
          3: 'Demonstrated clear crisis intervention skills',
          2: 'Basic skills, would need development',
          1: 'Concerning gaps in crisis response'
        }
      },
      {
        id: 'EXP5',
        text: 'Documentation and case management experience',
        type: 'scale',
        required: true
      },
      {
        id: 'EXP6',
        text: 'Notes on experience discussion:',
        type: 'textarea',
        required: false
      }
    ]
  },
  VALUES: {
    id: 'values',
    name: 'Values & Alignment',
    description: 'Alignment with Epworth core values and trauma-informed practice',
    questions: [
      {
        id: 'VAL1',
        text: 'Trauma-Informed Care understanding',
        type: 'scale',
        required: true,
        rubric: {
          3: 'Strong understanding, can articulate and apply principles',
          2: 'Basic understanding, open to learning',
          1: 'Limited understanding or concerning attitudes'
        }
      },
      {
        id: 'VAL2',
        text: 'Family Preservation philosophy alignment',
        type: 'scale',
        required: true,
        rubric: {
          3: 'Strong belief in family-centered approach',
          2: 'Generally aligned with some development needed',
          1: 'Misaligned with family preservation values'
        }
      },
      {
        id: 'VAL3',
        text: 'Non-judgmental approach with families',
        type: 'scale',
        required: true,
        rubric: {
          3: 'Demonstrated non-judgmental language and perspective',
          2: 'Generally non-judgmental with occasional slips',
          1: 'Concerning judgmental or stigmatizing attitudes'
        }
      },
      {
        id: 'VAL4',
        text: 'Professional boundaries understanding',
        type: 'scale',
        required: true,
        rubric: {
          3: 'Clear understanding of appropriate boundaries',
          2: 'Basic understanding, some areas need development',
          1: 'Boundary concerns identified'
        }
      },
      {
        id: 'VAL5',
        text: 'Self-care and burnout awareness',
        type: 'scale',
        required: true,
        rubric: {
          3: 'Has concrete self-care practices and insight',
          2: 'Awareness but practices are vague',
          1: 'Limited awareness or concerning lack of self-care'
        }
      },
      {
        id: 'VAL6',
        text: 'Accountability and growth orientation',
        type: 'scale',
        required: true,
        rubric: {
          3: 'Demonstrates accountability and eagerness to grow',
          2: 'Generally accountable, open to feedback',
          1: 'Defensive or avoids responsibility'
        }
      },
      {
        id: 'VAL7',
        text: 'Notes on values alignment:',
        type: 'textarea',
        required: false
      }
    ]
  },
  CLOSING: {
    id: 'closing',
    name: 'Closing Assessment',
    description: 'Final impressions and readiness evaluation',
    questions: [
      {
        id: 'CLS1',
        text: 'Quality of questions the candidate asked',
        type: 'scale',
        required: true,
        rubric: {
          3: 'Thoughtful, insightful questions showing genuine interest',
          2: 'Basic questions, adequate interest',
          1: 'No questions or only logistical concerns'
        }
      },
      {
        id: 'CLS2',
        text: 'Realistic expectations about the role',
        type: 'scale',
        required: true,
        rubric: {
          3: 'Clear-eyed about challenges, still committed',
          2: 'Somewhat realistic, minor concerns',
          1: 'Unrealistic expectations or major gaps'
        }
      },
      {
        id: 'CLS3',
        text: 'Motivation and commitment level',
        type: 'scale',
        required: true,
        rubric: {
          3: 'Genuine intrinsic motivation, mission-driven',
          2: 'Mixed motivation, adequate interest',
          1: 'Primarily external motivation'
        }
      },
      {
        id: 'CLS4',
        text: 'How well would this candidate fit with the current team?',
        type: 'scale',
        required: true
      },
      {
        id: 'CLS5',
        text: 'What level of supervision/support would this candidate need?',
        type: 'select',
        options: [
          { value: 'minimal', label: 'Minimal - Can work independently quickly' },
          { value: 'standard', label: 'Standard - Normal onboarding and supervision' },
          { value: 'intensive', label: 'Intensive - Will need significant support and mentoring' }
        ],
        required: true
      },
      {
        id: 'CLS6',
        text: 'What stood out most positively about this candidate?',
        type: 'textarea',
        required: true
      },
      {
        id: 'CLS7',
        text: 'What concerns, if any, arose during the interview?',
        type: 'textarea',
        required: true
      },
      {
        id: 'CLS8',
        text: 'Specific training or development needs identified:',
        type: 'textarea',
        required: false
      }
    ]
  },
  DECISION: {
    id: 'decision',
    name: 'Final Decision',
    description: 'Hiring recommendation and rationale',
    questions: [
      {
        id: 'DEC1',
        text: 'Overall Interview Score (1-10)',
        type: 'number',
        min: 1,
        max: 10,
        required: true
      },
      {
        id: 'DEC2',
        text: 'Green flags observed (select all that apply)',
        type: 'multiselect',
        options: GREEN_FLAGS,
        required: false
      },
      {
        id: 'DEC3',
        text: 'Red flags observed (select all that apply)',
        type: 'multiselect',
        options: RED_FLAGS,
        required: false
      },
      {
        id: 'DEC4',
        text: 'Hiring Recommendation',
        type: 'select',
        options: [
          { value: 'strong_yes', label: 'Strong Yes - Highly recommend hiring' },
          { value: 'yes', label: 'Yes - Recommend hiring' },
          { value: 'maybe', label: 'Maybe - Need reference check or second opinion' },
          { value: 'no', label: 'No - Do not recommend hiring' },
          { value: 'strong_no', label: 'Strong No - Significant concerns' }
        ],
        required: true
      },
      {
        id: 'DEC5',
        text: 'Detailed rationale for your recommendation:',
        type: 'textarea',
        required: true
      },
      {
        id: 'DEC6',
        text: 'Next steps or follow-up items:',
        type: 'textarea',
        required: false
      }
    ]
  }
};

// Decision Framework Logic
function calculateDecision(evaluation) {
  const overallScore = evaluation.overallScore || 0;
  const redFlagsCount = (evaluation.redFlags || []).length;
  const greenFlagsCount = (evaluation.greenFlags || []).length;

  if (overallScore >= 8 && greenFlagsCount >= 4 && redFlagsCount <= 1) {
    return {
      recommendation: 'STRONG YES',
      confidence: 'high',
      rationale: 'Excellent interview with strong alignment and minimal concerns'
    };
  }

  if (overallScore >= 7 && greenFlagsCount >= 3 && redFlagsCount <= 2) {
    return {
      recommendation: 'YES',
      confidence: 'high',
      rationale: 'Strong interview showing good fit and potential'
    };
  }

  if (overallScore >= 6 && redFlagsCount <= 2) {
    return {
      recommendation: 'MAYBE',
      confidence: 'medium',
      rationale: 'Moderate interview - reference check and team discussion recommended',
      nextSteps: ['Complete reference checks', 'Discuss with team', 'Consider second interview']
    };
  }

  if (overallScore < 5 || redFlagsCount >= 4) {
    return {
      recommendation: 'NO',
      confidence: 'high',
      rationale: 'Significant concerns identified during interview'
    };
  }

  return {
    recommendation: 'MAYBE',
    confidence: 'low',
    rationale: 'Mixed results - additional evaluation needed',
    nextSteps: ['Gather additional input', 'Review with supervisor']
  };
}

function calculateSectionScores(responses) {
  const sectionScores = {};

  Object.entries(EVALUATION_SECTIONS).forEach(([key, section]) => {
    const scaleQuestions = section.questions.filter(q => q.type === 'scale');
    const scaleResponses = responses.filter(r =>
      scaleQuestions.some(q => q.id === r.questionId) && r.value
    );

    if (scaleResponses.length > 0) {
      const total = scaleResponses.reduce((sum, r) => sum + (parseInt(r.value) || 0), 0);
      const average = total / scaleResponses.length;

      sectionScores[key] = {
        sectionName: section.name,
        average: Math.round(average * 100) / 100,
        rating: average >= 2.5 ? 'Strong' : average >= 1.5 ? 'Adequate' : 'Concern',
        questionsAnswered: scaleResponses.length,
        totalScaleQuestions: scaleQuestions.length
      };
    }
  });

  return sectionScores;
}

// API Routes

// Get interview form structure
router.get('/form', (req, res) => {
  res.json({
    success: true,
    sections: Object.values(EVALUATION_SECTIONS),
    evaluationScale: EVALUATION_SCALE,
    redFlags: RED_FLAGS,
    greenFlags: GREEN_FLAGS
  });
});

// Get question templates for interviewer reference
router.get('/templates/questions', (req, res) => {
  res.json({
    success: true,
    templates: QUESTION_TEMPLATES
  });
});

// Get specific section
router.get('/section/:sectionId', (req, res) => {
  const section = Object.values(EVALUATION_SECTIONS).find(
    s => s.id === req.params.sectionId
  );

  if (!section) {
    return res.status(404).json({
      success: false,
      message: 'Section not found'
    });
  }

  res.json({
    success: true,
    data: section,
    relatedQuestions: QUESTION_TEMPLATES[req.params.sectionId] || []
  });
});

// Get evaluation scale and flags
router.get('/scale', (req, res) => {
  res.json({
    success: true,
    scale: EVALUATION_SCALE,
    redFlags: RED_FLAGS,
    greenFlags: GREEN_FLAGS
  });
});

// Submit interview evaluation
router.post('/submit', (req, res) => {
  const { candidateInfo, interviewerInfo, responses, decision } = req.body;

  if (!candidateInfo || !candidateInfo.name) {
    return res.status(400).json({
      success: false,
      message: 'Candidate information is required'
    });
  }

  if (!interviewerInfo || !interviewerInfo.name) {
    return res.status(400).json({
      success: false,
      message: 'Interviewer information is required'
    });
  }

  if (!responses || !Array.isArray(responses)) {
    return res.status(400).json({
      success: false,
      message: 'Evaluation responses are required'
    });
  }

  if (!decision || typeof decision.overallScore !== 'number') {
    return res.status(400).json({
      success: false,
      message: 'Decision with overall score is required'
    });
  }

  const sectionScores = calculateSectionScores(responses);
  const decisionAnalysis = calculateDecision(decision);

  // Calculate overall section average
  const allAverages = Object.values(sectionScores).map(s => s.average);
  const overallAverage = allAverages.length > 0
    ? allAverages.reduce((a, b) => a + b, 0) / allAverages.length
    : 0;

  const report = {
    evaluationId: `EVAL-${Date.now()}`,
    timestamp: new Date().toISOString(),
    candidateInfo,
    interviewerInfo,
    sectionScores,
    overallSectionAverage: Math.round(overallAverage * 100) / 100,
    interviewScore: decision.overallScore,
    flags: {
      green: (decision.greenFlags || []).map(id => GREEN_FLAGS.find(f => f.id === id)).filter(Boolean),
      red: (decision.redFlags || []).map(id => RED_FLAGS.find(f => f.id === id)).filter(Boolean)
    },
    calculatedRecommendation: decisionAnalysis,
    interviewerRecommendation: decision.recommendation,
    rationale: decision.rationale,
    nextSteps: decision.nextSteps || decisionAnalysis.nextSteps || []
  };

  res.json({
    success: true,
    message: 'Evaluation submitted successfully',
    report
  });
});

// Quick decision calculator
router.post('/calculate-decision', (req, res) => {
  const { overallScore, redFlags, greenFlags } = req.body;

  if (typeof overallScore !== 'number') {
    return res.status(400).json({
      success: false,
      message: 'Overall score is required'
    });
  }

  const decision = calculateDecision({
    overallScore,
    redFlags: redFlags || [],
    greenFlags: greenFlags || []
  });

  res.json({
    success: true,
    input: {
      overallScore,
      redFlagsCount: (redFlags || []).length,
      greenFlagsCount: (greenFlags || []).length
    },
    decision
  });
});

module.exports = router;
