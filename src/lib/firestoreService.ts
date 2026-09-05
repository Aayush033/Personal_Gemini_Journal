import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { JournalEntry } from '../types';

const LOCAL_STORAGE_KEY = 'gemini_journal_local_entries';

function getLocalEntries(): JournalEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalEntries(entries: JournalEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(entries));
    window.dispatchEvent(new CustomEvent('gemini_local_entries_changed', { detail: entries }));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

/**
 * Isolated Firestore operations strictly scoped to the authenticated user UID:
 * Path: /users/{userId}/entries/{entryId}
 * Matches Firestore security rules: request.auth.uid == userId
 */

export function getUserEntriesRef(userId: string) {
  if (!userId) throw new Error('User ID is required for isolated Firestore queries');
  return collection(db, 'users', userId, 'entries');
}

export function getUserEntryDocRef(userId: string, entryId: string) {
  if (!userId || !entryId) throw new Error('User ID and Entry ID are required');
  return doc(db, 'users', userId, 'entries', entryId);
}

export function subscribeToUserEntries(
  userId: string,
  onData: (entries: JournalEntry[]) => void,
  onError?: (error: Error) => void
) {
  if (!userId) return () => {};

  // Local sandbox mode for development
  if (userId.startsWith('local-')) {
    onData(getLocalEntries());
    const handleStorageChange = () => {
      onData(getLocalEntries());
    };
    window.addEventListener('gemini_local_entries_changed', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('gemini_local_entries_changed', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }

  const entriesRef = getUserEntriesRef(userId);
  const q = query(entriesRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: JournalEntry[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          userId: data.userId || userId,
          title: data.title || 'Untitled Session',
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt || Date.now(),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : data.updatedAt || Date.now(),
          rawConversation: data.rawConversation || [],
          summary: data.summary || null,
          tags: data.tags || [],
          isEncrypted: !!data.isEncrypted,
          cipherData: data.cipherData || null,
          pinned: !!data.pinned,
          favorite: !!data.favorite,
          personaId: data.personaId || 'socratic',
          wordCount: data.wordCount || 0,
        });
      });
      onData(list);
    },
    (err) => {
      console.error('Firestore isolated subscription error:', err);
      if (onError) onError(err);
    }
  );
}

export async function saveJournalEntry(userId: string, entry: JournalEntry): Promise<void> {
  if (!userId) throw new Error('Unauthorized: userId missing');

  if (userId.startsWith('local-')) {
    const entries = getLocalEntries();
    const idx = entries.findIndex((e) => e.id === entry.id);
    const updatedEntry = { ...entry, userId, updatedAt: Date.now() };
    if (idx >= 0) {
      entries[idx] = updatedEntry;
    } else {
      entries.unshift(updatedEntry);
    }
    setLocalEntries(entries);
    return;
  }

  const docRef = getUserEntryDocRef(userId, entry.id);

  await setDoc(docRef, {
    ...entry,
    userId,
    updatedAt: Date.now(),
  }, { merge: true });
}

export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  if (!userId || !entryId) throw new Error('Missing parameters for deletion');

  if (userId.startsWith('local-')) {
    const entries = getLocalEntries().filter((e) => e.id !== entryId);
    setLocalEntries(entries);
    return;
  }

  const docRef = getUserEntryDocRef(userId, entryId);
  await deleteDoc(docRef);
}

export async function togglePinEntry(userId: string, entryId: string, currentVal: boolean): Promise<void> {
  if (userId.startsWith('local-')) {
    const entries = getLocalEntries().map((e) =>
      e.id === entryId ? { ...e, pinned: !currentVal, updatedAt: Date.now() } : e
    );
    setLocalEntries(entries);
    return;
  }

  const docRef = getUserEntryDocRef(userId, entryId);
  await updateDoc(docRef, {
    pinned: !currentVal,
    updatedAt: Date.now(),
  });
}

export async function toggleFavoriteEntry(userId: string, entryId: string, currentVal: boolean): Promise<void> {
  if (userId.startsWith('local-')) {
    const entries = getLocalEntries().map((e) =>
      e.id === entryId ? { ...e, favorite: !currentVal, updatedAt: Date.now() } : e
    );
    setLocalEntries(entries);
    return;
  }

  const docRef = getUserEntryDocRef(userId, entryId);
  await updateDoc(docRef, {
    favorite: !currentVal,
    updatedAt: Date.now(),
  });
}

export async function updateActionItemStatus(
  userId: string,
  entryId: string,
  actionItemId: string,
  completed: boolean,
  currentSummary: any
): Promise<void> {
  if (!currentSummary || !currentSummary.actionItems) return;
  const updatedActionItems = currentSummary.actionItems.map((item: any) =>
    item.id === actionItemId ? { ...item, completed } : item
  );
  const updatedSummary = {
    ...currentSummary,
    actionItems: updatedActionItems,
  };

  if (userId.startsWith('local-')) {
    const entries = getLocalEntries().map((e) =>
      e.id === entryId ? { ...e, summary: updatedSummary, updatedAt: Date.now() } : e
    );
    setLocalEntries(entries);
    return;
  }

  const docRef = getUserEntryDocRef(userId, entryId);
  await updateDoc(docRef, {
    summary: updatedSummary,
    updatedAt: Date.now(),
  });
}
