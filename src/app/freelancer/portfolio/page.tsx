"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { toast } from "sonner"
import { Plus, Trash2, Edit2, Link as LinkIcon, Image as ImageIcon } from "lucide-react"

interface PortfolioItem {
  id: string
  title: string
  description: string
  images: string[]
  link?: string
  createdAt: string
  updatedAt: string
}

export default function PortfolioPage() {
  const router = useRouter()
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    link: "",
    images: [] as File[]
  })

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      try {
        const response = await axios.get('http://localhost:5001/api/portfolio', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setPortfolioItems(response.data)
      } catch (error) {
        console.error('Error fetching portfolio:', error)
        setError('Failed to load portfolio items')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({
        ...prev,
        images: [...Array.from(e.target.files!)]
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title)
      formDataToSend.append('description', formData.description)
      if (formData.link) formDataToSend.append('link', formData.link)
      formData.images.forEach(image => {
        formDataToSend.append('images', image)
      })

      if (editingItem) {
        await axios.put(`http://localhost:5001/api/portfolio/${editingItem.id}`, formDataToSend, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        })
        toast.success('Portfolio item updated successfully')
      } else {
        await axios.post('http://localhost:5001/api/portfolio', formDataToSend, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        })
        toast.success('Portfolio item added successfully')
      }

      // Refresh portfolio items
      const response = await axios.get('http://localhost:5001/api/portfolio', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPortfolioItems(response.data)

      // Reset form
      setFormData({
        title: "",
        description: "",
        link: "",
        images: []
      })
      setIsAddingItem(false)
      setEditingItem(null)
    } catch (error) {
      console.error('Error saving portfolio item:', error)
      toast.error('Failed to save portfolio item')
    }
  }

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      await axios.delete(`http://localhost:5001/api/portfolio/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPortfolioItems(prev => prev.filter(item => item.id !== id))
      toast.success('Portfolio item deleted successfully')
    } catch (error) {
      console.error('Error deleting portfolio item:', error)
      toast.error('Failed to delete portfolio item')
    }
  }

  const handleEdit = (item: PortfolioItem) => {
    setEditingItem(item)
    setFormData({
      title: item.title,
      description: item.description,
      link: item.link || "",
      images: []
    })
    setIsAddingItem(true)
  }

  if (loading) {
    return <div className="container mx-auto py-8">Loading...</div>
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Portfolio</h1>
        <Button onClick={() => setIsAddingItem(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Portfolio Item
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {isAddingItem && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingItem ? 'Edit Portfolio Item' : 'Add Portfolio Item'}</CardTitle>
            <CardDescription>
              {editingItem ? 'Update your portfolio item details' : 'Add a new item to your portfolio'}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link">Project Link (Optional)</Label>
                <Input
                  id="link"
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="images">Images</Label>
                <Input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  required={!editingItem}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddingItem(false)
                  setEditingItem(null)
                  setFormData({
                    title: "",
                    description: "",
                    link: "",
                    images: []
                  })
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingItem ? 'Update' : 'Add'} Portfolio Item
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {portfolioItems.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <span>{item.title}</span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(item)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {item.images && item.images.length > 0 && (
                <div className="relative aspect-video mb-4">
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="rounded-md object-cover w-full h-full"
                  />
                </div>
              )}
              {item.link && (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <LinkIcon className="h-4 w-4" />
                  View Project
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 