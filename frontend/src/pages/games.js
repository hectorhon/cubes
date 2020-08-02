import React from 'react'
import { Link } from 'react-router-dom'

function GamesPage() {
  return (
    <div>
      <h1>Games</h1>
      <ol>
        <li><Link to="/games/memory">Memory</Link></li>
      </ol>
    </div>
  )
}

export default GamesPage
