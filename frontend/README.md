# DataCaliper Frontend

React/Vite frontend for the DataCaliper Training App.

## Stack

- React
- Vite
- React Router
- JavaScript / JSX
- Vitest
- React Testing Library

## Structure

```text
frontend/
├── src/
│   ├── components/
│   ├── context/
│   ├── pages/
│   ├── test/
│   └── utils/
├── package.json
└── vite.config.js
```

## Setup

From the frontend directory:

```powershell
npm install
```

## Run Development Server

```powershell
npm run dev
```

The frontend normally runs at:

```text
http://localhost:5173
```

The frontend communicates with the FastAPI backend running locally on:

```text
http://127.0.0.1:8000
```

## Testing

Run the complete frontend test suite:

```powershell
npm test -- --run
```

The current suite covers:

- Courses page
- Local sign-in
- Google authentication callback
- Quiz success
- Quiz failure and retry
- Exhausted quiz attempts and module redo
- Certificate generation after completing the final module

Current frontend test count:

```text
12 passing
```

## Main Routes

The frontend includes routes for:

- Sign in
- Sign up
- Course catalogue
- Course details
- Module learning
- Module quizzes
- Certificates
- Admin dashboard and management
- Instructor dashboard and course management
- Google authentication callback

## Authentication

Local authentication stores the JWT access token in the browser and uses it for authenticated API requests.

Google sign-in redirects to the backend OAuth flow and returns to the frontend callback route after authentication.

## Build

Create a production build with:

```powershell
npm run build
```

Preview the production build with:

```powershell
npm run preview
```

## Notes

Keep API configuration and other environment-specific values out of source control when applicable.

The floating GitHub button is implemented as a reusable component so it can appear consistently across application pages.
