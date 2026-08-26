import Header from './components/Header'
import './App.css'

function App() {
  return (
    <div className="app">
      <Header />

      <main className="main-content">
        <section className="page-intro">
          <p className="eyebrow">LEARNING PLATFORM</p>

          <h1>Courses</h1>

          <p className="page-description">
            Build practical skills through structured training,
            assessments, and guided learning.
          </p>
        </section>

        <section className="course-placeholder">
          <p className="eyebrow">COURSES</p>

          <h2>Available courses</h2>

          <p>
            Course catalogue will appear here.
          </p>
        </section>
      </main>
    </div>
  )
}

export default App