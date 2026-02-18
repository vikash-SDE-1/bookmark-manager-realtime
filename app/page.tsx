'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [bookmarks, setBookmarks] = useState<any[]>([])

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }

    getUser()
  }, [])

 useEffect(() => {
  if (!user) return

  fetchBookmarks()

  const channel = supabase
    .channel('bookmarks-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'bookmarks'
      },
      () => {
        fetchBookmarks()
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [user])


  const fetchBookmarks = async () => {
    const { data } = await supabase
      .from('bookmarks')
      .select('*')
      .order('created_at', { ascending: false })

    setBookmarks(data || [])
  }

  const addBookmark = async () => {
    if (!title || !url) return

    await supabase.from('bookmarks').insert([
      {
        title,
        url,
        user_id: user.id
      }
    ])

    setTitle('')
    setUrl('')
    fetchBookmarks()
  }

  const deleteBookmark = async (id: string) => {
    await supabase.from('bookmarks').delete().eq('id', id)
    fetchBookmarks()
  }

  const login = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000'
      }
    })
  }

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <button
          onClick={login}
          className="bg-black text-white px-6 py-3 rounded"
        >
          Login with Google
        </button>
      </div>
    )
  }

  return (
    <div>
  <div className="min-h-screen bg-gray-100 py-10 px-4">
    <div className="max-w-2xl mx-auto bg-white shadow-xl rounded-2xl p-8">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800">
          🔖 Bookmark Manager
        </h1>
        <button
          onClick={logout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
        >
          Logout
        </button>
      </div>

      {/* Welcome */}
      <p className="mt-4 text-gray-600 text-sm">
        Logged in as <span className="font-medium">{user.email}</span>
      </p>

      {/* Add Bookmark */}
      <div className="mt-6 space-y-3">
        <input
          type="text"
          placeholder="Bookmark Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-gray-300 text-gray-900 placeholder-gray-400 bg-white focus:ring-2 focus:ring-black focus:outline-none p-3 rounded-lg"
        />

        <input
          type="text"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full border border-gray-300 text-gray-900 placeholder-gray-400 bg-white focus:ring-2 focus:ring-black focus:outline-none p-3 rounded-lg"
        />

        <button
          onClick={addBookmark}
          className="w-full bg-black hover:bg-gray-800 text-white py-3 rounded-lg transition font-medium"
        >
          Add Bookmark
        </button>
      </div>

      {/* Bookmark List */}
      <div className="mt-8 space-y-4">
        {bookmarks.length === 0 && (
          <p className="text-gray-500 text-center text-sm">
            No bookmarks yet. Add one above.
          </p>
        )}

        {bookmarks.map((bookmark) => (
          <div
            key={bookmark.id}
            className="border border-gray-200 rounded-xl p-4 flex justify-between items-center hover:shadow-md transition"
          >
            <div>
              <p className="font-semibold text-gray-800">
                {bookmark.title}
              </p>
              <a
                href={bookmark.url}
                target="_blank"
                className="text-blue-500 text-sm hover:underline"
              >
                {bookmark.url}
              </a>
            </div>

            <button
              onClick={() => deleteBookmark(bookmark.id)}
              className="text-red-500 hover:text-red-700 text-sm font-medium"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  </div>


    </div>
  )
}
