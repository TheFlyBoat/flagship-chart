# GEMINI.md

## Project Overview

This is a web application designed to help users explore and discover potential career paths. It functions as a "Career Navigator," taking user inputs such as current role, industry, skills, interests, and education to generate a personalized career profile and suggest new career avenues.

The application is built as a multi-step interactive journey. It uses the Google Gemini API to intelligently analyze the user's profile, generate a professional "Career Identity Statement," and recommend a diverse set of career paths. The frontend is built with React and TypeScript, and it uses D3.js for data visualization, likely to display the career paths in an engaging graphical format (e.g., a web or archipelago).

## Building and Running

The project is built using Vite.

**Prerequisites:**
*   Node.js
*   A Gemini API Key

**Key Commands:**

*   **Install Dependencies:**
    ```bash
    npm install
    ```

*   **Set Up Environment:**
    Create a `.env.local` file in the root of the project and add your Gemini API key:
    ```
    GEMINI_API_KEY=your_api_key_here
    ```

*   **Run Development Server:**
    This command starts the app on `http://localhost:3000`.
    ```bash
    npm run dev
    ```

*   **Build for Production:**
    This command compiles the application into a `dist/` directory.
    ```bash
    npm run build
    ```

*   **Preview Production Build:**
    This command serves the production build locally.
    ```bash
    npm run preview
    ```

## Development Conventions

*   **Technology Stack:**
    *   **Frontend:** React, TypeScript
    *   **Build Tool:** Vite
    *   **AI/Language Model:** Google Gemini API (`@google/genai`)
    *   **Data Visualization:** D3.js
    *   **Styling:** Utility-first CSS (likely Tailwind CSS, based on class names).

*   **Project Structure:**
    *   `src/components/`: Contains reusable React components that make up the UI.
    *   `src/services/`: Houses modules that interact with external APIs, specifically `geminiService.ts` for all Gemini API calls.
    *   `src/types.ts`: Defines the core data structures and types used throughout the application.
    *   `App.tsx`: The main application component that manages state and the user flow.

*   **API Interaction:**
    All interactions with the Google Gemini API are centralized in `services/geminiService.ts`. This service uses structured schemas to enforce the shape of the JSON data returned by the API, ensuring type safety and predictable responses.

*   **State Management:**
    The primary application state and logic for navigating between different steps of the user journey are managed within the `App.tsx` component.
