function ModuleQuiz({
  quiz,
  questions,
  selectedAnswers,
  quizResult,
  quizLoading,
  submittingQuiz,
  quizError,
  onAnswerChange,
  onSubmit,
  isLastModule,
  onNextModule,
  onCompleteCourse,
  certificateLoading,
  isModuleCompleted,
}) {
  if (isModuleCompleted) {
    return (
      <section className="quiz-section">
        <p className="eyebrow">
          MODULE COMPLETED
        </p>

        <h2>
          Assessment completed
        </h2>

        <p className="module-completed-message">
          You have already passed this module.
          The training content remains available
          for you to review whenever you need it.
        </p>
      </section>
    )
  }

  /*
   * Determine whether the learner has exhausted
   * all available attempts.
   *
   * quizResult exists after a submission.
   */
  const attemptsExhausted =
    quizResult &&
    !quizResult.passed &&
    quizResult.attempts_remaining === 0

  return (
    <section className="quiz-section">
      <p className="eyebrow">
        ASSESSMENT
      </p>

      <h2>
        {quiz
          ? quiz.title
          : 'Module quiz'}
      </h2>

      {quizLoading && (
        <p>Loading quiz...</p>
      )}

      {!quizLoading &&
        !quiz &&
        !quizError && (
          <p>
            No quiz is available for this
            module yet.
          </p>
        )}

      {quizError && (
        <p className="auth-error">
          {quizError}
        </p>
      )}

      {/* -------------------------------- */}
      {/* ATTEMPT INFORMATION */}
      {/* -------------------------------- */}

      {!quizLoading &&
        quiz &&
        !quizError &&
        !quizResult && (
          <div className="quiz-attempt-info">
            <p>
              <strong>
                Maximum attempts:
              </strong>{' '}
              {quiz.max_attempts}
            </p>

            <p>
              You can attempt this quiz up to{' '}
              <strong>
                {quiz.max_attempts}
              </strong>{' '}
              time
              {quiz.max_attempts === 1
                ? ''
                : 's'}.
            </p>
          </div>
        )}

      {/* -------------------------------- */}
      {/* NO QUESTIONS */}
      {/* -------------------------------- */}

      {!quizLoading &&
        quiz &&
        questions.length === 0 &&
        !quizError && (
          <p>
            No questions are available for
            this quiz yet.
          </p>
        )}

      {/* -------------------------------- */}
      {/* QUIZ FORM */}
      {/* -------------------------------- */}

      {!quizLoading &&
        quiz &&
        questions.length > 0 &&
        !attemptsExhausted && (
          <form
            onSubmit={onSubmit}
            className="quiz-form"
          >
            {questions.map(
              (question, questionIndex) => (
                <fieldset
                  key={question.id}
                  className="quiz-question"
                >
                  <legend>
                    {questionIndex + 1}.{' '}
                    {question.question_text}
                  </legend>

                  {question.answers &&
                    question.answers.map(
                      (answer) => (
                        <label
                          key={answer.id}
                          className="quiz-answer"
                        >
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={answer.id}
                            checked={
                              selectedAnswers[
                                question.id
                              ] === answer.id
                            }
                            onChange={() =>
                              onAnswerChange(
                                question.id,
                                answer.id
                              )
                            }
                          />

                          <span>
                            {answer.answer_text}
                          </span>
                        </label>
                      )
                    )}
                </fieldset>
              )
            )}

            <button
              type="submit"
              className="auth-button"
              disabled={submittingQuiz}
            >
              {submittingQuiz
                ? 'Submitting...'
                : 'Submit Quiz'}
            </button>
          </form>
        )}

      {/* -------------------------------- */}
      {/* QUIZ RESULT */}
      {/* -------------------------------- */}

      {quizResult && (
        <div
          className={`quiz-result ${
            quizResult.passed
              ? 'quiz-result--passed'
              : 'quiz-result--failed'
          }`}
        >
          <h3>
            {quizResult.passed
              ? 'Quiz Passed'
              : 'Quiz Not Passed'}
          </h3>

          <p>
            Score:{' '}
            <strong>
              {Math.round(quizResult.score)}%
            </strong>
          </p>

          <p>
            Passing score:{' '}
            <strong>
              {quizResult.passing_score}%
            </strong>
          </p>

          {/* -------------------------------- */}
          {/* ATTEMPT INFORMATION */}
          {/* -------------------------------- */}

          <div className="quiz-attempt-info">
            <p>
              Attempts used:{' '}
              <strong>
                {quizResult.attempts_used}
              </strong>{' '}
              /{' '}
              <strong>
                {quizResult.max_attempts}
              </strong>
            </p>

            <p>
              Attempts remaining:{' '}
              <strong>
                {quizResult.attempts_remaining}
              </strong>
            </p>
          </div>

          {/* -------------------------------- */}
          {/* PASSED */}
          {/* -------------------------------- */}

          {quizResult.passed && (
            <>
              <p>
                This module has been completed.
              </p>

              {!isLastModule && (
                <button
                  type="button"
                  className="auth-button"
                  onClick={onNextModule}
                >
                  Next Module
                </button>
              )}

              {isLastModule && (
                <button
                  type="button"
                  className="auth-button"
                  onClick={onCompleteCourse}
                  disabled={certificateLoading}
                >
                  {certificateLoading
                    ? 'Generating Certificate...'
                    : 'Complete Course'}
                </button>
              )}
            </>
          )}

          {/* -------------------------------- */}
          {/* FAILED - RETRY AVAILABLE */}
          {/* -------------------------------- */}

          {!quizResult.passed &&
            quizResult.attempts_remaining > 0 && (
              <p>
                You did not reach the passing
                score. You can try again.
              </p>
            )}

          {/* -------------------------------- */}
          {/* FAILED - NO RETRIES */}
          {/* -------------------------------- */}

          {!quizResult.passed &&
            quizResult.attempts_remaining === 0 && (
              <p>
                You have used all available
                attempts for this quiz.
              </p>
            )}
        </div>
      )}
    </section>
  )
}

export default ModuleQuiz