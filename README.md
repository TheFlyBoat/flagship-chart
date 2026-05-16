# Flagship Chart: Navigate Your Career

Live app: https://flagshipchart.web.app/

An AI-powered career navigation app that maps your professional identity to the roles you haven't discovered yet.

Flagship Chart takes your current experience, skills, and interests and uses Google Gemini to build a personalized career profile — then surfaces a set of tailored career paths visualized in an interactive chart, complete with skill match scores, market demand signals, salary ranges, and the certifications worth pursuing.

---

# Features

- **Multi-step career intake** — guided 8-step journey capturing your roles, industries, tasks, skills, interests, and education
- **AI-generated career identity** — Gemini analyzes your profile and writes a professional identity statement along with your transferable skill set
- **Career path recommendations** — receive a curated set of paths ranked by skill match percentage, with market demand, salary range, required skills, and suggested certifications
- **Interactive D3 visualization** — explore your career options in an engaging graphical chart
- **Regenerate on demand** — not happy with the suggestions? Re-run the AI analysis without re-entering your data

---

# Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript |
| Build Tool | Vite |
| AI / LLM | Google Gemini API (`@google/genai`) |
| Data Visualization | D3.js |
| Hosting / Backend | Firebase |
| Icons | Lucide React |
| Styling | Tailwind CSS |
| String Matching | fast-levenshtein |

---

# Project Structure

```
flagship-chart/
├── components/          # React UI components
│   ├── WelcomeScreen    # Landing page
│   ├── Step1Form        # Multi-step intake form
│   ├── Step2Identity    # AI identity generation screen
│   ├── Step3Explore     # Career path explorer with D3 chart
│   ├── InfoMenu         # Info/help overlay
│   └── icons/           # SVG icon components (incl. FlagshipChartTextLogo)
├── services/
│   └── geminiService.ts # All Google Gemini API calls, with structured JSON schemas
├── App.tsx              # Root component — manages app state and step navigation
├── index.tsx            # App entry point
├── types.ts             # Shared TypeScript interfaces
├── vite.config.ts       # Vite configuration
├── firebase.json        # Firebase hosting config
└── .firebaserc          # Firebase project alias
```

---

# Getting Started

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/TheFlyBoat/flagship-chart.git
cd flagship-chart
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file in the project root and add your Gemini API key:

```env
GEMINI_API_KEY=your_api_key_here
```

4. Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

---

##Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the local development server |
| `npm run build` | Compile the app for production into `dist/` |
| `npm run preview` | Serve the production build locally for testing |

---

# How It Works

## 1. Intake Form
The user walks through an 8-step guided form, providing:
- **Role & Industry** — current or most recent position
- **Tasks** — what they actually do day-to-day
- **Skills** — technical and soft skills
- **Interests** — domains and topics they want to move toward
- **Education** — degrees, bootcamps, or certifications

Multiple past experiences can be added to build a richer profile.

## 2. AI Identity Generation
The completed profile is sent to the Gemini API via `services/geminiService.ts`. Gemini returns a structured JSON response containing:
- A **career identity statement** — a professional summary synthesizing the user's background
- A list of **transferable skills** — capabilities that carry across industries and roles

All API calls use typed JSON schemas to enforce the shape of the response, ensuring type-safe data throughout the app.

## 3. Career Path Explorer
Gemini also recommends a set of `CareerPath` objects, each containing:

```ts
{
  title: string;                  // e.g. "UX Researcher"
  skillMatchPercentage: number;   // 0–100
  marketDemand: string;           // e.g. "High", "Growing"
  industry: string;
  relevanceTags: RelevanceTag[];  // tagged to experience / skill / interest / education
  description?: string;
  requiredSkills?: string[];
  salaryRange?: string;
  certifications?: string[];
  experienceNeeded?: string;
}
```

These paths are rendered as an interactive D3.js chart, letting users explore visually and drill into any path for details. Users can regenerate results at any point without re-entering their data.

---

# Deployment

The app is configured for Firebase Hosting. To deploy:

1. Install the Firebase CLI if you haven't already:

```bash
npm install -g firebase-tools
```

2. Log in and build:

```bash
firebase login
npm run build
```

3. Deploy:

```bash
firebase deploy
```

> **Note:** Make sure your Gemini API key is configured appropriately for your production environment. Do not commit `.env.local` to version control — it is already listed in `.gitignore`.

---

# Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Your Google Gemini API key from [AI Studio](https://aistudio.google.com/app/apikey) |

---

# Contributing

Contributions are welcome. To get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit: `git commit -m "Add your feature"`
4. Push to your fork: `git push origin feature/your-feature-name`
5. Open a pull request

Please keep PRs focused — one feature or fix per PR makes review much faster.

---

# License

This project is private and not currently licensed for public distribution. Contact the repository owner for usage inquiries.
