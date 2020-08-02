import React from 'react'
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
} from 'react-router-dom'

import './App.css'
import GamesPage from './pages/games'
import MemoryGamePage from './pages/games/memory'

function App() {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/games">Games</Link>
            </li>
          </ul>
        </nav>
        <Switch>
          <Route exact path="/">
            <Home />
          </Route>
          <Route exact path="/games">
            <GamesPage />
          </Route>
          <Route exact path="/games/memory">
            <MemoryGamePage />
          </Route>
          <Route path="*">
            <NotFound />
          </Route>
        </Switch>
      </div>
    </Router>
  )
}

function Home() {
  return (
    <h1>Welcome</h1>
  )
}

function NotFound() {
  return (
    <p>Not found</p>
  )
}

export default App
