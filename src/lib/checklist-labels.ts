export function checklistTypeLabel(typeKey: string): string {
  switch (typeKey) {
    case 'vocab_copy_penalty':
      return 'Chép phạt';
    case 'quizlet_progress':
      return 'Quizlet';
    case 'book_delivery':
      return 'Phát sách';
    case 'generic':
      return 'Checklist';
    default:
      return 'Checklist';
  }
}

