"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { api } from "@/lib/api/api"
import { AxiosError } from "axios"

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: "FREELANCER" | "CLIENT" | "ADMIN"
}

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }

        const response = await api.get<User>('/auth/me')
        const user = response.data

        if (user.role === "FREELANCER") {
          router.push("/freelancer/dashboard")
        } else if (user.role === "CLIENT") {
          router.push("/job-poster/dashboard")
        }
      } catch (error) {
        console.error('Auth check error:', error)
        if (error instanceof AxiosError && error.response?.status === 401) {
          localStorage.removeItem('token')
          router.push('/login')
        }
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return <LoadingSpinner />
  }

  return null
} 