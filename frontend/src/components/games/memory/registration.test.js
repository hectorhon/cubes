import React from 'react'
import { render, fireEvent, act } from '@testing-library/react'
import uuid from 'uuid'

import Registration from './registration'

describe('form submit', () => {
  let mockOnSubmit, getByLabelText, getByText, getByPlaceholderText, queryByText

  beforeEach(() => {
    mockOnSubmit = jest.fn()
    const component = render(
      <Registration onSubmit={mockOnSubmit}/>
    )
    getByLabelText = component.getByLabelText
    getByText = component.getByText
    getByPlaceholderText = component.getByPlaceholderText
    queryByText = component.queryByText
  })

  it('initial form state', () => {
    expect(getByLabelText('Create new game')).toBeChecked()
    expect(getByPlaceholderText('Enter a game ID')).toBeDisabled()
  })

  it('create new game after entering nickname', async () => {
    await act(async () => {
      fireEvent.input(getByLabelText('Nickname'), {
        target: { value: 'test-nickname' }
      })
      fireEvent.submit(getByText('Continue'))
    })
    expect(mockOnSubmit).toBeCalledWith({
      nickname: 'test-nickname',
      mode: 'create-new-game',
    })
  })

  it('must enter nickname', async () => {
    await act(async () => {
      fireEvent.submit(getByText('Continue'))
    })
    expect(getByText('Please enter a nickname.')).toBeInTheDocument()
    expect(mockOnSubmit).not.toBeCalled()
  })

  it('should enable game id field when its radio is checked', async () => {
    await act(async () => {
      fireEvent.click(getByLabelText('Join existing game'))
    })
    expect(getByPlaceholderText('Enter a game ID')).toBeEnabled()
  })

  it('should disable game id field when its radio is not checked', async () => {
    await act(async () => {
      fireEvent.click(getByLabelText('Join existing game'))
      fireEvent.click(getByLabelText('Create new game'))
    })
    expect(getByPlaceholderText('Enter a game ID')).toBeDisabled()
  })

  it('join existing game', async () => {
    const existingGameId = uuid.v4()
    await act(async () => {
      fireEvent.input(getByLabelText('Nickname'), {
        target: { value: 'test-nickname' }
      })
      fireEvent.click(getByLabelText('Join existing game'))
      fireEvent.input(getByPlaceholderText('Enter a game ID'), {
        target: { value: existingGameId }
      })
      fireEvent.submit(getByText('Continue'))
    })
    expect(mockOnSubmit).toBeCalledWith({
      nickname: 'test-nickname',
      mode: 'join-existing-game',
      gameId: existingGameId,
    })
  })

  it('join existing game - must enter game id', async () => {
    await act(async () => {
      fireEvent.input(getByLabelText('Nickname'), {
        target: { value: 'test-nickname' }
      })
      fireEvent.click(getByLabelText('Join existing game'))
      fireEvent.submit(getByText('Continue'))
    })
    expect(getByText('Please enter a game ID.')).toBeInTheDocument()
    expect(mockOnSubmit).not.toBeCalled()
  })

  it('should hide missing game id message when create new game radio is checked', async () => {
    await act(async () => {
      fireEvent.input(getByLabelText('Nickname'), {
        target: { value: 'test-nickname' }
      })
      fireEvent.click(getByLabelText('Join existing game'))
      fireEvent.submit(getByText('Continue'))
    })
    expect(getByText('Please enter a game ID.')).toBeInTheDocument()
    expect(mockOnSubmit).not.toBeCalled()

    await act(async () => {
      fireEvent.click(getByLabelText('Create new game'))
    })
    expect(queryByText('Please enter a game ID.')).toBeNull()
  })
})
