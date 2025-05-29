import { jsx as _jsx } from 'react/jsx-runtime'
import { createContext, useContext, useState, useEffect } from 'react'
const AuthContext = createContext(undefined)
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  useEffect(() => {
    if (token) localStorage.setItem('token', token)
    else localStorage.removeItem('token')
  }, [token])
  const login = (tok) => setToken(tok)
  const logout = () => setToken(null)
  return _jsx(AuthContext.Provider, {
    value: { token, login, logout },
    children: children,
  })
}
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
