'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Trash } from 'lucide-react'
import slugify from 'slugify'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    loadCategories()
  }, [page])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/categories?page=${page}&limit=20`)
      const result = await response.json()
      if (!response.ok) throw new Error(result?.error || 'Failed to load categories')
      setCategories(result?.data?.categories || [])
      setPages(result?.data?.pagination?.pages || 1)
    } catch (error) {
      console.error('Load categories error:', error)
      setCategories([])
      setPages(1)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!name) return

    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        slug: slugify(name, { lower: true, strict: true }),
        description,
      }),
    })
    const result = await response.json()
    if (!response.ok) {
      alert(result?.error || 'Failed to create category')
      return
    }

    setShowDialog(false)
    setName('')
    setDescription('')
    loadCategories()
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this category?')) {
      const response = await fetch('/api/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const result = await response.json()
      if (!response.ok) {
        alert(result?.error || 'Failed to delete category')
        return
      }
      loadCategories()
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600 mt-2">Organize your content</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Category name"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate}>Create Category</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading categories...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span>{category.name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(category.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              {category.description && (
                <CardContent>
                  <p className="text-sm text-gray-600">{category.description}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="mt-6 flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Prev
          </Button>
          <span className="text-sm text-gray-500">Page {page} of {pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => Math.min(pages, p + 1))}>
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
