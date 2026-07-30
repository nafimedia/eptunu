<script lang="ts">
  import { onMount } from 'svelte';
  import { apiFetch } from '$api/client';
  import type { User, UserRole } from '$types';
  import { toast } from 'svelte-sonner';
  import {
    Users,
    Search,
    UserPlus,
    Edit2,
    Trash2,
    Shield,
    X,
    KeyRound,
    CheckCircle2,
    XCircle,
    ChevronLeft,
    ChevronRight,
    GraduationCap,
    Building2,
    ShieldCheck,
    Lock
  } from 'lucide-svelte';

  let users: User[] = [];
  let isLoading = true;
  let searchQuery = '';
  let selectedRole = '';
  let currentPage = 1;
  let totalPages = 1;
  let totalUsers = 0;

  // Modal State for Create / Edit User
  let isModalOpen = false;
  let editingUser: User | null = null;
  let formData = {
    identityNumber: '',
    fullName: '',
    email: '',
    password: '',
    role: 'STUDENT' as UserRole,
    prodi: '',
    faculty: '',
  };

  // Master Data State for Dropdowns
  let masterFaculties: any[] = [];
  let masterProdis: any[] = [];

  $: filteredProdis = formData.faculty
    ? masterProdis.filter((p) => p.faculty?.name === formData.faculty || p.faculty?.code === formData.faculty)
    : masterProdis;

  async function loadMasterData() {
    try {
      const [facRes, prodiRes] = await Promise.all([
        apiFetch('/master-data/faculties'),
        apiFetch('/master-data/study-programs'),
      ]);
      masterFaculties = facRes.data || [];
      masterProdis = prodiRes.data || [];
    } catch (err) {
      console.error('Gagal memuat master data', err);
    }
  }

  function handleProdiChange() {
    const found = masterProdis.find((p) => p.name === formData.prodi);
    if (found && found.faculty?.name) {
      formData.faculty = found.faculty.name;
    }
  }

  function handleFacultyChange() {
    const valid = masterProdis.filter((p) => p.faculty?.name === formData.faculty);
    if (valid.length > 0 && !valid.some((p) => p.name === formData.prodi)) {
      formData.prodi = valid[0].name;
    }
  }

  // Reset Password Modal State
  let isResetModalOpen = false;
  let resetTargetUser: User | null = null;
  let newResetPassword = 'password123';
  let isResetting = false;

  const availableRoles: Array<{ key: UserRole; label: string; badgeColor: string }> = [
    { key: 'SUPER_ADMIN', label: 'Super Admin', badgeColor: 'bg-amber-100 text-amber-800 border-amber-300' },
    { key: 'ADMIN_EPT', label: 'Admin EPT', badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
    { key: 'QUESTION_AUTHOR', label: 'Penyusun Soal', badgeColor: 'bg-teal-100 text-teal-800 border-teal-300' },
    { key: 'VALIDATOR', label: 'Validator', badgeColor: 'bg-purple-100 text-purple-800 border-purple-300' },
    { key: 'PROCTOR', label: 'Pengawas', badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
    { key: 'STUDENT', label: 'Peserta', badgeColor: 'bg-sky-100 text-sky-800 border-sky-300' },
    { key: 'EXECUTIVE', label: 'Pimpinan', badgeColor: 'bg-rose-100 text-rose-800 border-rose-300' },
  ];

  async function fetchUsers() {
    isLoading = true;
    try {
      let queryParams = `?page=${currentPage}&limit=10`;
      if (searchQuery) queryParams += `&search=${encodeURIComponent(searchQuery)}`;
      if (selectedRole) queryParams += `&role=${encodeURIComponent(selectedRole)}`;

      const res = await apiFetch(`/users${queryParams}`);
      users = res.data || [];
      totalPages = res.pagination?.totalPages || 1;
      totalUsers = res.pagination?.total || users.length;
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat daftar pengguna');
    } finally {
      isLoading = false;
    }
  }

  function openCreateModal() {
    editingUser = null;
    const defaultProdi = masterProdis[0]?.name || 'Teknik Informatika';
    const defaultFaculty = masterProdis[0]?.faculty?.name || 'Sains dan Teknologi';
    formData = {
      identityNumber: '',
      fullName: '',
      email: '',
      password: 'password123',
      role: 'STUDENT',
      prodi: defaultProdi,
      faculty: defaultFaculty,
    };
    isModalOpen = true;
  }

  function openEditModal(user: User) {
    editingUser = user;
    formData = {
      identityNumber: user.identityNumber || '',
      fullName: user.fullName || user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'STUDENT',
      prodi: user.prodi || '',
      faculty: user.faculty || '',
    };
    isModalOpen = true;
  }

  function openResetPasswordModal(user: User) {
    resetTargetUser = user;
    newResetPassword = 'password123';
    isResetModalOpen = true;
  }

  async function handleSaveUser() {
    if (!formData.identityNumber || !formData.fullName || !formData.email) {
      toast.error('NIM/NIP, Nama Lengkap, dan Email wajib diisi');
      return;
    }
    if (!editingUser && !formData.password) {
      toast.error('Password awal wajib diisi untuk pengguna baru');
      return;
    }

    try {
      if (editingUser) {
        await apiFetch(`/users/${editingUser.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        toast.success(`Data ${formData.fullName} berhasil diperbarui`);
      } else {
        await apiFetch('/users', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        toast.success(`Pengguna baru ${formData.fullName} berhasil ditambahkan`);
      }
      isModalOpen = false;
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan data pengguna');
    }
  }

  async function handleConfirmResetPassword() {
    if (!resetTargetUser) return;
    isResetting = true;
    try {
      const res = await apiFetch(`/users/${resetTargetUser.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword: newResetPassword }),
      });
      toast.success(res.message || 'Password berhasil di-reset');
      isResetModalOpen = false;
    } catch (err: any) {
      toast.error(err.message || 'Gagal mereset password');
    } finally {
      isResetting = false;
    }
  }

  async function handleDeleteUser(user: User) {
    if (!confirm(`Apakah Anda yakin ingin menghapus pengguna ${user.fullName || user.identityNumber}?`)) return;

    try {
      await apiFetch(`/users/${user.id}`, { method: 'DELETE' });
      toast.success('Pengguna berhasil dihapus');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus pengguna');
    }
  }

  function getRoleBadge(role: UserRole) {
    const found = availableRoles.find((r) => r.key === role);
    return found ? found.badgeColor : 'bg-slate-100 text-slate-700 border-slate-200';
  }

  onMount(() => {
    fetchUsers();
    loadMasterData();
  });
</script>

<svelte:head>
  <title>Manajemen Pengguna | EPT UNU Purwokerto</title>
</svelte:head>

<div class="space-y-6">
  <!-- Page Header -->
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl border border-indigo-900/50 shadow-xl text-white">
    <div>
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30 mb-2">
        <Users class="w-3.5 h-3.5" /> Modul Pengolahan Akun
      </div>
      <h1 class="text-2xl font-extrabold tracking-tight">Manajemen Pengguna (User Management)</h1>
      <p class="text-slate-300 text-sm mt-1">
        Kelola akun Mahasiswa, Dosen, Penyusun Soal, Pengawas, dan Operator EPT UNU Purwokerto.
      </p>
    </div>

    <button
      on:click={openCreateModal}
      class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/30 transition-all duration-200"
    >
      <UserPlus class="w-4 h-4" /> Tambah Pengguna Baru
    </button>
  </div>

  <!-- Filters & Search Toolbar -->
  <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div class="flex flex-1 items-center gap-3">
      <!-- Search Input -->
      <div class="relative flex-1 max-w-md">
        <Search class="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          bind:value={searchQuery}
          on:input={() => { currentPage = 1; fetchUsers(); }}
          placeholder="Cari berdasarkan NIM/NIP, Nama, atau Email..."
          class="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 bg-white placeholder:text-slate-400"
        />
      </div>

      <!-- Role Filter Dropdown -->
      <select
        bind:value={selectedRole}
        on:change={() => { currentPage = 1; fetchUsers(); }}
        class="px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 bg-white"
      >
        <option value="">Semua Role (7 Role)</option>
        {#each availableRoles as r}
          <option value={r.key}>{r.label} ({r.key})</option>
        {/each}
      </select>
    </div>

    <div class="text-xs text-slate-500 font-medium">
      Total Terdaftar: <strong class="text-indigo-600 text-sm font-bold">{totalUsers}</strong> Akun
    </div>
  </div>

  <!-- Users Data Table -->
  <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
    {#if isLoading}
      <div class="p-12 text-center">
        <div class="inline-block animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
        <p class="text-slate-500 text-sm mt-3">Memuat data pengguna EPTUNU...</p>
      </div>
    {:else if users.length === 0}
      <div class="p-12 text-center">
        <Users class="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 class="text-base font-bold text-slate-700">Tidak ada pengguna ditemukan</h3>
        <p class="text-slate-500 text-xs mt-1">Coba sesuaikan kata kunci pencarian atau filter role.</p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <th class="p-4">Identitas (NIM / NIP)</th>
              <th class="p-4">Nama Lengkap & Email</th>
              <th class="p-4">Role Pengguna</th>
              <th class="p-4">Program Studi / Fakultas</th>
              <th class="p-4 text-center">Aksi Manajemen</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each users as u}
              <tr class="hover:bg-slate-50/80 transition-colors">
                <!-- Identity Number -->
                <td class="p-4 font-mono font-bold text-indigo-700">
                  {u.identityNumber || '-'}
                </td>

                <!-- Name & Email -->
                <td class="p-4">
                  <div class="font-bold text-slate-900 text-sm">{u.fullName || u.name || '-'}</div>
                  <div class="text-slate-500 font-mono text-[11px]">{u.email}</div>
                </td>

                <!-- Role Badge -->
                <td class="p-4">
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-xs {getRoleBadge(u.role)}">
                    <ShieldCheck class="w-3.5 h-3.5" /> {u.role}
                  </span>
                </td>

                <!-- Prodi & Faculty -->
                <td class="p-4 text-slate-600">
                  <div class="font-medium text-slate-800">{u.prodi || '-'}</div>
                  <div class="text-[11px] text-slate-400">{u.faculty || '-'}</div>
                </td>

                <!-- Actions -->
                <td class="p-4 text-center">
                  <div class="flex items-center justify-center gap-1.5">
                    <!-- Edit Button -->
                    <button
                      on:click={() => openEditModal(u)}
                      title="Edit Data User"
                      class="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Edit2 class="w-4 h-4" />
                    </button>

                    <!-- Reset Password Button -->
                    <button
                      on:click={() => openResetPasswordModal(u)}
                      title="Reset Password"
                      class="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    >
                      <KeyRound class="w-4 h-4" />
                    </button>

                    <!-- Delete Button -->
                    <button
                      on:click={() => handleDeleteUser(u)}
                      title="Hapus User"
                      class="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <div class="text-xs text-slate-500">
          Halaman <span class="font-bold text-slate-800">{currentPage}</span> dari <span class="font-bold text-slate-800">{totalPages}</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            on:click={() => { if (currentPage > 1) { currentPage--; fetchUsers(); } }}
            disabled={currentPage === 1}
            class="p-2 text-slate-600 hover:bg-slate-200 rounded-lg disabled:opacity-40 transition-colors"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          <button
            on:click={() => { if (currentPage < totalPages) { currentPage++; fetchUsers(); } }}
            disabled={currentPage === totalPages}
            class="p-2 text-slate-600 hover:bg-slate-200 rounded-lg disabled:opacity-40 transition-colors"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- CREATE / EDIT USER MODAL -->
{#if isModalOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
    <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
      <!-- Modal Header -->
      <div class="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
        <div class="flex items-center gap-2 font-bold text-base">
          <UserPlus class="w-5 h-5 text-indigo-400" /> {editingUser ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}
        </div>
        <button on:click={() => (isModalOpen = false)} class="text-slate-400 hover:text-white transition-colors">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6 space-y-4">
        <!-- Identity Number -->
        <div>
          <label id="label-identity" for="input-identity" class="block text-xs font-semibold text-slate-700 mb-1">Identitas (NIM untuk Mahasiswa / NIP untuk Dosen)</label>
          <input
            id="input-identity"
            type="text"
            bind:value={formData.identityNumber}
            placeholder="Contoh: 202601001 atau 19850415..."
            class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 bg-white placeholder:text-slate-400"
          />
        </div>

        <!-- Full Name -->
        <div>
          <label id="label-fullname" for="input-fullname" class="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap</label>
          <input
            id="input-fullname"
            type="text"
            bind:value={formData.fullName}
            placeholder="Nama lengkap beserta gelar..."
            class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 bg-white placeholder:text-slate-400"
          />
        </div>

        <!-- Email & Role -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label id="label-email" for="input-email" class="block text-xs font-semibold text-slate-700 mb-1">Email</label>
            <input
              id="input-email"
              type="email"
              bind:value={formData.email}
              placeholder="user@unupurwokerto.ac.id"
              class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 bg-white placeholder:text-slate-400"
            />
          </div>
          <div>
            <label id="label-role" for="input-role" class="block text-xs font-semibold text-slate-700 mb-1">Role Pengguna</label>
            <select
              id="input-role"
              bind:value={formData.role}
              class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 bg-white"
            >
              {#each availableRoles as r}
                <option value={r.key}>{r.label} ({r.key})</option>
              {/each}
            </select>
          </div>
        </div>

        <!-- Password (Create only) -->
        {#if !editingUser}
          <div>
            <label id="label-password" for="input-password" class="block text-xs font-semibold text-slate-700 mb-1">Password Awal</label>
            <input
              id="input-password"
              type="text"
              bind:value={formData.password}
              placeholder="Default: password123"
              class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 bg-white placeholder:text-slate-400"
            />
          </div>
        {/if}

        <!-- Prodi & Faculty Dropdowns -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label id="label-prodi" for="input-prodi" class="block text-xs font-semibold text-slate-700 mb-1">Program Studi</label>
            <select
              id="input-prodi"
              bind:value={formData.prodi}
              on:change={handleProdiChange}
              class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 bg-white"
            >
              <option value="">-- Pilih Program Studi --</option>
              {#each filteredProdis as p}
                <option value={p.name}>{p.name} ({p.code})</option>
              {/each}
              {#if formData.prodi && !masterProdis.some((p) => p.name === formData.prodi)}
                <option value={formData.prodi}>{formData.prodi}</option>
              {/if}
            </select>
          </div>
          <div>
            <label id="label-faculty" for="input-faculty" class="block text-xs font-semibold text-slate-700 mb-1">Fakultas</label>
            <select
              id="input-faculty"
              bind:value={formData.faculty}
              on:change={handleFacultyChange}
              class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 bg-white"
            >
              <option value="">-- Pilih Fakultas --</option>
              {#each masterFaculties as f}
                <option value={f.name}>{f.name} ({f.code})</option>
              {/each}
              {#if formData.faculty && !masterFaculties.some((f) => f.name === formData.faculty)}
                <option value={formData.faculty}>{formData.faculty}</option>
              {/if}
            </select>
          </div>
        </div>
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
          on:click={handleSaveUser}
          class="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-all"
        >
          Simpan Data
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- RESET PASSWORD MODAL -->
{#if isResetModalOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
    <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
      <div class="p-5 bg-gradient-to-r from-slate-900 to-amber-950 text-white flex items-center justify-between">
        <div class="flex items-center gap-2 font-bold text-base">
          <KeyRound class="w-5 h-5 text-amber-400" /> Reset Password Pengguna
        </div>
        <button on:click={() => (isResetModalOpen = false)} class="text-slate-400 hover:text-white transition-colors">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="p-6 space-y-4">
        <p class="text-xs text-slate-600">
          Anda akan mereset password untuk pengguna <strong class="text-slate-900 font-bold">{resetTargetUser?.fullName}</strong> ({resetTargetUser?.identityNumber}).
        </p>

        <div>
          <label id="label-newpassword" for="input-newpassword" class="block text-xs font-semibold text-slate-700 mb-1">Password Baru</label>
          <input
            id="input-newpassword"
            type="text"
            bind:value={newResetPassword}
            class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono text-slate-900 bg-white"
          />
        </div>
      </div>

      <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
        <button
          type="button"
          on:click={() => (isResetModalOpen = false)}
          class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
        >
          Batal
        </button>
        <button
          type="button"
          on:click={handleConfirmResetPassword}
          disabled={isResetting}
          class="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-md transition-all"
        >
          {isResetting ? 'Mereset...' : 'Konfirmasi Reset Password'}
        </button>
      </div>
    </div>
  </div>
{/if}
