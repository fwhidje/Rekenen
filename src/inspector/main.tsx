import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Inspector } from './Inspector'
import '../index.css'
// Register every exercise so stored answers can be replayed.
import '../exercises/index'

// Entry of the separate inspector page (inspector.html). Nothing in the app
// imports from src/inspector/ — see inspectorIsolation.test.ts.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Inspector />
  </StrictMode>
)
