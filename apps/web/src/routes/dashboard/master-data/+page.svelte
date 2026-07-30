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
    CheckCircle2,
    X,
    Layers,
    Tag,
    Check
  } from 'lucide-svelte';

  type TabType = 'faculties' | 'prodis' | 'institutions' | 'participantTypes' | 'academicYears';

  let activeTab: TabType = 'faculties';
  let isLoading = true;

  // Master Data State
  let faculties: any[] = [];
  let prodis: any[] = [];
  let institutions: any[] = [];
  let participantTypes: any[] = [];
  let academicYears: any[] = [];

  // Modal State
  let isModalOpen = false;
  let modalTitle = '';
  let formType: TabType = 'faculties';
  let formData: any = {};

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

  async function handleSaveItem() {
    try {
      let endpoint = '';
      if (formType === 'faculties') endpoint = '/master-data/faculties';
      if (formType === 'prodis') endpoint = '/master-data/study-programs';
      if (formType === 'institutions') endpoint = '/master-data/institutions';
      if (formType === 'participantTypes') endpoint = '/master-data/participant-types';
      if (formType === 'academicYears') endpoint = '/master-data/academic-years';

      const res = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      toast.success(res.message || 'Data berhasil ditambahkan');
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
      toast.success(res.message || 'Tahun akademik aktif diperbarui');
      await loadAllMasterData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah tahun akademik aktif');
    }
  }

  onMount(() => {
    loadAllMasterData();
  });
</script>

<svelte:head>
  <title>Master Data | EPT UNU Purwokerto</title>
</svelte:head>

<div class="space-y-6">
  <!-- Page Header -->
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl border border-indigo-900/50 shadow-xl text-white">
    <div>
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30 mb-2">
        <Database class="w-3.5 h-3.5" /> Modul Referensi Utama
      </div>
      <h1 class="text-2xl font-extrabold tracking-tight">Manajemen Master Data</h1>
      <p class="text-slate-300 text-sm mt-1">
        Kelola data referensi Fakultas, Program Studi, Instansi, Jenis Peserta, dan Tahun Akademik EPTUNU.
      </p>
    </div>

    <button
      on:click={() => openCreateModal(activeTab)}
      class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/30 transition-all duration-200"
    >
      <Plus class="w-4 h-4" /> Tambah Data ({activeTab})
    </button>
  </div>

  <!-- Tab Navigation -->
  <div class="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
    <button
      on:click={() => (activeTab = 'faculties')}
      class="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-150 whitespace-nowrap {activeTab === 'faculties' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}"
    >
      <Building class="w-4 h-4" /> Fakultas ({faculties.length})
    </button>
    <button
      on:click={() => (activeTab = 'prodis')}
      class="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-150 whitespace-nowrap {activeTab === 'prodis' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}"
    >
      <GraduationCap class="w-4 h-4" /> Program Studi ({prodis.length})
    </button>
    <button
      on:click={() => (activeTab = 'institutions')}
      class="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-150 whitespace-nowrap {activeTab === 'institutions' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}"
    >
      <Landmark class="w-4 h-4" /> Instansi ({institutions.length})
    </button>
    <button
      on:click={() => (activeTab = 'participantTypes')}
      class="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-150 whitespace-nowrap {activeTab === 'participantTypes' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}"
    >
      <UserCheck class="w-4 h-4" /> Jenis Peserta ({participantTypes.length})
    </button>
    <button
      on:click={() => (activeTab = 'academicYears')}
      class="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-150 whitespace-nowrap {activeTab === 'academicYears' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}"
    >
      <Calendar class="w-4 h-4" /> Tahun Akademik ({academicYears.length})
    </button>
  </div>

  <!-- Content Section -->
  {#if isLoading}
    <div class="p-12 text-center bg-white rounded-2xl border border-slate-200">
      <div class="inline-block animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      <p class="text-slate-500 text-sm mt-3">Memuat master data EPTUNU...</p>
    </div>
  {:else}
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <!-- 1. FAKULTAS -->
      {#if activeTab === 'faculties'}
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <th class="p-4">Kode</th>
              <th class="p-4">Nama Fakultas</th>
              <th class="p-4">Deskripsi</th>
              <th class="p-4 text-center">Jumlah Prodi</th>
              <th class="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each faculties as f}
              <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="p-4 font-mono font-bold text-indigo-700">{f.code}</td>
                <td class="p-4 font-bold text-slate-900 text-sm">{f.name}</td>
                <td class="p-4 text-slate-600">{f.description || '-'}</td>
                <td class="p-4 text-center font-bold text-slate-700">{f.studyPrograms?.length || 0} Prodi</td>
                <td class="p-4 text-center">
                  <button on:click={() => handleDeleteItem('faculties', f.id, f.name)} class="p-2 text-slate-400 hover:text-red-600 rounded-lg">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>

      <!-- 2. PROGRAM STUDI -->
      {:else if activeTab === 'prodis'}
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <th class="p-4">Kode</th>
              <th class="p-4">Nama Program Studi</th>
              <th class="p-4">Fakultas Induk</th>
              <th class="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each prodis as p}
              <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="p-4 font-mono font-bold text-indigo-700">{p.code}</td>
                <td class="p-4 font-bold text-slate-900 text-sm">{p.name}</td>
                <td class="p-4 text-slate-600 font-medium">{p.faculty?.name || '-'}</td>
                <td class="p-4 text-center">
                  <button on:click={() => handleDeleteItem('prodis', p.id, p.name)} class="p-2 text-slate-400 hover:text-red-600 rounded-lg">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>

      <!-- 3. INSTANSI -->
      {:else if activeTab === 'institutions'}
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <th class="p-4">Kode</th>
              <th class="p-4">Nama Instansi</th>
              <th class="p-4 text-center">Kategori</th>
              <th class="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each institutions as inst}
              <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="p-4 font-mono font-bold text-indigo-700">{inst.code}</td>
                <td class="p-4 font-bold text-slate-900 text-sm">{inst.name}</td>
                <td class="p-4 text-center">
                  {#if inst.isInternal}
                    <span class="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Internal UNU Purwokerto
                    </span>
                  {:else}
                    <span class="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
                      Eksternal / Umum
                    </span>
                  {/if}
                </td>
                <td class="p-4 text-center">
                  <button on:click={() => handleDeleteItem('institutions', inst.id, inst.name)} class="p-2 text-slate-400 hover:text-red-600 rounded-lg">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>

      <!-- 4. JENIS PESERTA -->
      {:else if activeTab === 'participantTypes'}
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <th class="p-4">Kode</th>
              <th class="p-4">Jenis / Status Peserta</th>
              <th class="p-4">Keterangan</th>
              <th class="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each participantTypes as pt}
              <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="p-4 font-mono font-bold text-indigo-700">{pt.code}</td>
                <td class="p-4 font-bold text-slate-900 text-sm">{pt.name}</td>
                <td class="p-4 text-slate-600">{pt.description || '-'}</td>
                <td class="p-4 text-center">
                  <button on:click={() => handleDeleteItem('participantTypes', pt.id, pt.name)} class="p-2 text-slate-400 hover:text-red-600 rounded-lg">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>

      <!-- 5. TAHUN AKADEMIK -->
      {:else if activeTab === 'academicYears'}
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <th class="p-4">Kode</th>
              <th class="p-4">Nama Tahun Akademik</th>
              <th class="p-4 text-center">Status Periode</th>
              <th class="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each academicYears as ay}
              <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="p-4 font-mono font-bold text-indigo-700">{ay.code}</td>
                <td class="p-4 font-bold text-slate-900 text-sm">{ay.name}</td>
                <td class="p-4 text-center">
                  {#if ay.isCurrent}
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600" /> Periode Aktif
                    </span>
                  {:else}
                    <button
                      on:click={() => setAcademicYearCurrent(ay.id)}
                      class="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-300 transition-colors"
                    >
                      Aktifkan Periode Ini
                    </button>
                  {/if}
                </td>
                <td class="p-4 text-center">
                  <button on:click={() => handleDeleteItem('academicYears', ay.id, ay.name)} class="p-2 text-slate-400 hover:text-red-600 rounded-lg">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
  {/if}
</div>

<!-- CREATE MASTER DATA MODAL -->
{#if isModalOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
    <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
      <!-- Modal Header -->
      <div class="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
        <div class="flex items-center gap-2 font-bold text-base">
          <Plus class="w-5 h-5 text-indigo-400" /> {modalTitle}
        </div>
        <button on:click={() => (isModalOpen = false)} class="text-slate-400 hover:text-white transition-colors">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6 space-y-4">
        <div>
          <label id="lbl-mcode" for="in-mcode" class="block text-xs font-semibold text-slate-700 mb-1">Kode Unik</label>
          <input
            id="in-mcode"
            type="text"
            bind:value={formData.code}
            placeholder="Contoh: FST / TI / 20251"
            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900 bg-white placeholder:text-slate-400"
          />
        </div>

        <div>
          <label id="lbl-mname" for="in-mname" class="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap</label>
          <input
            id="in-mname"
            type="text"
            bind:value={formData.name}
            placeholder="Ketik nama data master..."
            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white placeholder:text-slate-400"
          />
        </div>

        {#if formType === 'prodis'}
          <div>
            <label id="lbl-mfac" for="in-mfac" class="block text-xs font-semibold text-slate-700 mb-1">Pilih Fakultas Induk</label>
            <select
              id="in-mfac"
              bind:value={formData.facultyId}
              class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white"
            >
              {#each faculties as f}
                <option value={f.id}>{f.name} ({f.code})</option>
              {/each}
            </select>
          </div>
        {/if}

        {#if formType === 'faculties' || formType === 'participantTypes'}
          <div>
            <label id="lbl-mdesc" for="in-mdesc" class="block text-xs font-semibold text-slate-700 mb-1">Keterangan / Deskripsi</label>
            <textarea
              id="in-mdesc"
              bind:value={formData.description}
              rows="2"
              placeholder="Deskripsi opsional..."
              class="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white placeholder:text-slate-400"
            ></textarea>
          </div>
        {/if}

        {#if formType === 'institutions'}
          <div class="flex items-center gap-2">
            <input
              id="in-minternal"
              type="checkbox"
              bind:checked={formData.isInternal}
              class="w-4 h-4 text-indigo-600 rounded"
            />
            <label for="in-minternal" class="text-xs font-semibold text-slate-700">Instansi Internal UNU Purwokerto</label>
          </div>
        {/if}

        {#if formType === 'academicYears'}
          <div class="flex items-center gap-2">
            <input
              id="in-mcurrent"
              type="checkbox"
              bind:checked={formData.isCurrent}
              class="w-4 h-4 text-indigo-600 rounded"
            />
            <label for="in-mcurrent" class="text-xs font-semibold text-slate-700">Jadikan Periode Akademik Aktif</label>
          </div>
        {/if}
      </div>

      <!-- Modal Footer -->
      <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
        <button
          type="button"
          on:click={() => (isModalOpen = false)}
          class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
        >
          Batal
        </button>
        <button
          type="button"
          on:click={handleSaveItem}
          class="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-all"
        >
          Simpan Master Data
        </button>
      </div>
    </div>
  </div>
{/if}
