# Epworth Village Integrated Assistant

A comprehensive resource management and recruitment intelligence system for Epworth Family Resources, serving Southeast Nebraska.

## 🎯 Purpose

This application provides three core modules:
1. **Community Resource Knowledge Base** - 225+ localized resources for Southeast Nebraska
2. **Professional Personality Assessment Engine** - 6-dimension scoring system with 4 archetypes
3. **Post-Interview Reflection & Scoring Rubric** - Structured hiring evaluation system

## 💜 Core Values

- **Trauma-Informed Care** - Understanding and responding to the impact of trauma
- **Family Preservation** - Keeping families together safely when possible
- **Professional Growth** - Continuous learning and development
- **Accountability** - Taking responsibility for actions and outcomes

## 📁 Project Structure

```
├── server.js                    # Express server entry point
├── package.json                 # Node.js dependencies
├── .env.example                 # Environment variables template
├── modules/
│   ├── resources.js             # Community resource database (225+ entries)
│   ├── assessment.js            # Personality assessment engine
│   └── interview.js             # Interview evaluation system
├── integrations/
│   └── googleSheets.js          # Google Sheets API integration
├── scripts/
│   └── google-apps-script.js    # Google Apps Script for form automation
└── public/
    ├── index.html               # Main web interface
    ├── css/styles.css           # Application styles
    └── js/app.js                # Frontend JavaScript
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Google Cloud Project (for Sheets integration)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd epworth-village-assistant
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your Google Sheets credentials
```

4. Start the development server:
```bash
npm run dev
```

5. Open http://localhost:3000 in your browser

## 📊 Module Details

### 1. Community Resource Knowledge Base

Contains 225+ resources organized by:
- **Categories**: Basic Needs, Mental Health, Youth Support, Aging, Legal, Transportation, Housing, Employment, Education, Healthcare, Domestic Violence, Substance Abuse
- **Counties**: Gage, Saline, Fillmore, Seward, Jefferson, Polk, Butler, York

**Primary Hubs:**
- BVCA: (402) 729-2278 - Basic Needs/WIC
- Hope Crisis Center: (877) 388-4673 - Domestic Violence
- Fillmore County Hospital: (402) 759-3167 - Behavioral Health

**API Endpoints:**
- `GET /api/resources` - All resources
- `GET /api/resources/hubs` - Primary hubs only
- `GET /api/resources/category/:category` - Filter by category
- `GET /api/resources/county/:county` - Filter by county
- `GET /api/resources/search?q=&category=&county=` - Search resources
- `POST /api/resources/match` - Client needs matcher

### 2. Personality Assessment Engine

**6 Dimensions:**
- **A**: People-Focused (Odd) vs Task-Focused (Even)
- **B**: Structure (Odd) vs Flexibility (Even)
- **C**: Independent (Odd) vs Collaborative (Even)
- **D**: Stability (Odd) vs Innovation (Even)
- **E**: Harmony (Odd) vs Truth/Challenge (Even)
- **F**: Internal Stress (Odd) vs External Support (Even)

**4 Archetypes:**
1. **Relationship Builder** - Excels at building trust and rapport
2. **Thoughtful Organizer** - Systematic thinker with strong follow-through
3. **Adaptive Connector** - Versatile team player, bridges perspectives
4. **Careful Listener** - Observant and empathetic, creates safe spaces

**API Endpoints:**
- `GET /api/assessment/questions` - Get assessment questions
- `GET /api/assessment/dimensions` - Get dimension descriptions
- `GET /api/assessment/archetypes` - Get archetype details
- `POST /api/assessment/submit` - Submit and score assessment

### 3. Interview Evaluation System

**Sections:**
1. Interview Reflection
2. Scenario Thinking
3. Self-Assessment (1-10 Scale)
4. Values Alignment
5. Team & Support Needs
6. Decision & Commitment

**Evaluation Criteria:**
- Scale: 3 (Strong), 2 (Adequate), 1 (Concern)

**Red Flags:**
- Vague answers
- Lack of weakness awareness
- External motivation only
- Defensive tone

**Green Flags:**
- Growth mindset
- Vulnerability
- Specific examples
- Mission connection

**Decision Framework:**
- **Offer**: Score 8-10 + Strong Green Flags
- **Maybe**: Score 6-7 + Mixed Flags (Reference Check)
- **No**: Score <5 + Red Flags

**API Endpoints:**
- `GET /api/interview/form` - Get evaluation form structure
- `GET /api/interview/scale` - Get evaluation scales and flags
- `GET /api/interview/framework` - Get decision framework
- `POST /api/interview/submit` - Submit evaluation
- `POST /api/interview/calculate-decision` - Preview decision

## 🔗 Google Sheets Integration

### Setup

1. Create a Google Cloud Project
2. Enable the Google Sheets API
3. Create a Service Account
4. Download the credentials JSON
5. Share your spreadsheet with the service account email
6. Update `.env` with credentials

### Sheet Structure

The application uses these sheets:
- **Candidates** - Basic candidate information
- **Personality Assessments** - Assessment results
- **Interview Evaluations** - Interview scores and recommendations
- **Hiring Decisions** - Final hiring decisions
- **Resource Directory** - Community resources

### Google Apps Script

For automated form processing:
1. Open your Google Sheet
2. Go to Extensions > Apps Script
3. Paste contents of `scripts/google-apps-script.js`
4. Set up triggers for form submissions
5. Run `initializeSpreadsheet()` once to set up headers

## 🛠 API Reference

### Health Check
```
GET /api/health
```

### Sheets Integration
```
GET /api/sheets/status - Connection status
POST /api/sheets/initialize - Set up sheet structure
POST /api/sheets/candidates - Add candidate
POST /api/sheets/assessments - Save assessment
POST /api/sheets/interviews - Save interview
POST /api/sheets/decisions - Record decision
GET /api/sheets/search?q= - Search across sheets
GET /api/sheets/export/:sheetName - Export as JSON
```

## 📱 Features

- Responsive design for mobile and desktop
- Real-time scoring and recommendations
- Client needs matching algorithm
- Print-friendly reports
- Google Sheets sync for legacy system integration

## 🔒 Security Considerations

- Never commit `.env` file with credentials
- Use environment variables for all secrets
- Validate all input on the server
- Implement rate limiting for production
- Add authentication for production use

## 📄 License

ISC

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

**Epworth Village Family Resources**  
2119 Division Ave, York, NE 68467  
(402) 362-3353  
www.epworthvillage.org
# EFR-New-Hire-Hub
