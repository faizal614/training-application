import { Navigate, Route, Routes } from 'react-router-dom'

import Header from './components/Header'

import Courses from './pages/Courses'
import CourseDetails from './pages/CourseDetails'
import ModuleDetails from './pages/ModuleDetails'
import QuizPage from './pages/QuizPage'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import Certificate from './pages/Certificate'
import ModulePage from './pages/ModulePage'
import CertificatePage from './pages/CertificatePage'
import AdminDashboard from './pages/AdminDashboard'
import AdminInstructors from './pages/AdminInstructors'

import './App.css'

function App() {
  return (
    <div className="app">
      <Header />

      <Routes>

        {/* HOME */}
        <Route
          path="/"
          element={
            <Navigate
              to="/courses"
              replace
            />
          }
        />

        {/* AUTHENTICATION */}
        <Route
          path="/signin"
          element={<SignIn />}
        />

        <Route
          path="/signup"
          element={<SignUp />}
        />

        {/* COURSES */}
        <Route
          path="/courses"
          element={<Courses />}
        />

        <Route
          path="/courses/:courseId"
          element={<CourseDetails />}
        />

        {/* MODULE */}
        <Route
          path="/modules/:moduleId"
          element={<ModuleDetails />}
        />

        {/* QUIZ */}
        <Route
          path="/modules/:moduleId/quiz"
          element={<QuizPage />}
        />

        {/* CERTIFICATE */}
        <Route
          path="/certificates/:certificateNumber"
          element={<Certificate />}
        />

        {/* EXISTING COURSE ROUTES */}
        <Route
          path="/courses/:courseId"
          element={<CourseDetails />}
        />

        <Route
          path="/courses/:courseId/modules/:moduleId"
          element={<ModulePage />}
        />

        <Route
          path="/courses/:courseId/modules/:moduleId/quiz"
          element={<QuizPage />}
        />

        <Route
          path="/courses/:courseId/certificate"
          element={<CertificatePage />}
        />

        {/* =================================================
            ADMIN
        ================================================= */}

        <Route
          path="/admin"
          element={<AdminDashboard />}
        />

        <Route
          path="/admin/instructors"
          element={<AdminInstructors />}
        />

      </Routes>
    </div>
  )
}

export default App