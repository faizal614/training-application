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

import SignIn from './SignIn'
import { useAuth } from '../context/AuthContext'

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual(
    'react-router-dom'
  )

  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

describe('SignIn', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    useAuth.mockReturnValue({
      login: vi.fn(),
    })

    global.fetch = vi.fn()
  })

  it('signs in a learner successfully and navigates to courses', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'test-access-token',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 1,
          name: 'Test Learner',
          email: 'learner@example.com',
          role: 'learner',
          is_active: true,
        }),
      })

    render(
      <MemoryRouter>
        <SignIn />
      </MemoryRouter>
    )

    fireEvent.change(
      screen.getByLabelText('Email'),
      {
        target: {
          value: 'learner@example.com',
        },
      }
    )

    fireEvent.change(
      screen.getByLabelText('Password'),
      {
        target: {
          value: 'password123',
        },
      }
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Sign in',
      })
    )

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith(
        '/courses'
      )
    })

    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      'http://127.0.0.1:8000/auth/signin',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'learner@example.com',
          password: 'password123',
        }),
      }
    )

    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      'http://127.0.0.1:8000/auth/me',
      {
        headers: {
          Authorization:
            'Bearer test-access-token',
        },
      }
    )

    expect(
      useAuth.mock.results[0].value.login
    ).toHaveBeenCalledWith(
      'test-access-token'
    )
  })

  it('shows an error when sign in fails', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        detail: 'Invalid email or password',
      }),
    })

    render(
      <MemoryRouter>
        <SignIn />
      </MemoryRouter>
    )

    fireEvent.change(
      screen.getByLabelText('Email'),
      {
        target: {
          value: 'wrong@example.com',
        },
      }
    )

    fireEvent.change(
      screen.getByLabelText('Password'),
      {
        target: {
          value: 'wrongpassword',
        },
      }
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Sign in',
      })
    )

    await waitFor(() => {
      expect(
        screen.getByText(
          'Invalid email or password'
        )
      ).toBeInTheDocument()
    })

    expect(global.fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/auth/signin',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'wrong@example.com',
          password: 'wrongpassword',
        }),
      }
    )

    expect(global.fetch).not.toHaveBeenCalledWith(
      'http://127.0.0.1:8000/auth/me',
      expect.anything()
    )

    expect(navigateMock).not.toHaveBeenCalled()
  })
})