import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Greeting from './Greeting.jsx'
import { MyName, MyBirthday } from './Greeting.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Greeting />
    <MyName></MyName>
    <MyBirthday></MyBirthday>
  </StrictMode>,
)
