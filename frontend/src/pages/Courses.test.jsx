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

import Courses from './Courses'
import { apiFetch } from '../utils/api'

vi.mock('../utils/api', () => ({
  apiFetch: vi.fn(),
}))

describe('Courses', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads and displays courses from the API', async () => {
    apiFetch.mockResolvedValue({
      ok: true,
      json: async () => [
        {
          course_id: 1,
          title: 'Python Fundamentals',
          description:
            'Learn the fundamentals of Python.',
          category: 'Programming',
          deadline: null,
          completed: false,
          progress_percentage: 0,
        },
      ],
    })

    render(
      <MemoryRouter>
        <Courses />
      </MemoryRouter>
    )

    expect(
      screen.getByText('Loading courses...')
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(
        screen.getByText('Python Fundamentals')
      ).toBeInTheDocument()
    })

    expect(
      screen.getByText(
        'Learn the fundamentals of Python.'
      )
    ).toBeInTheDocument()

    expect(
      screen.getByText('Programming', {
        selector: 'p',
      })
    ).toBeInTheDocument()

    expect(
      screen.getByText('View course')
    ).toBeInTheDocument()

    expect(apiFetch).toHaveBeenCalledTimes(1)

    expect(apiFetch).toHaveBeenCalledWith(
      '/courses/enrolled/me'
    )
  })

  it('filters courses by search text', async () => {
    apiFetch.mockResolvedValue({
      ok: true,
      json: async () => [
        {
          course_id: 1,
          title: 'Python Fundamentals',
          description:
            'Learn the fundamentals of Python.',
          category: 'Programming',
          deadline: null,
          completed: false,
          progress_percentage: 0,
        },
        {
          course_id: 2,
          title: 'Data Analytics',
          description:
            'Learn data analysis and reporting.',
          category: 'Analytics',
          deadline: null,
          completed: false,
          progress_percentage: 0,
        },
      ],
    })

    render(
      <MemoryRouter>
        <Courses />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(
        screen.getByText('Python Fundamentals')
      ).toBeInTheDocument()

      expect(
        screen.getByText('Data Analytics')
      ).toBeInTheDocument()
    })

    const searchInput =
      screen.getByPlaceholderText(
        'Search by title or description'
      )

    fireEvent.change(searchInput, {
      target: {
        value: 'Python',
      },
    })

    expect(
      screen.getByText('Python Fundamentals')
    ).toBeInTheDocument()

    expect(
      screen.queryByText('Data Analytics')
    ).not.toBeInTheDocument()
  })
})

  it('filters courses by category', async () => {
    apiFetch.mockResolvedValue({
      ok: true,
      json: async () => [
        {
          course_id: 1,
          title: 'Python Fundamentals',
          description:
            'Learn the fundamentals of Python.',
          category: 'Programming',
          deadline: null,
          completed: false,
          progress_percentage: 0,
        },
        {
          course_id: 2,
          title: 'Data Analytics',
          description:
            'Learn data analysis and reporting.',
          category: 'Analytics',
          deadline: null,
          completed: false,
          progress_percentage: 0,
        },
      ],
    })

    render(
      <MemoryRouter>
        <Courses />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(
        screen.getByText('Python Fundamentals')
      ).toBeInTheDocument()

      expect(
        screen.getByText('Data Analytics')
      ).toBeInTheDocument()
    })

    const categorySelect =
      screen.getByLabelText('Category')

    fireEvent.change(categorySelect, {
      target: {
        value: 'Programming',
      },
    })

    expect(
      screen.getByText('Python Fundamentals')
    ).toBeInTheDocument()

    expect(
      screen.queryByText('Data Analytics')
    ).not.toBeInTheDocument()
  })

  it('shows completed status for completed courses', async () => {
    apiFetch.mockResolvedValue({
      ok: true,
      json: async () => [
        {
          course_id: 1,
          title: 'Completed Python Course',
          description:
            'A completed training course.',
          category: 'Programming',
          deadline: '2026-09-10T18:00:00',
          completed: true,
          progress_percentage: 100,
        },
      ],
    })

    render(
      <MemoryRouter>
        <Courses />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(
        screen.getByText('Completed Python Course')
      ).toBeInTheDocument()
    })

    expect(
      screen.getByText('Completed')
    ).toBeInTheDocument()

    expect(
      screen.queryByText(/DEADLINE/i)
    ).not.toBeInTheDocument()
  })