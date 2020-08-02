import React from 'react'
import { render } from '@testing-library/react'
import App from './App'

test('renders link to Home', () => {
  const { getByText } = render(<App />)
  const linkElement = getByText('Home')
  expect(linkElement).toBeInTheDocument()
})

test('renders link to Games', () => {
  const { getByText } = render(<App />)
  const linkElement = getByText('Games')
  expect(linkElement).toBeInTheDocument()
})
