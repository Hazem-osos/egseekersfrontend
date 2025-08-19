import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from '@/components/ui/use-toast'

export interface Notification {
  id: string
  type: 'CHAT' | 'PROPOSAL' | 'JOB'
  senderId: string
  read: boolean
  createdAt: string
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await axios.get('http://localhost:5001/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      })

      setNotifications(response.data)
      setUnreadCount(response.data.filter((n: Notification) => !n.read).length)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      if (axios.isAxiosError(error)) {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to fetch notifications',
          variant: 'destructive'
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      await axios.put(
        `http://localhost:5001/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
      if (axios.isAxiosError(error)) {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to mark notification as read',
          variant: 'destructive'
        })
      }
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    fetchNotifications
  }
}