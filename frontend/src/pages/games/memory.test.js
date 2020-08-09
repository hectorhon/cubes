import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react'

import MemoryGamePage from './memory'
import RegistrationForm from '../../components/games/memory/registration-form'
import PlayArea from '../../components/games/memory/play-area'

jest.mock('../../components/games/memory/registration-form')
jest.mock('../../components/games/memory/play-area')

it('should first ask for registration', () => {
  RegistrationForm.mockImplementation(
    () => <form data-testid="mock-registration-form"></form>
  )
  PlayArea.mockImplementation(
    () => <div data-testid="mock-play-area"></div>
  )
  const page = render(<MemoryGamePage />)
  expect(page.queryByTestId('mock-registration-form')).toBeInTheDocument()
  expect(page.queryByTestId('mock-play-area')).not.toBeInTheDocument()
  RegistrationForm.mockReset()
  PlayArea.mockReset()
})

describe('user submit registration form - create new game', () => {
  let page

  beforeAll(() => {
    RegistrationForm.mockImplementation(({ onSubmit }) => {
      return (
        <form data-testid="mock-registration-form" onSubmit={async () => {
          await onSubmit({
            nickname: 'james',
            mode: 'create-new-game',
          })
        }}>
          <input type="submit" />
        </form>
      )
    })

    PlayArea.mockImplementation(
      () => <div data-testid="mock-play-area"></div>
    )

    page = render(<MemoryGamePage />)

    jest.spyOn(window, 'fetch')
    window.fetch.mockImplementation(async () => ({
      json: async () => ({
        gameId: 123
      }),
    }))
  })

  afterAll(() => {
    RegistrationForm.mockReset()
    PlayArea.mockReset()
    window.fetch.mockRestore()
  })

  it('workflow', async () => {
    expect(page.queryByText(/Creating a new game/)).not.toBeInTheDocument()

    fireEvent.submit(page.getByTestId('mock-registration-form'))

    await waitFor(() => {
      expect(page.queryByTestId('mock-registration-form')).not.toBeInTheDocument()
      expect(page.queryByText(/Creating a new game/)).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(window.fetch).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(page.queryByText(/Creating a new game/)).not.toBeInTheDocument()
      expect(page.queryByTestId('mock-play-area')).toBeInTheDocument()
    })
  })
})

describe('user submit registration form - join existing game', () => {
  let page

  beforeAll(() => {
    RegistrationForm.mockImplementation(({ onSubmit }) => {
      return (
        <form data-testid="mock-registration-form" onSubmit={async () => {
          await onSubmit({
            nickname: 'james',
            mode: 'join-existing-game',
            gameId: 123,
          })
        }}>
          <input type="submit" />
        </form>
      )
    })

    PlayArea.mockImplementation(
      () => <div data-testid="mock-play-area"></div>
    )

    page = render(<MemoryGamePage />)

    jest.spyOn(window, 'fetch')
  })

  afterAll(() => {
    RegistrationForm.mockReset()
    PlayArea.mockReset()
    window.fetch.mockRestore()
  })

  it('workflow', async () => {
    fireEvent.submit(page.getByTestId('mock-registration-form'))

    await waitFor(() => {
      expect(page.queryByTestId('mock-registration-form')).not.toBeInTheDocument()
      expect(page.queryByTestId('mock-play-area')).toBeInTheDocument()
    })

    expect(window.fetch).toHaveBeenCalledTimes(0)
  })
})
