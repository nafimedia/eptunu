export function createExamState(studentExamId: string) {
  let answers = $state<Record<string, { option: string | null; isFlagged: boolean }>>({});
  let syncStatus = $state<'SYNCED' | 'PENDING' | 'OFFLINE'>('SYNCED');

  // Hydrate from LocalStorage on mount
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(`ept_cache_${studentExamId}`);
    if (cached) {
      try { answers = JSON.parse(cached); } catch (e) { /* ignore */ }
    }
  }

  function saveAnswer(questionId: string, option: string | null, isFlagged: boolean = false) {
    answers[questionId] = { option, isFlagged };
    if (typeof window !== 'undefined') {
      localStorage.setItem(`ept_cache_${studentExamId}`, JSON.stringify(answers));
    }
    syncStatus = 'PENDING';
    debounceSync();
  }

  let timer: ReturnType<typeof setTimeout>;
  function debounceSync() {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      try {
        const payload = Object.entries(answers).map(([qId, data]) => ({
          questionId: qId,
          selectedOption: data.option,
          isFlagged: data.isFlagged
        }));

        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const response = await fetch('/api/v1/exam/sync-answers', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ studentExamId, answers: payload })
        });

        if (response.ok) {
          syncStatus = 'SYNCED';
        } else {
          syncStatus = 'OFFLINE';
        }
      } catch (err) {
        syncStatus = 'OFFLINE';
      }
    }, 1500); // 1.5s debounce batch sync
  }

  return {
    get answers() { return answers; },
    get syncStatus() { return syncStatus; },
    saveAnswer,
    initAnswers(initialAnswers: Array<{ questionId: string; selectedOption: string | null; isFlagged: boolean }>) {
      for (const ans of initialAnswers) {
        if (!answers[ans.questionId]) {
          answers[ans.questionId] = { option: ans.selectedOption, isFlagged: ans.isFlagged };
        }
      }
    }
  };
}
