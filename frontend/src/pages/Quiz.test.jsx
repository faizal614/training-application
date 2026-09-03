import {
  render,
  screen,
  waitFor,
  fireEvent,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import {
  describe,
  expect,
  it,
  vi,
  beforeEach,
} from 'vitest'

import QuizPage from './QuizPage'
import { apiFetch } from '../utils/api'
import { useAuth } from '../context/AuthContext'

vi.mock('../utils/api', () => ({
  apiFetch: vi.fn(),
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const navigateMock = vi.fn()
const handleSessionExpiredMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual(
    'react-router-dom'
  )

  return {
    ...actual,
    useNavigate: () => navigateMock,
    useParams: () => ({
      courseId: '1',
      moduleId: '10',
    }),
  }
})

describe('QuizPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    useAuth.mockReturnValue({
      token: 'test-token',
      isAuthenticated: true,
      handleSessionExpired:
        handleSessionExpiredMock,
    })
  })

  it('loads a quiz and submits it successfully', async () => {
    apiFetch
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => [
          {
            id: 10,
            title: 'Introduction Module',
          },
        ],
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({
          id: 100,
          title: 'Python Basics Quiz',
          passing_score: 50,
          max_attempts: 3,
        }),
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => [
          {
            id: 1000,
            question_text: 'What is 2 + 2?',
            display_order: 1,
            answers: [
              {
                id: 2000,
                answer_text: '4',
                display_order: 1,
              },
              {
                id: 2001,
                answer_text: '5',
                display_order: 2,
              },
            ],
          },
        ],
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({
          score: 100,
          passed: true,
          passing_score: 50,
          attempts_used: 1,
          attempts_remaining: 2,
          max_attempts: 3,
          redo_required: false,
          is_last_module: true,
        }),
      })

    render(
      <MemoryRouter>
        <QuizPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(
        screen.getByText('Python Basics Quiz')
      ).toBeInTheDocument()
    })

    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName.toLowerCase() ===
            'legend' &&
          element.textContent?.includes(
            'What is 2 + 2?'
          )
      )
    ).toBeInTheDocument()

    expect(
      screen.getByText('4')
    ).toBeInTheDocument()

    expect(
      screen.getByText('5')
    ).toBeInTheDocument()

    fireEvent.click(
      screen.getByLabelText('4')
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Submit Quiz',
      })
    )

    await waitFor(() => {
      expect(
        screen.getByText('Quiz Passed')
      ).toBeInTheDocument()
    })

    expect(
      screen.getByText('100%')
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        /Congratulations! You have completed this module/
      )
    ).toBeInTheDocument()

    expect(apiFetch).toHaveBeenCalledTimes(5)

    expect(apiFetch).toHaveBeenNthCalledWith(
      5,
      '/modules/quizzes/100/submit',
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify({
          answers: [
            {
              question_id: 1000,
              answer_id: 2000,
            },
          ],
        }),
      },
      handleSessionExpiredMock
    )

    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('shows a failed quiz result when the learner selects an incorrect answer', async () => {
    apiFetch
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => [
          {
            id: 10,
            title: 'Introduction Module',
          },
        ],
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({
          id: 100,
          title: 'Python Basics Quiz',
          passing_score: 50,
          max_attempts: 3,
        }),
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => [
          {
            id: 1000,
            question_text: 'What is 2 + 2?',
            display_order: 1,
            answers: [
              {
                id: 2000,
                answer_text: '4',
                display_order: 1,
              },
              {
                id: 2001,
                answer_text: '5',
                display_order: 2,
              },
            ],
          },
        ],
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({
          score: 0,
          passed: false,
          passing_score: 50,
          attempts_used: 1,
          attempts_remaining: 2,
          max_attempts: 3,
          redo_required: false,
          is_last_module: true,
        }),
      })

    render(
      <MemoryRouter>
        <QuizPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(
        screen.getByText('Python Basics Quiz')
      ).toBeInTheDocument()
    })

    fireEvent.click(
      screen.getByLabelText('5')
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Submit Quiz',
      })
    )

    await waitFor(() => {
      expect(
        screen.getByText('Quiz Not Passed')
      ).toBeInTheDocument()
    })

    expect(
      screen.getByText('0%')
    ).toBeInTheDocument()

    const attemptsMessage =
      screen.getByText(
        (_, element) =>
          element?.tagName.toLowerCase() ===
            'p' &&
          element.textContent?.includes(
            'You have'
          ) &&
          element.textContent?.includes(
            '2'
          ) &&
          element.textContent?.includes(
            'attempts'
          ) &&
          element.textContent?.includes(
            'remaining'
          )
      )

    expect(
      attemptsMessage
    ).toBeInTheDocument()

    expect(
      screen.getByRole('button', {
        name: 'Try Again',
      })
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('button', {
        name: 'Submit Quiz',
      })
    ).not.toBeInTheDocument()

    expect(apiFetch).toHaveBeenCalledTimes(5)

    expect(apiFetch).toHaveBeenNthCalledWith(
      5,
      '/modules/quizzes/100/submit',
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify({
          answers: [
            {
              question_id: 1000,
              answer_id: 2001,
            },
          ],
        }),
      },
      handleSessionExpiredMock
    )

    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('shows Redo Module when all quiz attempts are exhausted and resets the quiz', async () => {
    apiFetch
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => [
          {
            id: 10,
            title: 'Introduction Module',
          },
        ],
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({
          id: 100,
          title: 'Python Basics Quiz',
          passing_score: 50,
          max_attempts: 3,
        }),
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => [
          {
            id: 1000,
            question_text: 'What is 2 + 2?',
            display_order: 1,
            answers: [
              {
                id: 2000,
                answer_text: '4',
                display_order: 1,
              },
              {
                id: 2001,
                answer_text: '5',
                display_order: 2,
              },
            ],
          },
        ],
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({
          score: 0,
          passed: false,
          passing_score: 50,
          attempts_used: 3,
          attempts_remaining: 0,
          max_attempts: 3,
          redo_required: true,
          is_last_module: true,
        }),
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({
          message:
            'Quiz attempts reset successfully.',
        }),
      })

    render(
      <MemoryRouter>
        <QuizPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(
        screen.getByText('Python Basics Quiz')
      ).toBeInTheDocument()
    })

    fireEvent.click(
      screen.getByLabelText('5')
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Submit Quiz',
      })
    )

    await waitFor(() => {
      expect(
        screen.getByText('Quiz Not Passed')
      ).toBeInTheDocument()
    })

    expect(
      screen.getByText('0%')
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        /You have used all/
      )
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        /Please redo the module before/
      )
    ).toBeInTheDocument()

    expect(
      screen.getByRole('button', {
        name: 'Redo Module',
      })
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('button', {
        name: 'Try Again',
      })
    ).not.toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Redo Module',
      })
    )

    await waitFor(() => {
      expect(apiFetch).toHaveBeenNthCalledWith(
        6,
        '/modules/10/quiz/reset',
        {
          method: 'POST',
        },
        handleSessionExpiredMock
      )
    })

    expect(
      navigateMock
    ).toHaveBeenCalledWith(
      '/courses/1/modules/10'
    )
  })

  it('generates a certificate after completing the final module', async () => {
    apiFetch
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => [
          {
            id: 10,
            title: 'Final Module',
          },
        ],
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({
          id: 100,
          title: 'Final Module Quiz',
          passing_score: 50,
          max_attempts: 3,
        }),
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => [
          {
            id: 1000,
            question_text: 'What is 2 + 2?',
            display_order: 1,
            answers: [
              {
                id: 2000,
                answer_text: '4',
                display_order: 1,
              },
              {
                id: 2001,
                answer_text: '5',
                display_order: 2,
              },
            ],
          },
        ],
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({
          score: 100,
          passed: true,
          passing_score: 50,
          attempts_used: 1,
          attempts_remaining: 2,
          max_attempts: 3,
          redo_required: false,
          is_last_module: true,
        }),
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({
          certificate_number:
            'CERT-TEST-001',
          course_id: 1,
        }),
      })

    render(
      <MemoryRouter>
        <QuizPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(
        screen.getByText('Final Module Quiz')
      ).toBeInTheDocument()
    })

    fireEvent.click(
      screen.getByLabelText('4')
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Submit Quiz',
      })
    )

    await waitFor(() => {
      expect(
        screen.getByText('Quiz Passed')
      ).toBeInTheDocument()
    })

    expect(
      screen.getByRole('button', {
        name: 'Complete Course',
      })
    ).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Complete Course',
      })
    )

    await waitFor(() => {
      expect(apiFetch).toHaveBeenNthCalledWith(
        6,
        '/courses/1/certificate',
        {
          method: 'POST',
        },
        handleSessionExpiredMock
      )
    })

    expect(
      navigateMock
    ).toHaveBeenCalledWith(
      '/courses/1/certificate'
    )
  })
})