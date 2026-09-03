import {
  cleanup,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import {
  describe,
  expect,
  it,
  vi,
  beforeEach,
  afterEach,
} from 'vitest'

import GoogleCallback from './GoogleCallback'
import { apiFetch } from '../utils/api'
import { useAuth } from '../context/AuthContext'

vi.mock('../utils/api', () => ({
  apiFetch: vi.fn(),
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const navigateMock = vi.fn()
const loginMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual(
    'react-router-dom'
  )

  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

describe('GoogleCallback', () => {
  beforeEach(() => {
    cleanup()

    vi.clearAllMocks()

    useAuth.mockReturnValue({
      login: loginMock,
    })

    window.history.replaceState(
      {},
      '',
      '/google-callback'
    )
  })

  afterEach(() => {
    cleanup()

    window.history.replaceState(
      {},
      '',
      '/'
    )
  })

  it('authenticates a Google learner and navigates to courses', async () => {
    window.history.replaceState(
      {},
      '',
      '/google-callback?token=test-google-token'
    )

    apiFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        name: 'Google Learner',
        email: 'learner@example.com',
        role: 'learner',
        is_active: true,
      }),
    })

    render(
      <MemoryRouter>
        <GoogleCallback />
      </MemoryRouter>
    )

    expect(
      screen.getByText('Signing you in...')
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith(
        'test-google-token'
      )
    })

    expect(apiFetch).toHaveBeenCalledWith(
      '/auth/me'
    )

    expect(navigateMock).toHaveBeenCalledWith(
      '/courses',
      {
        replace: true,
      }
    )
  })

  it('shows an error when the Google token is missing', async () => {
    window.history.replaceState(
      {},
      '',
      '/google-callback'
    )

    expect(
      window.location.search
    ).toBe('')

    render(
      <MemoryRouter>
        <GoogleCallback />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(
        screen.getByText(
          'Google authentication token was not found.'
        )
      ).toBeInTheDocument()
    })

    expect(loginMock).not.toHaveBeenCalled()

    expect(apiFetch).not.toHaveBeenCalled()

    expect(navigateMock).not.toHaveBeenCalled()
  })
})