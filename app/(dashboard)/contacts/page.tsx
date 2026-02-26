'use client'

import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Plus, Loader2, Trash2, MessageSquare } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Contact {
  id: string
  contact_user_id: string
  nickname?: string
  profile?: {
    full_name: string
    phone_number: string
    avatar_url?: string
  }
}

export default function ContactsPage() {
  const { user } = useAuth()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [addingContact, setAddingContact] = useState(false)
  const [newPhone, setNewPhone] = useState('')
  const [nickname, setNickname] = useState('')

  useEffect(() => {
    const fetchContacts = async () => {
      if (!user?.id) return

      try {
        const { data } = await supabase
          .from('contacts')
          .select('*, profile:contact_user_id(full_name, phone_number)')
          .eq('user_id', user.id)

        setContacts(data || [])
      } catch (error) {
        console.error('Failed to fetch contacts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchContacts()
  }, [user?.id])

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newPhone || !user) {
      toast.error('Please enter a phone number')
      return
    }

    setAddingContact(true)
    try {
      // Find user by phone
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('phone_number', newPhone)
        .single()

      if (!profile) {
        throw new Error('User not found')
      }

      // Add contact
      const { error } = await supabase
        .from('contacts')
        .insert({
          user_id: user.id,
          contact_user_id: profile.user_id,
          nickname: nickname || undefined,
        })

      if (error) throw error

      toast.success('Contact added successfully!')
      setNewPhone('')
      setNickname('')

      // Refresh contacts
      const { data } = await supabase
        .from('contacts')
        .select('*, profile:contact_user_id(full_name, phone_number)')
        .eq('user_id', user.id)

      setContacts(data || [])
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to add contact'
      toast.error(message)
    } finally {
      setAddingContact(false)
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId)

      if (error) throw error

      setContacts(contacts.filter((c) => c.id !== contactId))
      toast.success('Contact deleted')
    } catch (error) {
      toast.error('Failed to delete contact')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Contacts</h1>
          <p className="text-gray-600 mt-1">Manage your saved contacts for quick transfers</p>
        </div>

        <form onSubmit={handleAddContact} className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-4">Add New Contact</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                type="tel"
                placeholder="Phone number (+63 9XX XXX XXXX)"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                disabled={addingContact}
              />
              <Input
                type="text"
                placeholder="Nickname (optional)"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                disabled={addingContact}
              />
            </div>
            <Button
              type="submit"
              disabled={addingContact || !newPhone}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {addingContact ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Contact
                </>
              )}
            </Button>
          </div>
        </form>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : contacts.length === 0 ? (
          <p className="text-center py-12 text-gray-500">No contacts yet. Add one to get started!</p>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback className="bg-blue-600 text-white">
                      {contact.profile?.full_name?.charAt(0) || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {contact.nickname || contact.profile?.full_name}
                    </p>
                    <p className="text-sm text-gray-600">{contact.profile?.phone_number}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/send?phone=${contact.profile?.phone_number}`}>
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteContact(contact.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
