import { useState } from 'react'
import { api } from '@/lib/api'
import { User } from '@/lib/types'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Search,
  Mail,
  MailOpen,
  Send,
  Reply,
  User as UserIcon,
  Clock,
  Inbox,
  SendHorizonal,
  Archive
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Message {
  id: string
  subject: string
  content: string
  fromUserId: string
  toUserIds: string[]
  caseId?: string
  clientId?: string
  read: boolean
  createdAt: string
}

interface MessagesPageProps {
  messages: Message[]
  users: User[]
  onRefresh: () => void
}

export function MessagesPage({ messages, users, onRefresh }: MessagesPageProps) {
  const { user: currentUser } = useAuth()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox')

  // Form state
  const [formData, setFormData] = useState({
    subject: '',
    content: '',
    toUserIds: [] as string[],
    selectedRecipient: '',
  })

  // Get user name by ID
  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    return user?.name || 'Unknown'
  }

  // Filter messages based on tab and search
  const filteredMessages = messages.filter((msg) => {
    const matchesSearch =
      msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.content.toLowerCase().includes(searchTerm.toLowerCase())

    if (activeTab === 'inbox') {
      return matchesSearch && msg.toUserIds?.includes(currentUser?.id || '')
    } else {
      return matchesSearch && msg.fromUserId === currentUser?.id
    }
  })

  const openComposeDialog = (replyTo?: Message) => {
    if (replyTo) {
      setFormData({
        subject: `Re: ${replyTo.subject}`,
        content: '',
        toUserIds: [replyTo.fromUserId],
        selectedRecipient: replyTo.fromUserId,
      })
    } else {
      setFormData({
        subject: '',
        content: '',
        toUserIds: [],
        selectedRecipient: '',
      })
    }
    setIsDialogOpen(true)
  }

  const handleAddRecipient = (userId: string) => {
    if (userId && !formData.toUserIds.includes(userId)) {
      setFormData({
        ...formData,
        toUserIds: [...formData.toUserIds, userId],
        selectedRecipient: '',
      })
    }
  }

  const handleRemoveRecipient = (userId: string) => {
    setFormData({
      ...formData,
      toUserIds: formData.toUserIds.filter((id) => id !== userId),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.toUserIds.length === 0) {
      toast.error('Please select at least one recipient')
      return
    }

    setIsLoading(true)

    try {
      await api.createMessage({
        subject: formData.subject,
        content: formData.content,
        fromUserId: currentUser?.id,
        toUserIds: formData.toUserIds,
      })
      toast.success('Message sent successfully')
      setIsDialogOpen(false)
      setFormData({
        subject: '',
        content: '',
        toUserIds: [],
        selectedRecipient: '',
      })
      onRefresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a')
    } catch {
      return dateString
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground">Internal messaging system</p>
        </div>
        <Button onClick={() => openComposeDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Compose
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'inbox' ? 'default' : 'outline'}
          onClick={() => setActiveTab('inbox')}
          className="gap-2"
        >
          <Inbox className="h-4 w-4" />
          Inbox
        </Button>
        <Button
          variant={activeTab === 'sent' ? 'default' : 'outline'}
          onClick={() => setActiveTab('sent')}
          className="gap-2"
        >
          <SendHorizonal className="h-4 w-4" />
          Sent
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search messages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Message List and Detail View */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Message List */}
        <div className="space-y-2">
          {filteredMessages.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No messages found</p>
                <Button variant="link" onClick={() => openComposeDialog()}>
                  Send your first message
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredMessages.map((message) => (
              <Card
                key={message.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedMessage?.id === message.id ? 'ring-2 ring-primary' : ''
                } ${!message.read && activeTab === 'inbox' ? 'bg-primary/5' : ''}`}
                onClick={() => setSelectedMessage(message)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      {message.read || activeTab === 'sent' ? (
                        <MailOpen className="h-4 w-4 text-primary" />
                      ) : (
                        <Mail className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`font-medium truncate ${!message.read && activeTab === 'inbox' ? 'font-bold' : ''}`}>
                          {message.subject || '(No Subject)'}
                        </p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(message.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {activeTab === 'inbox' ? (
                          <>From: {getUserName(message.fromUserId)}</>
                        ) : (
                          <>To: {message.toUserIds?.map(id => getUserName(id)).join(', ')}</>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Message Detail */}
        <div>
          {selectedMessage ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{selectedMessage.subject || '(No Subject)'}</CardTitle>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <UserIcon className="h-4 w-4" />
                      <span>
                        {activeTab === 'inbox' ? 'From' : 'To'}:{' '}
                        {activeTab === 'inbox'
                          ? getUserName(selectedMessage.fromUserId)
                          : selectedMessage.toUserIds?.map(id => getUserName(id)).join(', ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(selectedMessage.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {activeTab === 'inbox' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openComposeDialog(selectedMessage)}
                      >
                        <Reply className="h-4 w-4 mr-1" />
                        Reply
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a message to view</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Compose Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Compose Message
              </div>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Recipients */}
            <div className="space-y-2">
              <Label>To *</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.selectedRecipient}
                  onValueChange={handleAddRecipient}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter((u) => u.id !== currentUser?.id && !formData.toUserIds.includes(u.id))
                      .map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.role})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.toUserIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.toUserIds.map((userId) => (
                    <span
                      key={userId}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-sm"
                    >
                      {getUserName(userId)}
                      <button
                        type="button"
                        onClick={() => handleRemoveRecipient(userId)}
                        className="hover:text-destructive"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Enter subject"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Message *</Label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Type your message..."
                required
                className="w-full min-h-[150px] px-3 py-2 border rounded-md bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  'Sending...'
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

