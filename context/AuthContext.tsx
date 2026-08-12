"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react"

import type {
  AccountType,
  AuthSession
} from "@/types/auth"

type SessionUser = AuthSession["user"]

type AuthContextValue = {
  session: AuthSession | null
  user: SessionUser | null
  accountType: AccountType | null
  isLogged: boolean
  loading: boolean

  login: (
    session: AuthSession
  ) => void

  updateUser: (
    updates: Partial<SessionUser>
  ) => void

  logout: () => void
}

const AuthContext =
  createContext<AuthContextValue | null>(
    null
  )

const STORAGE_KEY = "zoove-session"
const OLD_STORAGE_KEY = "zoove-client"

export function AuthProvider({
  children
}: {
  children: React.ReactNode
}) {
  const [
    session,
    setSession
  ] = useState<AuthSession | null>(
    null
  )

  const [
    loading,
    setLoading
  ] = useState(true)

  useEffect(() => {
    try {
      const storedSession =
        localStorage.getItem(
          STORAGE_KEY
        )

      if (!storedSession) {
        setSession(null)
        return
      }

      const parsedSession =
        JSON.parse(
          storedSession
        ) as AuthSession

      if (
        !parsedSession.accountType ||
        !parsedSession.user
      ) {
        throw new Error(
          "Session invalide"
        )
      }

      setSession(parsedSession)
    } catch (error) {
      console.error(
        "Erreur restauration session :",
        error
      )

      localStorage.removeItem(
        STORAGE_KEY
      )

      setSession(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const login = (
    newSession: AuthSession
  ) => {
    let normalizedSession =
      newSession

    if (
      "paypalID" in newSession.user
    ) {
      normalizedSession = {
        ...newSession,
        user: {
          ...newSession.user,
          paypalID:
            newSession.user
              .paypalID?.trim() ??
            ""
        }
      } as AuthSession
    }

    setSession(normalizedSession)

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        normalizedSession
      )
    )

    localStorage.removeItem(
      OLD_STORAGE_KEY
    )
  }

  const updateUser = (
    updates:
      Partial<SessionUser>
  ) => {
    setSession(
      (currentSession) => {
        if (!currentSession) {
          return null
        }

        const updatedSession = {
          ...currentSession,
          user: {
            ...currentSession.user,
            ...updates
          }
        } as AuthSession

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(
            updatedSession
          )
        )

        return updatedSession
      }
    )
  }

  const logout = () => {
    setSession(null)

    localStorage.removeItem(
      STORAGE_KEY
    )

    localStorage.removeItem(
      OLD_STORAGE_KEY
    )
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user:
          session?.user ??
          null,
        accountType:
          session?.accountType ??
          null,
        isLogged:
          !loading &&
          session !== null,
        loading,
        login,
        updateUser,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context =
    useContext(AuthContext)

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    )
  }

  return context
}
