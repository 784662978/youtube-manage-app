// AI 生图 IndexedDB 持久化模块
// 使用 IndexedDB 存储会话和消息（含图片 Base64），避免 localStorage 5MB 限制

import type { Conversation, ChatMessage } from '@/lib/types/ai-image'

const DB_NAME = 'ai-image-db'
const DB_VERSION = 1
const CONVERSATIONS_STORE = 'conversations'
const MESSAGES_STORE = 'messages'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // 会话表
      if (!db.objectStoreNames.contains(CONVERSATIONS_STORE)) {
        const convStore = db.createObjectStore(CONVERSATIONS_STORE, { keyPath: 'id' })
        convStore.createIndex('updatedAt', 'updatedAt', { unique: false })
      }

      // 消息表
      if (!db.objectStoreNames.contains(MESSAGES_STORE)) {
        const msgStore = db.createObjectStore(MESSAGES_STORE, { keyPath: 'id' })
        msgStore.createIndex('conversationId', 'conversationId', { unique: false })
      }
    }
  })
}

// ============ 会话操作 ============

export async function dbGetAllConversations(): Promise<Conversation[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CONVERSATIONS_STORE, 'readonly')
    const store = tx.objectStore(CONVERSATIONS_STORE)
    const request = store.getAll()
    request.onsuccess = () => {
      // 按更新时间降序排列
      const conversations = (request.result as Conversation[]).sort(
        (a, b) => b.updatedAt - a.updatedAt
      )
      resolve(conversations)
    }
    request.onerror = () => reject(request.error)
  })
}

export async function dbSaveConversation(conversation: Conversation): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CONVERSATIONS_STORE, 'readwrite')
    const store = tx.objectStore(CONVERSATIONS_STORE)
    const request = store.put(conversation)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function dbDeleteConversation(conversationId: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction([CONVERSATIONS_STORE, MESSAGES_STORE], 'readwrite')

    // 删除会话
    tx.objectStore(CONVERSATIONS_STORE).delete(conversationId)

    // 删除该会话的所有消息
    const msgStore = tx.objectStore(MESSAGES_STORE)
    const index = msgStore.index('conversationId')
    const cursorRequest = index.openCursor(IDBKeyRange.only(conversationId))

    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result
      if (cursor) {
        cursor.delete()
        cursor.continue()
      }
    }

    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// ============ 消息操作 ============

interface StoredMessage extends ChatMessage {
  conversationId: string
}

export async function dbGetMessages(conversationId: string): Promise<ChatMessage[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MESSAGES_STORE, 'readonly')
    const store = tx.objectStore(MESSAGES_STORE)
    const index = store.index('conversationId')
    const request = index.getAll(IDBKeyRange.only(conversationId))
    request.onsuccess = () => {
      const messages = (request.result as StoredMessage[])
        .sort((a, b) => a.createdAt - b.createdAt)
        // 移除 conversationId 字段，还原为 ChatMessage
        .map(({ conversationId: _, ...msg }) => msg as ChatMessage)
      resolve(messages)
    }
    request.onerror = () => reject(request.error)
  })
}

export async function dbSaveMessage(
  conversationId: string,
  message: ChatMessage
): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MESSAGES_STORE, 'readwrite')
    const store = tx.objectStore(MESSAGES_STORE)
    const storedMsg: StoredMessage = { ...message, conversationId }
    const request = store.put(storedMsg)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function dbDeleteMessage(messageId: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MESSAGES_STORE, 'readwrite')
    const store = tx.objectStore(MESSAGES_STORE)
    const request = store.delete(messageId)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}
