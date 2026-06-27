# TechCore QA Workstation: Professional UAT Script Generator & Optimizer

An elegant, high-productivity web application built specifically for QA Engineers, Analysts, and Product Managers to draft, refine, and export professional User Acceptance Testing (UAT) scripts. 

This workstation bridges the gap between rapid, unstructured note-taking and the rigid, formal corporate Excel templates required for client sign-offs. Powered by Google Gemini AI, it helps transform bulleted lists into high-density, professional test scenarios with perfect formatting.

---

## 🚀 Key Features

### 🖥️ High-Density Grid Editor (WYSIWYG Workspace)
* **Excel-Aligned Structure**: An interactive workspace designed to mirror corporate spreadsheet standards.
* **Instant Step Manipulation**: Dynamically insert new test steps **above** or **below** any row with immediate step-number recalculations.
* **Granular Reordering**: Move steps up and down in the execution sequence with a single click.
* **Multi-Persona Testing**: Override the base test role at the step-level to represent complex user journeys (e.g., transitioning from an *Admin* to a *Standard Customer*).

### 🤖 Gemini AI Shorthand Transformer
* **Natural Language Expansion**: Write rapid, simplified notes (e.g., `1. Login -> see dash. 2. click search -> find user`) and let Gemini instantly build professional, polished steps.
* **Professional Tense Enforcement**: Automatically converts expected results into precise, professional present-tense assertions.
* **Integrity Flags (Needs Review)**: Automatically flags ambiguous notes, potential typos, or nonsense inputs with a **"Needs Review"** status so you never export errors.

### 📥 One-Click Corporate Excel Export (.xlsx)
* **True-to-Spec Formatting**: Exports directly to a highly polished Microsoft Excel sheet with exact styling, bold headers, and proper alignment.
* **Integrated Status Legend**: Generates color-coded status references aligned to standard QA definitions:
  * 🟢 **Passed** (As per Expected)
  * 🔴 **Failed** (Not as per Expected)
  * 🔵 **On-Hold** (Clarification Required)
* **Metadata Alignment**: Seamlessly binds script numbers, testing dates, sub-scenarios, and prerequisites directly into the sheet header.

### 💾 Local State Persistence
* **No Lost Work**: Automatically saves your in-progress scripts to the browser's `localStorage` to guard against unexpected tab closures or page refreshes.
* **Quick Reset**: One-click reset to easily wipe the workstation and start a brand-new test run.

---

## 🛠️ Technology Stack

* **Frontend Framework**: [React 18+](https://react.dev/) with [Vite](https://vitejs.dev/) for ultra-fast compilation and runtime performance.
* **Styling & Layout**: [Tailwind CSS v4](https://tailwindcss.com/) with custom typography and clean grid systems.
* **AI Orchestration**: [@google/genai](https://www.npmjs.com/package/@google/genai) SDK powering row-level and bulk-level transformations via Gemini.
* **Excel Engine**: [ExcelJS](https://github.com/exceljs/exceljs) for client-side generation of heavily styled spreadsheet structures.
* **Transitions**: [Motion (Framer Motion)](https://motion.dev/) for smooth, context-preserving tab changes and collapse animations.

---

## 📦 Getting Started

### Prerequisites
Make sure you have Node.js (v18 or higher) installed on your local machine.

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/uat-script-generator.git
   cd uat-script-generator
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_google_gemini_api_key_here
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   *Your server will boot on `http://localhost:3000`.*

### Building for Production
To bundle the application into highly optimized static assets:
```bash
npm run build
```
This output is written directly to the `/dist` directory and is ready for static web servers like Nginx, AWS S3, or Netlify.

---

## 📊 File Architecture

```
├── src/
│   ├── components/       # Reusable interactive components
│   ├── lib/
│   │   ├── excel.ts      # Core ExcelJS blueprint & export configurations
│   │   └── gemini.ts     # Google GenAI model configurations & prompts
│   ├── types.ts          # Strongly typed TypeScript contracts
│   ├── App.tsx           # High-density UI layout & State controls
│   ├── index.css         # Tailwind directives & typography overrides
│   └── main.tsx          # React application entry-point
├── public/               # Static assets & icons
├── metadata.json         # Platform configuration
├── package.json          # Dependencies & scripts
└── README.md             # This comprehensive workstation manual
```

---

## 📝 Usage Best Practices

1. **Keep Shorthand Intuitive**: When using the **Bulk Import** feature, use simple pointer notations such as `->` or `.` to indicate transitions.
   * *Good Shorthand*: `1. Admin panel -> click users -> see user list table.`
2. **Review Ambiguities**: Check any rows highlighted in soft orange. Click the ✅ **Mark Reviewed** button once you are satisfied with the AI outputs to reach a 100% completion rate.
3. **Double-Check Metadata**: Update the Script Number, Sub-Scenario Title, and Prerequisites on the collapsible left-hand menu before exporting. This ensures your final `.xlsx` file renders with correct and complete credentials.

---

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.
