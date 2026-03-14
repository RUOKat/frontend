import { backendFetch } from './backend'

export type Post = {
  id: string
  imageUrl: string
  caption: string
  createdAt: string
  author: {
    id: string
    name: string
    profilePhoto: string | null
  }
  cat: {
    id: string
    name: string
    profilePhoto: string | null
  }
  likesCount: number
  isLikedByMe: boolean
}

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const data = await backendFetch<any>('/upload', {
    method: 'POST',
    body: formData,
  })

  if (!data) throw new Error('Failed to upload image')

  // Handle wrapped response
  if (data.success && data.data) return data.data.url
  return data.url
}

export async function createPost(catId: string, imageUrl: string, caption: string): Promise<Post> {
  const data = await backendFetch<any>('/posts', {
    method: 'POST',
    body: JSON.stringify({ catId, imageUrl, caption }),
  })

  if (!data) throw new Error('Failed to create post')

  // Handle wrapped response
  if (data.success && data.data) return data.data
  return data
}

export async function fetchPosts(): Promise<Post[]> {
  const data = await backendFetch<any>('/posts', {
    method: 'GET',
  })

  if (!data) return []

  // Handle wrapped response
  if (data.success && Array.isArray(data.data)) {
    return data.data
  }

  // backendFetch already handles common success/data wrapping 
  // but if it returned the raw data array, return it
  if (Array.isArray(data)) return data

  return []
}

export async function togglePostLike(postId: string): Promise<{ liked: boolean }> {
  const data = await backendFetch<any>(`/posts/${postId}/like`, {
    method: 'POST',
  })

  if (!data) throw new Error('Failed to toggle like')

  if (data.success && data.data) return data.data
  return data
}

export async function deletePost(postId: string): Promise<void> {
  await backendFetch(`/posts/${postId}`, {
    method: 'DELETE',
  })
}
