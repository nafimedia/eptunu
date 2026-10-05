<script lang="ts">
  import { onMount } from 'svelte';
  import { apiFetch } from '$api/client';
  import { toast } from 'svelte-sonner';
  import {
    Database,
    Building,
    GraduationCap,
    Landmark,
    UserCheck,
    Calendar,
    Plus,
    Trash2,
    Edit2,
    CheckCircle2,
    X,
    Layers,
    Tag,
    Check,
    Search,
    RefreshCw,
    AlertCircle
  } from 'lucide-svelte';

  type TabType = 'faculties' | 'prodis' | 'institutions' | 'participantTypes' | 'academicYears';

  let activeTab: TabType = 'academicYears'; // Default to academic years as requested or easy access
  let isLoading = true;
  let searchQuery = '';

  // Master Data State
  let faculties: any[] = [];
  let prodis: any[] = [];
  let institutions: any[] = [];
  let participantTypes: any[] = [];
  let academicYears: any[] = [];

  // Modal State
  let isModalOpen = false;
  let isEditMode = false;
  let editingId: string | null = null;
  let modalTitle = '';
  let formType: TabType = 'academicYears';
  let formData: any = {};

  const tabLabels: Record<TabType, string> = {
    faculties: 'Fakultas',
    prodis: 'Program Studi',
    institutions: 'Instansi',
    participantTypes: 'Jenis Peserta',
    academicYears: 'Tahun Akademik',
  };

  async function loadAllMasterData() {
    isLoading = true;
    try {
      const [fRes, pRes, iRes, ptRes, ayRes] = await Promise.all([
        apiFetch('/master-data/faculties'),
        apiFetch('/master-data/study-programs'),
        apiFetch('/master-data/institutions'),
        apiFetch('/master-data/participant-types'),
        apiFetch('/master-data/academic-years'),
      ]);

      faculties = fRes.data || [];
      prodis = pRes.data || [];
      institutions = iRes.data || [];
      participantTypes = ptRes.data || [];
      academicYears = ayRes.data || [];
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat master data');
    } finally {
      isLoading = false;
    }
  }

  function openCreateModal(type: TabType) {
    formType = type;
    isEditMode = false;
    editingId = null;

    if (type === 'faculties') {
      modalTitle = 'Tambah Fakultas Baru';
      formData = { code: '', name: '', description: '' };
    } else if (type === 'prodis') {
      modalTitle = 'Tambah Program Studi Baru';
      formData = { code: '', name: '', facultyId: faculties[0]?.id || '' };
    } else if (type === 'institutions') {
      modalTitle = 'Tambah Instansi Baru';
      formData = { code: '', name: '', isInternal: true };
    } else if (type === 'participantTypes') {
      modalTitle = 'Tambah Jenis Peserta Baru';
      formData = { code: '', name: '', description: '' };
    } else if (type === 'academicYears') {
      modalTitle = 'Tambah Tahun Akademik Baru';
      formData = { code: '', name: '', isCurrent: false };
    }
    isModalOpen = true;
  }

  function openEditModal(type: TabType, item: any) {
    formType = type;
    isEditMode = true;
    editingId = item.id;

    if (type === 'faculties') {
      modalTitle = 'Edit Data Fakultas';
      formData = { code: item.code, name: item.name, description: item.description || '' };
    } else if (type === 'prodis') {
      modalTitle = 'Edit Data Program Studi';
      formData = { code: item.code, name: item.name, facultyId: item.facultyId || item.faculty?.id || '' };
    } else if (type === 'institutions') {
      modalTitle = 'Edit Data Instansi';
      formData = { code: item.code, name: item.name, isInternal: Boolean(item.isInternal) };
    } else if (type === 'participantTypes') {
      modalTitle = 'Edit Jenis Peserta';
      formData = { code: item.code, name: item.name, description: item.description || '' };
    } else if (type === 'academicYears') {
      modalTitle = 'Edit Tahun Akademik';
      formData = { code: item.code, name: item.name, isCurrent: Boolean(item.isCurrent) };
    }
    isModalOpen = true;
  }

  async function handleSaveItem() {
    if (!formData.code?.trim() || !formData.name?.trim()) {
      toast.error('Kode dan Nama data master wajib diisi');
      return;
    }

    try {
      let endpoint = '';
      if (formType === 'faculties') endpoint = '/master-data/faculties';
      if (formType === 'prodis') endpoint = '/master-data/study-programs';
      if (formType === 'institutions') endpoint = '/master-data/institutions';
      if (formType === 'participantTypes') endpoint = '/master-data/participant-types';
      if (formType === 'academicYears') endpoint = '/master-data/academic-years';

      const method = isEditMode ? 'PUT' : 'POST';
      const targetUrl = isEditMode ? `${endpoint}/${editingId}` : endpoint;

      const res = await apiFetch(targetUrl, {
        method,
        body: JSON.stringify(formData),
      });

      toast.success(res.message || (isEditMode ? 'Data berhasil diperbarui' : 'Data berhasil ditambahkan'));
      isModalOpen = false;
      await loadAllMasterData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan data');
    }
  }

  async function handleDeleteItem(type: TabType, id: string, name: string) {
    if (!confirm(`Apakah Anda yakin ingin menghapus '${name}'?`)) return;

    try {
      let endpoint = '';
      if (type === 'faculties') endpoint = `/master-data/faculties/${id}`;
      if (type === 'prodis') endpoint = `/master-data/study-programs/${id}`;
      if (type === 'institutions') endpoint = `/master-data/institutions/${id}`;
      if (type === 'participantTypes') endpoint = `/master-data/participant-types/${id}`;
      if (type === 'academicYears') endpoint = `/master-data/academic-years/${id}`;

      await apiFetch(endpoint, { method: 'DELETE' });
      toast.success('Data berhasil dihapus');
      await loadAllMasterData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus data');
    }
  }

  async function setAcademicYearCurrent(id: string) {
    try {
      const res = await apiFetch(`/master-data/academic-years/${id}/set-current`, { method: 'PUT' });
      toast.success(res.message || 'Tahun akademik aktif berhasil diperbarui');
      await loadAllMasterData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah tahun akademik aktif');
    }
  }

  // Reactive filters
  $: filteredAcademicYears = academicYears.filter((ay) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return ay.code.toLowerCase().includes(q) || ay.name.toLowerCase().includes(q);
  });

  $: filteredFaculties = faculties.filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return f.code.toLowerCase().includes(q) || f.name.toLowerCase().includes(q);
  });

  $: filteredProdis = prodis.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || p.faculty?.name?.toLowerCase().includes(q);
  });

  $: filteredInstitutions = institutions.filter((i) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return i.code.toLowerCase().includes(q) || i.name.toLowerCase().includes(q);
  });

  $: filteredParticipantTypes = participantTypes.filter((pt) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return pt.code.toLowerCase().includes(q) || pt.name.toLowerCase().includes(q);
  });

  onMount(() => {
    loadAllMasterData();
  });
</script>

<svelte:head>
  <title>Master Data | EPT UNU Purwokerto</title>
</svelte:head>

<div class="space-y-6">
  <!-- Page Header -->
  <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-5 sm:p-6 rounded-2xl shadow-xs">
    <div>
      <div class="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 mb-2">
        <Database class="w-3.5 h-3.5" /> Modul Referensi Utama EPTUNU
      </div>
      <h1 class="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">Manajemen Master Data</h1>
      <p class="text-xs sm:text-sm text-muted-foreground mt-1">
        Kelola data referensi Tahun Akademik, Fakultas, Program Studi, Instansi, dan Jenis Peserta.
      </p>
    </div>

    <!-- Prominent Action Buttons -->
    <div class="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        on:click={loadAllMasterData}
        class="border border-border bg-card hover:bg-muted text-foreground font-bold text-xs rounded-xl px-4 py-2.5 transition inline-flex items-center gap-2"
      >
        <RefreshCw class="w-3.5 h-3.5" />
        <span>Refresh</span>
      </button>

      <button
        type="button"
        on:click={() => openCreateModal(activeTab)}
        class="bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-xs px-4 py-2.5 hover:bg-primary/90 transition inline-flex items-center gap-2"
      >
        <Plus class="w-4 h-4" />
        <span>Tambah {tabLabels[activeTab]}</span>
      </button>
    </div>
  </header>

  <!-- Tab Navigation -->
  <div class="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
    <button
      type="button"
      on:click={() => { activeTab = 'academicYears'; searchQuery = ''; }}
      class="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all duration-150 whitespace-nowrap {activeTab === 'academicYears' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
    >
      <Calendar class="w-4 h-4" /> Tahun Akademik ({academicYears.length})
    </button>
    <button
      type="button"
      on:click={() => { activeTab = 'faculties'; searchQuery = ''; }}
      class="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all duration-150 whitespace-nowrap {activeTab === 'faculties' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
    >
      <Building class="w-4 h-4" /> Fakultas ({faculties.length})
    </button>
    <button
      type="button"
      on:click={() => { activeTab = 'prodis'; searchQuery = ''; }}
      class="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all duration-150 whitespace-nowrap {activeTab === 'prodis' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
    >
      <GraduationCap class="w-4 h-4" /> Program Studi ({prodis.length})
    </button>
    <button
      type="button"
      on:click={() => { activeTab = 'institutions'; searchQuery = ''; }}
      class="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all duration-150 whitespace-nowrap {activeTab === 'institutions' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
    >
      <Landmark class="w-4 h-4" /> Instansi ({institutions.length})
    </button>
    <button
      type="button"
      on:click={() => { activeTab = 'participantTypes'; searchQuery = ''; }}
      class="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all duration-150 whitespace-nowrap {activeTab === 'participantTypes' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
    >
      <UserCheck class="w-4 h-4" /> Jenis Peserta ({participantTypes.length})
    </button>
  </div>

  <!-- Search & Action Toolbar for active tab -->
  <div class="bg-card border border-border p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
    <div class="relative w-full sm:w-80">
      <Search class="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Cari {tabLabels[activeTab]}..."
        class="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
      />
    </div>

    <!-- Explicit Tambah Button for Active Tab -->
    <button
      type="button"
      on:click={() => openCreateModal(activeTab)}
      class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-xl text-xs font-bold transition shadow-xs"
    >
      <Plus class="w-4 h-4" />
      <span>+ Tambah {tabLabels[activeTab]} Baru</span>
    </button>
  </div>

  <!-- Content Section -->
  {#if isLoading}
    <div class="p-12 text-center bg-card rounded-2xl border border-border">
      <div class="inline-block animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      <p class="text-muted-foreground text-xs mt-3">Memuat master data EPTUNU dari database...</p>
    </div>
  {:else}
    <div class="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
      <!-- 1. TAHUN AKADEMIK (ACADEMIC YEARS) -->
      {#if activeTab === 'academicYears'}
        {#if filteredAcademicYears.length === 0}
          <div class="p-12 text-center space-y-3">
            <Calendar class="w-10 h-10 text-muted-foreground mx-auto" />
            <h3 class="text-sm font-bold text-foreground">Belum Ada Data Tahun Akademik</h3>
            <p class="text-xs text-muted-foreground max-w-sm mx-auto">
              Silakan tambahkan tahun akademik baru untuk menentukan periode aktif penyelenggaraan tes EPT.
            </p>
            <button
              type="button"
              on:click={() => openCreateModal('academicYears')}
              class="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl inline-flex items-center gap-2 shadow"
            >
              <Plus class="w-4 h-4" />
              <span>+ Tambah Tahun Akademik</span>
            </button>
          </div>
        {:else}
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-muted/40 text-muted-foreground font-bold border-b border-border">
                <th class="p-4">Kode Periode</th>
                <th class="p-4">Nama Tahun Akademik</th>
                <th class="p-4 text-center">Status Periode</th>
                <th class="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              {#each filteredAcademicYears as ay}
                <tr class="hover:bg-muted/20 transition-colors">
                  <td class="p-4 font-mono font-bold text-primary">{ay.code}</td>
                  <td class="p-4 font-bold text-foreground text-sm">{ay.name}</td>
                  <td class="p-4 text-center">
                    {#if ay.isCurrent}
                      <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <CheckCircle2 class="w-3.5 h-3.5 text-emerald-500" /> Periode Aktif
                      </span>
                    {:else}
                      <button
                        type="button"
                        on:click={() => setAcademicYearCurrent(ay.id)}
                        class="px-3 py-1 rounded-full text-xs font-semibold bg-muted hover:bg-primary/10 hover:text-primary text-muted-foreground border border-border transition-colors"
                      >
                        Jadikan Aktif
                      </button>
                    {/if}
                  </td>
                  <td class="p-4 text-center">
                    <div class="inline-flex items-center gap-1">
                      <button
                        type="button"
                        on:click={() => openEditModal('academicYears', ay)}
                        class="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition"
                        title="Edit Tahun Akademik"
                      >
                        <Edit2 class="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        on:click={() => handleDeleteItem('academicYears', ay.id, ay.name)}
                        class="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition"
                        title="Hapus Tahun Akademik"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}

      <!-- 2. FAKULTAS -->
      {:else if activeTab === 'faculties'}
        {#if filteredFaculties.length === 0}
          <div class="p-12 text-center space-y-3">
            <Building class="w-10 h-10 text-muted-foreground mx-auto" />
            <h3 class="text-sm font-bold text-foreground">Tidak Ada Fakultas</h3>
            <button
              type="button"
              on:click={() => openCreateModal('faculties')}
              class="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl inline-flex items-center gap-2"
            >
              <Plus class="w-4 h-4" /> Tambah Fakultas
            </button>
          </div>
        {:else}
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-muted/40 text-muted-foreground font-bold border-b border-border">
                <th class="p-4">Kode</th>
                <th class="p-4">Nama Fakultas</th>
                <th class="p-4">Deskripsi</th>
                <th class="p-4 text-center">Jumlah Prodi</th>
                <th class="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              {#each filteredFaculties as f}
                <tr class="hover:bg-muted/20 transition-colors">
                  <td class="p-4 font-mono font-bold text-primary">{f.code}</td>
                  <td class="p-4 font-bold text-foreground text-sm">{f.name}</td>
                  <td class="p-4 text-muted-foreground">{f.description || '-'}</td>
                  <td class="p-4 text-center font-bold text-foreground">{f.studyPrograms?.length || 0} Prodi</td>
                  <td class="p-4 text-center">
                    <div class="inline-flex items-center gap-1">
                      <button
                        type="button"
                        on:click={() => openEditModal('faculties', f)}
                        class="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition"
                      >
                        <Edit2 class="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        on:click={() => handleDeleteItem('faculties', f.id, f.name)}
                        class="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}

      <!-- 3. PROGRAM STUDI -->
      {:else if activeTab === 'prodis'}
        {#if filteredProdis.length === 0}
          <div class="p-12 text-center space-y-3">
            <GraduationCap class="w-10 h-10 text-muted-foreground mx-auto" />
            <h3 class="text-sm font-bold text-foreground">Tidak Ada Program Studi</h3>
            <button
              type="button"
              on:click={() => openCreateModal('prodis')}
              class="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl inline-flex items-center gap-2"
            >
              <Plus class="w-4 h-4" /> Tambah Program Studi
            </button>
          </div>
        {:else}
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-muted/40 text-muted-foreground font-bold border-b border-border">
                <th class="p-4">Kode Prodi</th>
                <th class="p-4">Nama Program Studi</th>
                <th class="p-4">Fakultas Induk</th>
                <th class="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              {#each filteredProdis as p}
                <tr class="hover:bg-muted/20 transition-colors">
                  <td class="p-4 font-mono font-bold text-primary">{p.code}</td>
                  <td class="p-4 font-bold text-foreground text-sm">{p.name}</td>
                  <td class="p-4 text-muted-foreground">{p.faculty?.name || '-'} ({p.faculty?.code || '-'})</td>
                  <td class="p-4 text-center">
                    <div class="inline-flex items-center gap-1">
                      <button
                        type="button"
                        on:click={() => openEditModal('prodis', p)}
                        class="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition"
                      >
                        <Edit2 class="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        on:click={() => handleDeleteItem('prodis', p.id, p.name)}
                        class="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}

      <!-- 4. INSTANSI -->
      {:else if activeTab === 'institutions'}
        {#if filteredInstitutions.length === 0}
          <div class="p-12 text-center space-y-3">
            <Landmark class="w-10 h-10 text-muted-foreground mx-auto" />
            <h3 class="text-sm font-bold text-foreground">Tidak Ada Instansi</h3>
            <button
              type="button"
              on:click={() => openCreateModal('institutions')}
              class="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl inline-flex items-center gap-2"
            >
              <Plus class="w-4 h-4" /> Tambah Instansi
            </button>
          </div>
        {:else}
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-muted/40 text-muted-foreground font-bold border-b border-border">
                <th class="p-4">Kode</th>
                <th class="p-4">Nama Instansi</th>
                <th class="p-4 text-center">Tipe Instansi</th>
                <th class="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              {#each filteredInstitutions as inst}
                <tr class="hover:bg-muted/20 transition-colors">
                  <td class="p-4 font-mono font-bold text-primary">{inst.code}</td>
                  <td class="p-4 font-bold text-foreground text-sm">{inst.name}</td>
                  <td class="p-4 text-center">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold {inst.isInternal ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-muted text-muted-foreground border border-border'}">
                      {inst.isInternal ? 'Internal UNU' : 'Eksternal / Mitra'}
                    </span>
                  </td>
                  <td class="p-4 text-center">
                    <div class="inline-flex items-center gap-1">
                      <button
                        type="button"
                        on:click={() => openEditModal('institutions', inst)}
                        class="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition"
                      >
                        <Edit2 class="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        on:click={() => handleDeleteItem('institutions', inst.id, inst.name)}
                        class="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}

      <!-- 5. JENIS PESERTA -->
      {:else if activeTab === 'participantTypes'}
        {#if filteredParticipantTypes.length === 0}
          <div class="p-12 text-center space-y-3">
            <UserCheck class="w-10 h-10 text-muted-foreground mx-auto" />
            <h3 class="text-sm font-bold text-foreground">Tidak Ada Jenis Peserta</h3>
            <button
              type="button"
              on:click={() => openCreateModal('participantTypes')}
              class="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl inline-flex items-center gap-2"
            >
              <Plus class="w-4 h-4" /> Tambah Jenis Peserta
            </button>
          </div>
        {:else}
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-muted/40 text-muted-foreground font-bold border-b border-border">
                <th class="p-4">Kode</th>
                <th class="p-4">Nama Jenis Peserta</th>
                <th class="p-4">Keterangan</th>
                <th class="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              {#each filteredParticipantTypes as pt}
                <tr class="hover:bg-muted/20 transition-colors">
                  <td class="p-4 font-mono font-bold text-primary">{pt.code}</td>
                  <td class="p-4 font-bold text-foreground text-sm">{pt.name}</td>
                  <td class="p-4 text-muted-foreground">{pt.description || '-'}</td>
                  <td class="p-4 text-center">
                    <div class="inline-flex items-center gap-1">
                      <button
                        type="button"
                        on:click={() => openEditModal('participantTypes', pt)}
                        class="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition"
                      >
                        <Edit2 class="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        on:click={() => handleDeleteItem('participantTypes', pt.id, pt.name)}
                        class="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      {/if}
    </div>
  {/if}
</div>

<!-- CREATE / EDIT MASTER DATA MODAL -->
{#if isModalOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
    <div class="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md overflow-hidden text-foreground">
      <!-- Modal Header -->
      <div class="p-5 bg-muted/40 border-b border-border flex items-center justify-between">
        <div class="flex items-center gap-2 font-bold text-base text-foreground">
          {#if isEditMode}
            <Edit2 class="w-5 h-5 text-primary" />
          {:else}
            <Plus class="w-5 h-5 text-primary" />
          {/if}
          <span>{modalTitle}</span>
        </div>
        <button type="button" on:click={() => (isModalOpen = false)} class="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6 space-y-4 text-xs">
        <div>
          <label id="lbl-mcode" for="in-mcode" class="block font-semibold text-foreground mb-1.5">
            {#if formType === 'academicYears'}
              Kode Tahun Akademik (Contoh: 2025/2026-GANJIL)
            {:else}
              Kode Unik
            {/if}
          </label>
          <input
            id="in-mcode"
            type="text"
            bind:value={formData.code}
            placeholder={formType === 'academicYears' ? 'Contoh: 2025/2026-GANJIL' : 'Contoh: FST / TI / REG'}
            class="w-full px-3.5 py-2.5 text-xs border border-border rounded-xl focus:ring-2 focus:ring-primary font-mono text-foreground bg-background placeholder:text-muted-foreground outline-none"
          />
        </div>

        <div>
          <label id="lbl-mname" for="in-mname" class="block font-semibold text-foreground mb-1.5">
            {#if formType === 'academicYears'}
              Nama Tahun Akademik (Contoh: Tahun Akademik 2025/2026 Ganjil)
            {:else}
              Nama Lengkap
            {/if}
          </label>
          <input
            id="in-mname"
            type="text"
            bind:value={formData.name}
            placeholder={formType === 'academicYears' ? 'Contoh: Tahun Akademik 2025/2026 Ganjil' : 'Ketik nama data master...'}
            class="w-full px-3.5 py-2.5 text-xs border border-border rounded-xl focus:ring-2 focus:ring-primary text-foreground bg-background placeholder:text-muted-foreground outline-none"
          />
        </div>

        {#if formType === 'prodis'}
          <div>
            <label id="lbl-mfac" for="in-mfac" class="block font-semibold text-foreground mb-1.5">Pilih Fakultas Induk</label>
            <select
              id="in-mfac"
              bind:value={formData.facultyId}
              class="w-full px-3.5 py-2.5 text-xs border border-border rounded-xl focus:ring-2 focus:ring-primary text-foreground bg-background outline-none"
            >
              {#each faculties as f}
                <option value={f.id}>{f.name} ({f.code})</option>
              {/each}
            </select>
          </div>
        {/if}

        {#if formType === 'faculties' || formType === 'participantTypes'}
          <div>
            <label id="lbl-mdesc" for="in-mdesc" class="block font-semibold text-foreground mb-1.5">Keterangan / Deskripsi</label>
            <textarea
              id="in-mdesc"
              bind:value={formData.description}
              rows="2"
              placeholder="Deskripsi opsional..."
              class="w-full px-3.5 py-2 text-xs border border-border rounded-xl focus:ring-2 focus:ring-primary text-foreground bg-background placeholder:text-muted-foreground outline-none"
            ></textarea>
          </div>
        {/if}

        {#if formType === 'institutions'}
          <div class="flex items-center gap-2 pt-1">
            <input
              id="in-minternal"
              type="checkbox"
              bind:checked={formData.isInternal}
              class="w-4 h-4 text-primary rounded"
            />
            <label for="in-minternal" class="text-xs font-semibold text-foreground cursor-pointer">
              Instansi Internal UNU Purwokerto
            </label>
          </div>
        {/if}

        {#if formType === 'academicYears'}
          <div class="p-3 bg-muted/30 border border-border rounded-xl flex items-center gap-3">
            <input
              id="in-mcurrent"
              type="checkbox"
              bind:checked={formData.isCurrent}
              class="w-4 h-4 text-primary rounded cursor-pointer"
            />
            <label for="in-mcurrent" class="text-xs font-semibold text-foreground cursor-pointer">
              Jadikan Periode Akademik Aktif Saat Ini
            </label>
          </div>
        {/if}
      </div>

      <!-- Modal Footer -->
      <div class="p-4 bg-muted/40 border-t border-border flex items-center justify-end gap-3">
        <button
          type="button"
          on:click={() => (isModalOpen = false)}
          class="px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted rounded-xl transition-colors"
        >
          Batal
        </button>
        <button
          type="button"
          on:click={handleSaveItem}
          class="px-4 py-2 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl shadow-md transition-all"
        >
          {isEditMode ? 'Simpan Perubahan' : 'Simpan Master Data'}
        </button>
      </div>
    </div>
  </div>
{/if}
