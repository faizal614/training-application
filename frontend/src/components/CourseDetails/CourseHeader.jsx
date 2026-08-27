function CourseHeader({
  course,
  enrolled,
  enrolling,
  onEnroll,
  error,
}) {
  return (
    <section className="page-intro">
      <p className="eyebrow">
        COURSE {course.id}
      </p>

      <h1>{course.title}</h1>

      <p className="page-description">
        {course.description}
      </p>

      {!enrolled && (
        <button
          type="button"
          className="auth-button"
          onClick={onEnroll}
          disabled={enrolling}
        >
          {enrolling
            ? 'Enrolling...'
            : 'Enroll in Course'}
        </button>
      )}

      {enrolled && (
        <p>
          <strong>
            You are enrolled in this course.
          </strong>
        </p>
      )}

      {error && (
        <p className="auth-error">
          {error}
        </p>
      )}
    </section>
  )
}

export default CourseHeader