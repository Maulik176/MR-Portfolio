# Interview War Room 🛡️🎯
A generative UI “war room” that turns interview anxiety into a structured plan, mock practice, scoring, and iteration — powered by **Tambo**.

> **One-line pitch:**  
> Type what you need (“3 days left, weak in system design”) and the UI transforms instantly into the right workspace: **Plan → Mock → Evaluate → Improve → Progress**.

---

## Why this exists (Hackathon goal)
Most interview prep tools are either resource dumps or chatbots. This project is different:
- The UI is **AI-driven** (not just text responses)
- You can **take actions** (start mock, evaluate, rewrite, export)
- It’s built to deliver a **podium-worthy 120s demo**

---

## Key capabilities (MVP)
### 1) Plan Mode
Generate a day-by-day timeboxed plan with clear outcomes + a checklist.

### 2) Mock Mode
Run a structured mock interview session (category + difficulty), track Q/A.

### 3) Evaluate + Improve
Score answers via a rubric, generate targeted feedback, rewrite improved answers, and generate follow-up questions.

### 4) Progress Mode
Track weakness heatmap + readiness score + “next best action”.

### 5) Export Pack
Export plan + best answers + weak areas into a copyable pack.

## Tambo usage (what makes this a “Best use of Tambo” project)
This app is intentionally designed to maximize Tambo features:
- **Generative UI components**: AI selects which component(s) to render based on intent
- **Interactable components**: buttons/actions trigger tools and update the UI
- **Structured tool outputs**: tools return JSON that matches strict Zod schemas

---

## Planned component catalog (MVP)
- InterviewIntakeCard
- SkillSelfAssessment
- TimeboxedPlanTimeline
- DailyChecklist
- MockInterviewPanel
- QuestionBankBrowser
- RubricScorecard
- AnswerRewriteDiff
- FollowupQuestionsCard
- WeaknessHeatmap
- ReadinessGauge
- ExportPackCard

(Full intent + schema mapping lives in `docs/COMPONENT_CATALOG.md`.)

---

## 120-second demo script (podium cut)
**Prompt:** “Frontend interview in 3 days. Weak in system design. Make me a plan.”  
→ renders **PlanTimeline + TodayChecklist**

**Click:** “Start Mock (System Design)”  
→ renders **MockInterviewPanel**

**Paste answer → Click:** “Evaluate”  
→ renders **RubricScorecard + feedback**

**Click:** “Improve answer”  
→ renders **AnswerRewriteDiff + Followups**

→ updates **WeaknessHeatmap + ReadinessGauge**

**Click:** “Export Pack”  
→ outputs copyable pack

Full script: `docs/DEMO_SCRIPT.md`

---

## Project docs (source of truth)
All product + workflow rules live in `/docs`:

- `docs/PRD.md` — full Product Requirements Document
- `docs/PLAN.md` — vertical-slice execution plan + definition of done
- `docs/AGENTS.md` — engineering standards + architecture rules (source of truth)
- `docs/COMPONENT_CATALOG.md` — component intent mapping + schemas
- `docs/DEMO_SCRIPT.md` — demo narrative + wow prompts
- `docs/CODEX.md` — rules for AI assistants to follow (stay in scope, ship with quality)

---

## Dev
Run the app from the generated Tambo project under `/app`:

```bash
cd app
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Notes:
- Set `NEXT_PUBLIC_TAMBO_API_KEY` in `/app/.env.local` before testing chat flows.

---
## Development status
🚧 **Planning phase.**  
Per hackathon rules, implementation begins at kickoff. This repo currently contains product docs and execution guidelines.

---

## License
TBD (will set during hackathon submission)
