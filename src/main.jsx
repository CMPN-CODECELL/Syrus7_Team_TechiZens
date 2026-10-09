import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { SavedProvider } from './context/SavedProvider.jsx'
import { UserProvider } from './context/UserProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UserProvider>
      <SavedProvider>
        <App />
      </SavedProvider>
    </UserProvider>
  </StrictMode>,
)
