<script lang="ts">
  import { onMount } from 'svelte';
  import { apiFetch } from '$api/client';
  import { toast } from 'svelte-sonner';
  import {
    FileQuestion,
    Headphones,
    BookOpen,
    FileText,
    CheckCircle2,
    XCircle,
    Plus,
    Trash2,
    Check,
    X,
    Upload,
    Play,
    Pause,
    Volume2,
    Search,
    SlidersHorizontal,
    Sparkles,
    AlertCircle,
    FileSpreadsheet,
    MessageSquare,
    ChevronRight,
    Edit2,
    Download,
    FolderOpen
  } from 'lucide-svelte';

  type SectionType = 'LISTENING' | 'STRUCTURE' | 'READING';
  type TabType = 'listening' | 'structure' | 'reading' | 'review' | 'import';

  let activeTab: TabType = 'listening';
  let isLoading = true;

  // Data State
  let questions: any[] = [];
  let passages: any[] = [];
  let searchQuery = '';
  let selectedDifficulty = '';
  let selectedStatus = '';

  // Audio Player State
  let currentlyPlayingAudio: string | null = null;
  let audioPlayer: HTMLAudioElement | null = null;

  // Modal State for Create Question
  let isCreateModalOpen = false;
  let isUploadingAudio = false;

  let formData = {
    section: 'LISTENING' as SectionType,
    listeningPart: 'PART_A',
    passageId: '',
    audioUrl: '',
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctOption: 'A',
    explanation: '',
    skillTag: '',
    difficulty: 'MEDIUM',
  };

  // Passage Modal State
  let isPassageModalOpen = false;
  let passageForm = { title: '', content: '' };

  // Review Modal State
  let isReviewModalOpen = false;
  let targetReviewQuestion: any = null;
  let reviewNotes = '';

  // Batch Select State for Validator
  let selectedQuestionIds: string[] = [];

  function toggleSelectQuestion(id: string) {
    if (selectedQuestionIds.includes(id)) {
      selectedQuestionIds = selectedQuestionIds.filter((item) => item !== id);
    } else {
      selectedQuestionIds = [...selectedQuestionIds, id];
    }
  }

  function toggleSelectAll(currentList: any[]) {
    if (selectedQuestionIds.length === currentList.length) {
      selectedQuestionIds = [];
    } else {
      selectedQuestionIds = currentList.map((q) => q.id);
    }
  }

  async function handleBatchReview(status: 'APPROVED' | 'REJECTED') {
    if (selectedQuestionIds.length === 0) {
      toast.error('Pilih minimal satu soal untuk divalidasi massal');
      return;
    }

    try {
      const res = await apiFetch('/questions/batch-review', {
        method: 'POST',
        body: JSON.stringify({ ids: selectedQuestionIds, status }),
      });
      toast.success(res.message || `Berhasil mengubah status ${selectedQuestionIds.length} soal!`);
      selectedQuestionIds = [];
      await loadQuestions();
    } catch (err: any) {
      toast.error(err.message || 'Gagal melakukan validasi massal');
    }
  }

  // Excel / CSV Import State
  let importRawText = '';
  let isImporting = false;
  let parsedPreviewQuestions: any[] = [];
  let fileInputRef: HTMLInputElement;

  function downloadSampleTemplate() {
    const csvContent =
      `section,listeningPart,questionText,optionA,optionB,optionC,optionD,correctOption,skillTag,difficulty,explanation\n` +
      `LISTENING,PART_A,"Woman: The air conditioning is broken. Man: No wonder it feels like an oven in here!","He is baking something","He agrees the room is hot","He turned off the AC","He wants to repair it",B,Idioms & Similes,MEDIUM,"Feels like an oven is a simile for an extremely hot room."\n` +
      `STRUCTURE,,"The North Pole _____ a rigid land mass, but rather a thick layer of ice.","is not","that is not","which is not","not being",A,Subject-Verb Structure,EASY,"Main verb is not is required after subject."\n` +
      `READING,,"What is the main topic of the passage?","History of Banjarnegara","Ecological role and history of Serayu River","Volcanic eruption patterns","Maritime trade routes",B,Main Idea,EASY,"The passage covers ecology and history of the river."\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Template_Import_Soal_EPTUNU.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Template CSV import berhasil diunduh!');
  }

  function parseCSV(text: string) {
    const lines = text.split(/\r\n|\n/);
    if (lines.length < 2) return [];

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers: string[] = parseLine(lines[0]).map((h) => h.replace(/^"|"$/g, '').trim());
    const items: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const row = parseLine(lines[i]).map((val) => val.replace(/^"|"$/g, '').trim());
      if (row.length < 5) continue;

      const obj: any = {};
      headers.forEach((h, idx) => {
        obj[h] = row[idx] || '';
      });

      if (obj.section && obj.questionText) {
        items.push({
          section: obj.section.toUpperCase(),
          listeningPart: obj.listeningPart || null,
          questionText: obj.questionText,
          optionA: obj.optionA || '',
          optionB: obj.optionB || '',
          optionC: obj.optionC || '',
          optionD: obj.optionD || '',
          correctOption: (obj.correctOption || 'A').toUpperCase(),
          skillTag: obj.skillTag || '',
          difficulty: (obj.difficulty || 'MEDIUM').toUpperCase(),
          explanation: obj.explanation || '',
        });
      }
    }
    return items;
  }

  function handleFileUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (file.name.endsWith('.json')) {
        try {
          parsedPreviewQuestions = JSON.parse(text);
          importRawText = JSON.stringify(parsedPreviewQuestions, null, 2);
          toast.success(`Berhasil membaca ${parsedPreviewQuestions.length} soal dari berkas JSON`);
        } catch (err) {
          toast.error('Format JSON tidak valid');
        }
      } else {
        const items = parseCSV(text);
        if (items.length === 0) {
          toast.error('Gagal membaca data dari berkas CSV. Pastikan format kolom sesuai template.');
        } else {
          parsedPreviewQuestions = items;
          importRawText = JSON.stringify(items, null, 2);
          toast.success(`Berhasil mengekstrak ${items.length} soal dari berkas CSV!`);
        }
      }
    };
    reader.readAsText(file);
  }

  async function loadQuestions() {
    isLoading = true;
    try {
      let query = '';
      if (activeTab === 'listening') query = '?section=LISTENING';
      else if (activeTab === 'structure') query = '?section=STRUCTURE';
      else if (activeTab === 'reading') query = '?section=READING';
      else if (activeTab === 'review') {
        query = selectedStatus ? `?status=${selectedStatus}` : '?status=IN_REVIEW';
      }

      const [qRes, pRes] = await Promise.all([
        apiFetch(`/questions${query}`),
        apiFetch('/questions/passages'),
      ]);

      questions = qRes.data || [];
      passages = pRes.data || [];
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat bank soal');
    } finally {
      isLoading = false;
    }
  }

  function openCreateQuestionModal(section: SectionType) {
    formData = {
      section,
      listeningPart: 'PART_A',
      passageId: passages[0]?.id || '',
      audioUrl: '',
      questionText: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctOption: 'A',
      explanation: '',
      skillTag: section === 'LISTENING' ? 'Short Conversation' : (section === 'STRUCTURE' ? 'Subject-Verb Agreement' : 'Main Idea'),
      difficulty: 'MEDIUM',
    };
    isCreateModalOpen = true;
  }

  async function handleAudioUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    isUploadingAudio = true;
    const form = new FormData();
    form.append('file', file);

    try {
      const res = await fetch('/api/questions/upload-audio', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: form,
      });

      const data = await res.json();
      if (data.success) {
        formData.audioUrl = data.audioUrl;
        toast.success('Audio MP3 berhasil diunggah!');
      } else {
        toast.error(data.message || 'Gagal mengunggah audio');
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengunggah audio MP3');
    } finally {
      isUploadingAudio = false;
    }
  }

  async function handleSaveQuestion() {
    if (!formData.questionText || !formData.optionA || !formData.optionB || !formData.optionC || !formData.optionD) {
      toast.error('Soal dan seluruh Pilihan A/B/C/D wajib diisi');
      return;
    }

    try {
      const payload = {
        section: formData.section,
        listeningPart: formData.section === 'LISTENING' ? formData.listeningPart : null,
        passageId: formData.section === 'READING' ? formData.passageId : null,
        audioUrl: formData.section === 'LISTENING' ? formData.audioUrl : null,
        questionText: formData.questionText,
        options: [
          { id: 'A', text: formData.optionA },
          { id: 'B', text: formData.optionB },
          { id: 'C', text: formData.optionC },
          { id: 'D', text: formData.optionD },
        ],
        correctOption: formData.correctOption,
        explanation: formData.explanation,
        skillTag: formData.skillTag,
        difficulty: formData.difficulty,
        status: 'APPROVED',
      };

      const res = await apiFetch('/questions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      toast.success(res.message || 'Soal baru berhasil ditambahkan');
      isCreateModalOpen = false;
      await loadQuestions();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan soal');
    }
  }

  async function handleSavePassage() {
    if (!passageForm.content) {
      toast.error('Teks bacaan (Passage Content) wajib diisi');
      return;
    }
    try {
      const res = await apiFetch('/questions/passages', {
        method: 'POST',
        body: JSON.stringify(passageForm),
      });
      toast.success(res.message || 'Reading Passage berhasil ditambahkan');
      isPassageModalOpen = false;
      passageForm = { title: '', content: '' };
      await loadQuestions();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan Passage');
    }
  }

  async function handleReviewDecision(status: 'APPROVED' | 'REJECTED') {
    if (!targetReviewQuestion) return;
    try {
      const res = await apiFetch(`/questions/${targetReviewQuestion.id}/review`, {
        method: 'PUT',
        body: JSON.stringify({ status, reviewNotes }),
      });
      toast.success(res.message || 'Status validasi berhasil diperbarui');
      isReviewModalOpen = false;
      targetReviewQuestion = null;
      reviewNotes = '';
      await loadQuestions();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status validasi');
    }
  }

  async function handleExecuteBatchImport() {
    if (!importRawText) {
      toast.error('Tempelkan data JSON / CSV soal terlebih dahulu');
      return;
    }
    isImporting = true;
    try {
      let parsedQuestions = [];
      try {
        parsedQuestions = JSON.parse(importRawText);
      } catch (e) {
        toast.error('Format JSON tidak valid. Pastikan format array JSON sesuai template.');
        isImporting = false;
        return;
      }

      const res = await apiFetch('/questions/import-excel', {
        method: 'POST',
        body: JSON.stringify({ questions: parsedQuestions }),
      });

      toast.success(res.message || 'Import batch berhasil!');
      importRawText = '';
      activeTab = 'listening';
      await loadQuestions();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengimpor batch soal');
    } finally {
      isImporting = false;
    }
  }

  async function handleDeleteQuestion(id: string) {
    if (!confirm('Apakah Anda yakin ingin menghapus soal ini dari bank soal?')) return;
    try {
      await apiFetch(`/questions/${id}`, { method: 'DELETE' });
      toast.success('Soal berhasil dihapus');
      await loadQuestions();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus soal');
    }
  }

  function toggleAudioPlay(url: string) {
    if (currentlyPlayingAudio === url && audioPlayer) {
      audioPlayer.pause();
      currentlyPlayingAudio = null;
    } else {
      if (audioPlayer) audioPlayer.pause();
      audioPlayer = new Audio(url);
      audioPlayer.play();
      currentlyPlayingAudio = url;
      audioPlayer.onended = () => { currentlyPlayingAudio = null; };
    }
  }

  onMount(() => {
    loadQuestions();
  });
</script>

<svelte:head>
  <title>Bank Soal EPT | EPT UNU Purwokerto</title>
</svelte:head>

<div class="space-y-6">
  <!-- Page Header -->
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl border border-indigo-900/50 shadow-xl text-white">
    <div>
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30 mb-2">
        <FileQuestion class="w-3.5 h-3.5" /> Modul Repository & Validasi Soal
      </div>
      <h1 class="text-2xl font-extrabold tracking-tight">Bank Soal & Media Listening</h1>
      <p class="text-slate-300 text-sm mt-1">
        Kelola bank soal TOEFL ITP (Listening Part A/B/C, Structure, Reading Passage), validasi reviewer, dan batch import.
      </p>
    </div>

    <div class="flex items-center gap-3">
      {#if activeTab === 'reading'}
        <button
          on:click={() => (isPassageModalOpen = true)}
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm border border-slate-700 transition-all"
        >
          <FileText class="w-4 h-4 text-teal-400" /> + Reading Passage
        </button>
      {/if}

      <button
        on:click={() => openCreateQuestionModal(activeTab === 'listening' ? 'LISTENING' : (activeTab === 'reading' ? 'READING' : 'STRUCTURE'))}
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/30 transition-all duration-200"
      >
        <Plus class="w-4 h-4" /> Tambah Soal Baru
      </button>
    </div>
  </div>

  <!-- Tab Navigation -->
  <div class="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
    <button
      on:click={() => { activeTab = 'listening'; loadQuestions(); }}
      class="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all whitespace-nowrap {activeTab === 'listening' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}"
    >
      <Headphones class="w-4 h-4" /> Section 1: Listening
    </button>

    <button
      on:click={() => { activeTab = 'structure'; loadQuestions(); }}
      class="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all whitespace-nowrap {activeTab === 'structure' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}"
    >
      <FileQuestion class="w-4 h-4" /> Section 2: Structure
    </button>

    <button
      on:click={() => { activeTab = 'reading'; loadQuestions(); }}
      class="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all whitespace-nowrap {activeTab === 'reading' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}"
    >
      <BookOpen class="w-4 h-4" /> Section 3: Reading Passage
    </button>

    <button
      on:click={() => { activeTab = 'review'; loadQuestions(); }}
      class="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all whitespace-nowrap {activeTab === 'review' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}"
    >
      <CheckCircle2 class="w-4 h-4" /> Workflow Validasi (Validator)
    </button>

    <button
      on:click={() => (activeTab = 'import')}
      class="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all whitespace-nowrap {activeTab === 'import' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}"
    >
      <FileSpreadsheet class="w-4 h-4" /> Batch Import (Excel/CSV)
    </button>
  </div>

  <!-- Status Sub-Filter for Review Tab -->
  {#if activeTab === 'review'}
    <div class="flex items-center gap-2 bg-purple-50 p-2.5 rounded-2xl border border-purple-200 overflow-x-auto">
      <span class="text-xs font-bold text-purple-900 px-2 shrink-0">Filter Status Review:</span>
      <button
        on:click={() => { selectedStatus = 'IN_REVIEW'; loadQuestions(); }}
        class="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition {selectedStatus === 'IN_REVIEW' || !selectedStatus ? 'bg-purple-600 text-white shadow-sm' : 'bg-white text-purple-700 hover:bg-purple-100 border border-purple-200'}"
      >
        ⏳ Menunggu Review (IN_REVIEW)
      </button>
      <button
        on:click={() => { selectedStatus = 'APPROVED'; loadQuestions(); }}
        class="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition {selectedStatus === 'APPROVED' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-emerald-700 hover:bg-emerald-100 border border-emerald-200'}"
      >
        ✅ Disetujui (APPROVED)
      </button>
      <button
        on:click={() => { selectedStatus = 'REJECTED'; loadQuestions(); }}
        class="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition {selectedStatus === 'REJECTED' ? 'bg-rose-600 text-white shadow-sm' : 'bg-white text-rose-700 hover:bg-rose-100 border border-rose-200'}"
      >
        ❌ Ditolak / Minta Revisi (REJECTED)
      </button>
      <button
        on:click={() => { selectedStatus = ''; loadQuestions(); }}
        class="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition {selectedStatus === '' ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}"
      >
        📂 Semua Status
      </button>
    </div>
  {/if}

  <!-- Content Section -->
  {#if activeTab === 'import'}
    <!-- BATCH IMPORT TAB -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 class="text-base font-bold text-slate-800">Batch Import Soal (CSV / Excel / JSON Format)</h2>
          <p class="text-xs text-slate-500 mt-0.5">Unggah berkas CSV/Excel atau tempelkan JSON untuk mengimpor puluhan soal sekaligus.</p>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            on:click={downloadSampleTemplate}
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 transition"
          >
            <Download class="w-4 h-4 text-indigo-600" />
            <span>Download Template CSV</span>
          </button>

          <input
            type="file"
            accept=".csv,.txt,.json"
            bind:this={fileInputRef}
            on:change={handleFileUpload}
            class="hidden"
          />

          <button
            type="button"
            on:click={() => fileInputRef?.click()}
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition"
          >
            <FolderOpen class="w-4 h-4" />
            <span>Unggah Berkas CSV / Excel</span>
          </button>
        </div>
      </div>

      <!-- Preview Table if parsed file exists -->
      {#if parsedPreviewQuestions.length > 0}
        <div class="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-extrabold text-teal-900 flex items-center gap-2">
              <Sparkles class="w-4 h-4 text-teal-600" />
              Pratinjau Hasil Ekstraksi: {parsedPreviewQuestions.length} Soal Siap Diimpor
            </span>
            <button
              type="button"
              on:click={() => { parsedPreviewQuestions = []; importRawText = ''; }}
              class="text-xs text-teal-700 hover:underline font-semibold"
            >
              Reset Pratinjau
            </button>
          </div>

          <div class="max-h-48 overflow-y-auto border border-teal-200 rounded-xl bg-white text-xs">
            <table class="w-full text-left">
              <thead class="bg-teal-100/60 text-teal-950 font-bold sticky top-0">
                <tr>
                  <th class="p-2">#</th>
                  <th class="p-2">Section</th>
                  <th class="p-2">Teks Soal</th>
                  <th class="p-2">Kunci</th>
                  <th class="p-2">Tingkat</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-teal-100">
                {#each parsedPreviewQuestions.slice(0, 10) as item, i}
                  <tr>
                    <td class="p-2 font-bold">{i + 1}</td>
                    <td class="p-2"><span class="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold">{item.section}</span></td>
                    <td class="p-2 truncate max-w-xs">{item.questionText}</td>
                    <td class="p-2 font-black text-teal-700">{item.correctOption}</td>
                    <td class="p-2">{item.difficulty}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
          {#if parsedPreviewQuestions.length > 10}
            <p class="text-[11px] text-teal-700 font-medium text-center">Menampilkan 10 dari {parsedPreviewQuestions.length} soal pada pratinjau...</p>
          {/if}
        </div>
      {/if}

      <div>
        <label id="lbl-json" for="txt-json" class="block text-xs font-semibold text-slate-700 mb-1">Preview / Editor Data JSON Soal</label>
        <textarea
          id="txt-json"
          bind:value={importRawText}
          rows="8"
          placeholder={`[\n  {\n    "section": "STRUCTURE",\n    "questionText": "The dean of faculty _______ attending the meeting.",\n    "optionA": "are", "optionB": "is", "optionC": "were", "optionD": "have been",\n    "correctOption": "B",\n    "explanation": "Subject singular requires singular verb.",\n    "skillTag": "Subject-Verb Agreement",\n    "difficulty": "MEDIUM"\n  }\n]`}
          class="w-full px-3.5 py-3 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 bg-slate-900 text-teal-300"
        ></textarea>
      </div>

      <div class="flex items-center justify-between pt-2">
        <span class="text-xs text-slate-500">Format kolom CSV: `section,listeningPart,questionText,optionA,optionB,optionC,optionD,correctOption,skillTag,difficulty,explanation`</span>
        <button
          on:click={handleExecuteBatchImport}
          disabled={isImporting || !importRawText}
          class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all"
        >
          <Upload class="w-4 h-4" /> {isImporting ? 'Mengimpor...' : 'Proses Import Soal ke Bank Soal'}
        </button>
      </div>
    </div>

  {:else if isLoading}
    <div class="p-12 text-center bg-white rounded-2xl border border-slate-200">
      <div class="inline-block animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      <p class="text-slate-500 text-sm mt-3">Memuat bank soal EPTUNU...</p>
    </div>

  {:else if questions.length === 0}
    <div class="p-12 text-center bg-white rounded-2xl border border-slate-200">
      <FileQuestion class="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <h3 class="text-base font-bold text-slate-700">Belum Ada Soal Terdaftar</h3>
      <p class="text-slate-500 text-xs mt-1">Klik tombol "+ Tambah Soal Baru" untuk mulai menyusun bank soal.</p>
    </div>

  {:else}
    <!-- BULK ACTION FLOATING BAR FOR VALIDATOR -->
    {#if activeTab === 'review' || questions.some(q => q.status === 'IN_REVIEW')}
      <div class="p-4 bg-slate-900 text-white rounded-2xl border border-purple-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <input
            type="checkbox"
            checked={selectedQuestionIds.length === questions.length && questions.length > 0}
            on:change={() => toggleSelectAll(questions)}
            class="w-4 h-4 text-purple-600 rounded border-slate-700 bg-slate-800"
          />
          <span class="text-xs font-bold">
            Pilih Semua ({selectedQuestionIds.length}/{questions.length} Soal Terpilih)
          </span>
        </div>

        {#if selectedQuestionIds.length > 0}
          <div class="flex items-center gap-2">
            <button
              on:click={() => handleBatchReview('APPROVED')}
              class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
            >
              <CheckCircle2 class="w-3.5 h-3.5" />
              <span>Setujui Massal ({selectedQuestionIds.length})</span>
            </button>
            <button
              on:click={() => handleBatchReview('REJECTED')}
              class="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
            >
              <XCircle class="w-3.5 h-3.5" />
              <span>Minta Revisi Massal ({selectedQuestionIds.length})</span>
            </button>
          </div>
        {/if}
      </div>
    {/if}

    <!-- QUESTIONS LIST -->
    <div class="space-y-4">
      {#each questions as q, idx}
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 space-y-3">
          <!-- Card Header Badges -->
          <div class="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div class="flex items-center gap-2 flex-wrap">
              <input
                type="checkbox"
                checked={selectedQuestionIds.includes(q.id)}
                on:change={() => toggleSelectQuestion(q.id)}
                class="w-4 h-4 text-purple-600 rounded border-slate-300 mr-1"
              />

              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                #{idx + 1} {q.section}
              </span>

              {#if q.listeningPart}
                <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800 border border-cyan-200">
                  <Headphones class="w-3 h-3 inline" /> {q.listeningPart}
                </span>
              {/if}

              {#if q.skillTag}
                <span class="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  Tag: {q.skillTag}
                </span>
              {/if}

              <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold border {q.difficulty === 'EASY' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : (q.difficulty === 'HARD' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200')}">
                {q.difficulty}
              </span>
            </div>

            <!-- Status Review Badge -->
            <div class="flex items-center gap-2">
              {#if q.status === 'APPROVED'}
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600" /> Disetujui
                </span>
              {:else if q.status === 'REJECTED'}
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                  <XCircle class="w-3.5 h-3.5 text-rose-600" /> Ditolak
                </span>
              {:else}
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                  <AlertCircle class="w-3.5 h-3.5 text-purple-600" /> Menunggu Review
                </span>
              {/if}

              <button
                on:click={() => handleDeleteQuestion(q.id)}
                title="Hapus Soal"
                class="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Passage Content (If Reading) -->
          {#if q.passage}
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed italic">
              <strong class="text-slate-900 not-italic block mb-1">📖 Reading Passage: {q.passage.title || 'Teks Bacaan'}</strong>
              {q.passage.content}
            </div>
          {/if}

          <!-- Audio Preview (If Listening) -->
          {#if q.audioUrl}
            <div class="flex items-center gap-3 p-3 bg-cyan-50/70 rounded-xl border border-cyan-100">
              <button
                on:click={() => toggleAudioPlay(q.audioUrl)}
                class="w-9 h-9 rounded-full bg-cyan-600 text-white flex items-center justify-center shadow-md hover:bg-cyan-500 transition-colors"
              >
                {#if currentlyPlayingAudio === q.audioUrl}
                  <Pause class="w-4 h-4" />
                {:else}
                  <Play class="w-4 h-4 ml-0.5" />
                {/if}
              </button>
              <span class="text-xs font-medium text-cyan-900">Audio Listening MP3: <span class="font-mono text-cyan-700">{q.audioUrl}</span></span>
            </div>
          {/if}

          <!-- Question Text -->
          <div class="text-sm font-semibold text-slate-900">
            {q.questionText}
          </div>

          <!-- Options Grid A/B/C/D -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {#each q.options as opt}
              <div class="p-2.5 rounded-xl border flex items-center justify-between transition-colors {opt.id === q.correctOption ? 'bg-emerald-50/80 border-emerald-300 font-bold text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-700'}">
                <span><strong>{opt.id}.</strong> {opt.text}</span>
                {#if opt.id === q.correctOption}
                  <span class="px-2 py-0.5 rounded-full text-[10px] bg-emerald-600 text-white font-bold">KUNCI</span>
                {/if}
              </div>
            {/each}
          </div>

          <!-- Explanation / Review Notes -->
          {#if q.explanation}
            <div class="text-xs text-indigo-700 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100">
              <strong>💡 Pembahasan:</strong> {q.explanation}
            </div>
          {/if}

          {#if q.reviewNotes}
            <div class="text-xs text-rose-700 bg-rose-50/50 p-2.5 rounded-xl border border-rose-100">
              <strong>📝 Catatan Validator:</strong> {q.reviewNotes}
            </div>
          {/if}

          <!-- Review Action Button for Review Tab -->
          {#if activeTab === 'review'}
            <div class="pt-2 flex justify-end">
              <button
                on:click={() => { targetReviewQuestion = q; isReviewModalOpen = true; }}
                class="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-md transition-all"
              >
                Validasi Soal Ini
              </button>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- CREATE QUESTION MODAL -->
{#if isCreateModalOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
    <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
      <div class="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
        <div class="flex items-center gap-2 font-bold text-base">
          <Plus class="w-5 h-5 text-indigo-400" /> Tambah Soal {formData.section}
        </div>
        <button on:click={() => (isCreateModalOpen = false)} class="text-slate-400 hover:text-white transition-colors">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="p-6 space-y-4 overflow-y-auto flex-1">
        <!-- Listening Part / Audio Upload -->
        {#if formData.section === 'LISTENING'}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label id="lbl-lpart" for="sel-lpart" class="block text-xs font-semibold text-slate-700 mb-1">Part Listening</label>
              <select
                id="sel-lpart"
                bind:value={formData.listeningPart}
                class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white"
              >
                <option value="PART_A">Part A (Short Conversation)</option>
                <option value="PART_B">Part B (Long Conversation)</option>
                <option value="PART_C">Part C (Talks / Lectures)</option>
              </select>
            </div>

            <div>
              <label id="lbl-audio" for="file-audio" class="block text-xs font-semibold text-slate-700 mb-1">Upload File Audio MP3</label>
              <input
                id="file-audio"
                type="file"
                accept="audio/mp3,audio/mpeg"
                on:change={handleAudioUpload}
                class="w-full text-xs text-slate-700 border border-slate-300 rounded-xl p-1.5 bg-white"
              />
              {#if formData.audioUrl}
                <div class="text-[11px] text-emerald-600 font-mono mt-1">✓ Audio: {formData.audioUrl}</div>
              {/if}
            </div>
          </div>
        {/if}

        <!-- Reading Passage Selector -->
        {#if formData.section === 'READING'}
          <div>
            <label id="lbl-passage" for="sel-passage" class="block text-xs font-semibold text-slate-700 mb-1">Pilih Reading Passage (Teks Bacaan)</label>
            <select
              id="sel-passage"
              bind:value={formData.passageId}
              class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white"
            >
              {#each passages as p}
                <option value={p.id}>{p.title || 'Passage'} ({p.content.substring(0, 50)}...)</option>
              {/each}
            </select>
          </div>
        {/if}

        <!-- Question Text -->
        <div>
          <label id="lbl-qtext" for="txt-qtext" class="block text-xs font-semibold text-slate-700 mb-1">Teks Soal / Pertanyaan</label>
          <textarea
            id="txt-qtext"
            bind:value={formData.questionText}
            rows="3"
            placeholder="Tuliskan teks pertanyaan soal TOEFL ITP..."
            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white placeholder:text-slate-400"
          ></textarea>
        </div>

        <!-- Options A/B/C/D -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label id="lbl-opta" for="in-opta" class="block text-xs font-semibold text-slate-700 mb-1">Pilihan A</label>
            <input id="in-opta" type="text" bind:value={formData.optionA} placeholder="Teks pilihan A..." class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl text-slate-900 bg-white placeholder:text-slate-400" />
          </div>
          <div>
            <label id="lbl-optb" for="in-optb" class="block text-xs font-semibold text-slate-700 mb-1">Pilihan B</label>
            <input id="in-optb" type="text" bind:value={formData.optionB} placeholder="Teks pilihan B..." class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl text-slate-900 bg-white placeholder:text-slate-400" />
          </div>
          <div>
            <label id="lbl-optc" for="in-optc" class="block text-xs font-semibold text-slate-700 mb-1">Pilihan C</label>
            <input id="in-optc" type="text" bind:value={formData.optionC} placeholder="Teks pilihan C..." class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl text-slate-900 bg-white placeholder:text-slate-400" />
          </div>
          <div>
            <label id="lbl-optd" for="in-optd" class="block text-xs font-semibold text-slate-700 mb-1">Pilihan D</label>
            <input id="in-optd" type="text" bind:value={formData.optionD} placeholder="Teks pilihan D..." class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl text-slate-900 bg-white placeholder:text-slate-400" />
          </div>
        </div>

        <!-- Correct Option & Difficulty -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label id="lbl-correct" for="sel-correct" class="block text-xs font-semibold text-slate-700 mb-1">Kunci Jawaban</label>
            <select id="sel-correct" bind:value={formData.correctOption} class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl font-bold text-slate-900 bg-white">
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </div>

          <div>
            <label id="lbl-diff" for="sel-diff" class="block text-xs font-semibold text-slate-700 mb-1">Tingkat Kesulitan</label>
            <select id="sel-diff" bind:value={formData.difficulty} class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl text-slate-900 bg-white">
              <option value="EASY">EASY (Mudah)</option>
              <option value="MEDIUM">MEDIUM (Sedang)</option>
              <option value="HARD">HARD (Sulit)</option>
            </select>
          </div>

          <div>
            <label id="lbl-tag" for="in-tag" class="block text-xs font-semibold text-slate-700 mb-1">Tag Skill Kategori</label>
            <input id="in-tag" type="text" bind:value={formData.skillTag} placeholder="Main Idea, Idiom, dsb" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl text-slate-900 bg-white placeholder:text-slate-400" />
          </div>
        </div>

        <!-- Explanation -->
        <div>
          <label id="lbl-exp" for="txt-exp" class="block text-xs font-semibold text-slate-700 mb-1">Pembahasan / Explanation (Opsional)</label>
          <textarea id="txt-exp" bind:value={formData.explanation} rows="2" placeholder="Penjelasan tata bahasa atau petunjuk kunci jawaban..." class="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl text-slate-900 bg-white placeholder:text-slate-400"></textarea>
        </div>
      </div>

      <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
        <button type="button" on:click={() => (isCreateModalOpen = false)} class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl">Batal</button>
        <button type="button" on:click={handleSaveQuestion} class="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md">Simpan Soal</button>
      </div>
    </div>
  </div>
{/if}

<!-- READING PASSAGE MODAL -->
{#if isPassageModalOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
    <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
      <div class="p-5 bg-gradient-to-r from-slate-900 to-teal-950 text-white flex items-center justify-between">
        <div class="flex items-center gap-2 font-bold text-base">
          <BookOpen class="w-5 h-5 text-teal-400" /> Tambah Reading Passage Baru
        </div>
        <button on:click={() => (isPassageModalOpen = false)} class="text-slate-400 hover:text-white"><X class="w-5 h-5" /></button>
      </div>

      <div class="p-6 space-y-4">
        <div>
          <label id="lbl-ptitle" for="in-ptitle" class="block text-xs font-semibold text-slate-700 mb-1">Judul Passage (Opsional)</label>
          <input id="in-ptitle" type="text" bind:value={passageForm.title} placeholder="Judul topik bacaan..." class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl text-slate-900 bg-white placeholder:text-slate-400" />
        </div>
        <div>
          <label id="lbl-pcont" for="txt-pcont" class="block text-xs font-semibold text-slate-700 mb-1">Teks Bacaan (Content)</label>
          <textarea id="txt-pcont" bind:value={passageForm.content} rows="6" placeholder="Tulis atau tempel paragraf teks bacaan..." class="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl text-slate-900 bg-white placeholder:text-slate-400"></textarea>
        </div>
      </div>

      <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
        <button type="button" on:click={() => (isPassageModalOpen = false)} class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl">Batal</button>
        <button type="button" on:click={handleSavePassage} class="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-xl shadow-md">Simpan Passage</button>
      </div>
    </div>
  </div>
{/if}

<!-- VALIDATOR REVIEW DECISION MODAL -->
{#if isReviewModalOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
    <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
      <div class="p-5 bg-gradient-to-r from-slate-900 to-purple-950 text-white flex items-center justify-between">
        <div class="flex items-center gap-2 font-bold text-base">
          <CheckCircle2 class="w-5 h-5 text-purple-400" /> Validasi Soal (Reviewer)
        </div>
        <button on:click={() => (isReviewModalOpen = false)} class="text-slate-400 hover:text-white"><X class="w-5 h-5" /></button>
      </div>

      <div class="p-6 space-y-4">
        <div class="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border">
          <strong>Pertanyaan Soal:</strong> {targetReviewQuestion?.questionText}
        </div>

        <div>
          <label id="lbl-rnotes" for="txt-rnotes" class="block text-xs font-semibold text-slate-700 mb-1">Catatan Revisi / Evaluasi (Opsional)</label>
          <textarea id="txt-rnotes" bind:value={reviewNotes} rows="3" placeholder="Tuliskan alasan penolakan atau catatan perbaikan..." class="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl text-slate-900 bg-white placeholder:text-slate-400"></textarea>
        </div>
      </div>

      <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <button
          type="button"
          on:click={() => handleReviewDecision('REJECTED')}
          class="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-sm"
        >
          ❌ Tolak (Reject)
        </button>

        <button
          type="button"
          on:click={() => handleReviewDecision('APPROVED')}
          class="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md"
        >
          ✓ Setujui (Approve)
        </button>
      </div>
    </div>
  </div>
{/if}
