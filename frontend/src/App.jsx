import { useEffect } from 'react'
import {
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'

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
import InstructorManagement from './pages/admin/InstructorManagement'
import CreateInstructor from './pages/admin/CreateInstructor'
import ManageInstructors from './pages/admin/ManageInstructors'
import AssignInstructorCourses from './pages/admin/AssignInstructorCourses'
import InstructorCourses from './pages/admin/InstructorCourses'
import InstructorAccess from './pages/admin/InstructorAccess'
import ManageCourses from './pages/admin/ManageCourses'
import ManageModules from './pages/admin/ManageModules'
import ManageContent from './pages/admin/ManageContent'
import ManageQuiz from './pages/admin/ManageQuiz'
import ManageLearners from './pages/admin/ManageLearners'
import Progress from './pages/admin/Progress'
import Certificates from './pages/admin/Certificates'

import InstructorDashboard from './pages/instructor/InstructorDashboard'
import ManageCourse from './pages/instructor/ManageCourse'
import GoogleCallback from './pages/GoogleCallback'
import GithubLink from './components/GithubLink'

import './App.css'


// =========================================================
// SCROLL TO TOP ON EVERY ROUTE CHANGE
// =========================================================

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto',
    })
  }, [pathname])

  return null
}


// =========================================================
// APP
// =========================================================

function App() {
  return (
    <div className="app">

      {/* Scroll page to top whenever route changes */}
      <ScrollToTop />

      {/* Header */}
      <Header />

      {/* ===================================================
          ROUTES
      =================================================== */}

      <Routes>

        {/* =====================================================
            HOME
        ===================================================== */}

        <Route
          path="/"
          element={
            <Navigate
              to="/signin"
              replace
            />
          }
        />


        {/* =====================================================
            AUTHENTICATION
        ===================================================== */}

        <Route
          path="/signin"
          element={<SignIn />}
        />

        <Route
          path="/signup"
          element={<SignUp />}
        />


        {/* =====================================================
            LEARNER - COURSES
        ===================================================== */}

        <Route
          path="/courses"
          element={<Courses />}
        />

        <Route
          path="/courses/:courseId"
          element={<CourseDetails />}
        />


        {/* =====================================================
            LEARNER - MODULES
        ===================================================== */}

        <Route
          path="/modules/:moduleId"
          element={<ModuleDetails />}
        />

        <Route
          path="/courses/:courseId/modules/:moduleId"
          element={<ModulePage />}
        />


        {/* =====================================================
            LEARNER - QUIZ
        ===================================================== */}

        <Route
          path="/modules/:moduleId/quiz"
          element={<QuizPage />}
        />

        <Route
          path="/courses/:courseId/modules/:moduleId/quiz"
          element={<QuizPage />}
        />


        {/* =====================================================
            LEARNER - CERTIFICATES
        ===================================================== */}

        <Route
          path="/certificates/:certificateNumber"
          element={<Certificate />}
        />

        <Route
          path="/courses/:courseId/certificate"
          element={<CertificatePage />}
        />


        {/* =====================================================
            ADMIN DASHBOARD
        ===================================================== */}

        <Route
          path="/admin"
          element={<AdminDashboard />}
        />


        {/* =====================================================
            ADMIN - INSTRUCTOR MANAGEMENT
        ===================================================== */}

        <Route
          path="/admin/instructors"
          element={<InstructorManagement />}
        />

        <Route
          path="/admin/instructors/create"
          element={<CreateInstructor />}
        />

        <Route
          path="/admin/instructors/manage"
          element={<ManageInstructors />}
        />

        <Route
          path="/admin/instructors/assign-courses"
          element={<AssignInstructorCourses />}
        />

        <Route
          path="/admin/instructors/courses"
          element={<InstructorCourses />}
        />

        <Route
          path="/admin/instructors/access"
          element={<InstructorAccess />}
        />


        {/* =====================================================
            ADMIN - COURSES
        ===================================================== */}

        <Route
          path="/admin/courses"
          element={<ManageCourses />}
        />


        {/* =====================================================
            ADMIN - MODULES
        ===================================================== */}

        <Route
          path="/admin/modules"
          element={<ManageModules />}
        />


        {/* =====================================================
            ADMIN - CONTENT
        ===================================================== */}

        <Route
          path="/admin/content"
          element={<ManageContent />}
        />


        {/* =====================================================
            ADMIN - QUIZZES
        ===================================================== */}

        <Route
          path="/admin/quizzes"
          element={<ManageQuiz />}
        />


        {/* =====================================================
            ADMIN - LEARNERS
        ===================================================== */}

        <Route
          path="/admin/learners"
          element={<ManageLearners />}
        />


        {/* =====================================================
            ADMIN - PROGRESS
        ===================================================== */}

        <Route
          path="/admin/progress"
          element={<Progress />}
        />


        {/* =====================================================
            ADMIN - CERTIFICATES
        ===================================================== */}

        <Route
          path="/admin/certificates"
          element={<Certificates />}
        />


        {/* =====================================================
            INSTRUCTOR DASHBOARD
        ===================================================== */}

        <Route
          path="/instructor"
          element={<InstructorDashboard />}
        />


        {/* =====================================================
            INSTRUCTOR - MANAGE COURSE
        ===================================================== */}

        <Route
          path="/instructor/course/:courseId"
          element={<ManageCourse />}
        />

        <Route
          path="/google-callback"
          element={<GoogleCallback />}
        />

      </Routes>
      <GithubLink />
    </div>
  )
}

export default App