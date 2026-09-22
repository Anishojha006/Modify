import { useState } from 'react'
import './App.css'
import Page from "./features/auth/pages/auth.jsx";
import { AuthProvider } from "./features/auth/auth.context.jsx";

function App() {

  return (
    <AuthProvider>
      <Page />
    </AuthProvider>
  )
}

export default App
