'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  clearWritingDraftFromStorage,
  normalizeWritingPlainText,
  readWritingDraftFromStorage,
  writeWritingDraftToStorage,
  WRITING_SUBMISSION_MAX_CHARS,
} from '@/lib/writing-assignment';

const DRAFT_DEBOUNCE_MS = 800;

type UseWritingSubmissionDraftParams = {
  assignmentId: number | null;
  open: boolean;
  canEdit: boolean;
  serverDraftText: string | null | undefined;
  submittedText: string | null | undefined;
  isSubmitted: boolean;
  fetchWithAuth: (url: string, init?: RequestInit) => Promise<Response>;
};

export function useWritingSubmissionDraft({
  assignmentId,
  open,
  canEdit,
  serverDraftText,
  submittedText,
  isSubmitted,
  fetchWithAuth,
}: UseWritingSubmissionDraftParams) {
  const [text, setText] = useState('');
  const [draftStatus, setDraftStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!open || assignmentId == null) {
      initializedRef.current = false;
      setText('');
      setDraftStatus('idle');
      setLastSavedAt(null);
      return;
    }

    if (initializedRef.current) return;
    initializedRef.current = true;

    if (isSubmitted) {
      setText(normalizeWritingPlainText(submittedText ?? ''));
      return;
    }

    const local = readWritingDraftFromStorage(assignmentId);
    const server = normalizeWritingPlainText(serverDraftText ?? '');
    setText(server || local);
  }, [
    assignmentId,
    isSubmitted,
    open,
    serverDraftText,
    submittedText,
  ]);

  const persistDraft = useCallback(
    async (draftText: string) => {
      if (assignmentId == null || !canEdit || isSubmitted) return;

      const normalized = normalizeWritingPlainText(draftText);
      writeWritingDraftToStorage(assignmentId, normalized);

      if (normalized.length > WRITING_SUBMISSION_MAX_CHARS) {
        setDraftStatus('error');
        return;
      }

      setDraftStatus('saving');
      try {
        const res = await fetchWithAuth(
          `/api/assignments/${assignmentId}/submission/writing-draft`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: normalized }),
          },
        );
        if (!res.ok) {
          setDraftStatus('error');
          return;
        }
        setDraftStatus('saved');
        setLastSavedAt(new Date().toISOString());
      } catch {
        setDraftStatus('error');
      }
    },
    [assignmentId, canEdit, fetchWithAuth, isSubmitted],
  );

  const scheduleDraftSave = useCallback(
    (nextText: string) => {
      if (assignmentId == null || !canEdit || isSubmitted) return;
      writeWritingDraftToStorage(assignmentId, nextText);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void persistDraft(nextText);
      }, DRAFT_DEBOUNCE_MS);
    },
    [assignmentId, canEdit, isSubmitted, persistDraft],
  );

  const onTextChange = useCallback(
    (value: string) => {
      const normalized = normalizeWritingPlainText(value);
      setText(normalized);
      if (draftStatus === 'saved') setDraftStatus('idle');
      scheduleDraftSave(normalized);
    },
    [draftStatus, scheduleDraftSave],
  );

  const clearDraftAfterSubmit = useCallback(() => {
    if (assignmentId == null) return;
    clearWritingDraftFromStorage(assignmentId);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setDraftStatus('idle');
    setLastSavedAt(null);
  }, [assignmentId]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return {
    text,
    setText,
    onTextChange,
    draftStatus,
    lastSavedAt,
    clearDraftAfterSubmit,
    persistDraft,
  };
}
