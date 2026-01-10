/**
 * Employee Reviews Module
 * Handles performance review submissions and email notifications
 */

const express = require('express');
const router = express.Router();
const { sendReviewNotification } = require('../integrations/email');

// Submit employee review
router.post('/submit', async (req, res) => {
  try {
    const reviewData = req.body;

    // Validate required fields
    if (!reviewData.employeeName || !reviewData.reviewDate || !reviewData.supervisor || !reviewData.reviewType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: employeeName, reviewDate, supervisor, reviewType'
      });
    }

    // Generate review ID
    const reviewId = `REV-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Add review ID to data
    reviewData.reviewId = reviewId;

    // Send email notification
    const emailResult = await sendReviewNotification(reviewData);

    if (!emailResult.sent) {
      console.warn('Email not sent:', emailResult.reason || emailResult.error);
    }

    res.json({
      success: true,
      reviewId,
      emailSent: emailResult.sent,
      message: emailResult.sent
        ? 'Review submitted and email sent successfully'
        : 'Review submitted but email not sent (check email configuration)',
      submittedAt: reviewData.submittedAt
    });

  } catch (error) {
    console.error('Review submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit review',
      error: error.message
    });
  }
});

// Get review form configuration (for future extensibility)
router.get('/config', (req, res) => {
  res.json({
    success: true,
    config: {
      categories: [
        {
          id: 'performance',
          name: 'Job Performance',
          criteria: ['Accountability', 'Problem Solving', 'Quality of Work', 'Time Management', 'Professionalism']
        },
        {
          id: 'relationship',
          name: 'Relationship',
          criteria: ['Clients', 'Coworkers', 'Consumers', 'Public']
        },
        {
          id: 'governance',
          name: 'Governance & Compliance',
          criteria: ['Policies & Procedures', 'Certifications', 'Licensures', 'Safety', 'Reporting', 'Documentation']
        }
      ],
      ratingScale: [
        { value: 5, label: 'Significant Strength' },
        { value: 4, label: 'Strength' },
        { value: 3, label: 'Acceptable' },
        { value: 2, label: 'Needs Development' },
        { value: 1, label: 'Needs Significant Development' }
      ],
      reviewTypes: [
        { value: '6-month', label: '6 Month Initial Review', bonusEligible: false },
        { value: '12-month', label: '12 Month Evaluation', bonusEligible: true },
        { value: 'annual', label: 'Annual Review', bonusEligible: false }
      ],
      bonusTiers: [
        { minAverage: 5.0, amount: '$100' },
        { minAverage: 4.0, amount: '$80' },
        { minAverage: 3.0, amount: '$60' }
      ]
    }
  });
});

module.exports = router;
