import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import OwnerSessionProvider from './context/OwnerSessionProvider.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <OwnerSessionProvider>
      <App />
    </OwnerSessionProvider>
  </StrictMode>,
)
