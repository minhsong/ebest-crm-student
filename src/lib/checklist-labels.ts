export function checklistTypeLabel(typeKey: string): string {
  switch (typeKey) {
    case 'vocab_copy_penalty':
      return 'Chép phạt';
    case 'vocab_game_penalty':
      return 'Phạt chơi game';
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

