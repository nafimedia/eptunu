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
    X,
    KeyRound,
    ChevronLeft,
    ChevronRight,
    ShieldCheck
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
    { key: 'SUPER_ADMIN', label: 'Super Admin', badgeColor: 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/50' },
    { key: 'ADMIN_EPT', label: 'Admin EPT', badgeColor: 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700/50' },
    { key: 'QUESTION_AUTHOR', label: 'Penyusun Soal', badgeColor: 'bg-teal-100 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-700/50' },
    { key: 'VALIDATOR', label: 'Validator', badgeColor: 'bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700/50' },
    { key: 'PROCTOR', label: 'Pengawas', badgeColor: 'bg-cyan-100 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700/50' },
    { key: 'STUDENT', label: 'Peserta', badgeColor: 'bg-sky-100 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-700/50' },
    { key: 'EXECUTIVE', label: 'Pimpinan', badgeColor: 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700/50' },
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
  <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-5 sm:p-6 rounded-2xl shadow-xs">
    <div>
      <h1 class="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">Manajemen Pengguna</h1>
    </div>

    <button
      type="button"
      on:click={openCreateModal}
      class="bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-xs px-4 py-2.5 hover:bg-primary/90 transition inline-flex items-center gap-2"
    >
      <UserPlus class="w-4 h-4" /> Tambah Pengguna Baru
    </button>
  </header>

  <!-- Filters & Search Toolbar -->
  <div class="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 text-card-foreground">
    <div class="flex flex-1 items-center gap-3">
      <!-- Search Input -->
      <div class="relative flex-1 max-w-md">
        <Search class="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
        <input
          type="text"
          bind:value={searchQuery}
          on:input={() => { currentPage = 1; fetchUsers(); }}
          placeholder="Cari berdasarkan NIM/NIP, Nama, atau Email..."
          class="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary text-foreground bg-background placeholder:text-muted-foreground"
        />
      </div>

      <!-- Role Filter Dropdown -->
      <select
        bind:value={selectedRole}
        on:change={() => { currentPage = 1; fetchUsers(); }}
        class="px-3 py-2 text-sm border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary text-foreground bg-background"
      >
        <option value="">Semua Role (7 Role)</option>
        {#each availableRoles as r}
          <option value={r.key}>{r.label} ({r.key})</option>
        {/each}
      </select>
    </div>

    <div class="text-xs text-muted-foreground font-medium">
      Total Terdaftar: <strong class="text-primary text-sm font-bold">{totalUsers}</strong> Akun
    </div>
  </div>

  <!-- Users Data Table -->
  <div class="bg-card rounded-2xl border border-border shadow-sm overflow-hidden text-card-foreground">
    {#if isLoading}
      <div class="p-12 text-center">
        <div class="inline-block animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <p class="text-muted-foreground text-sm mt-3">Memuat data pengguna EPTUNU...</p>
      </div>
    {:else if users.length === 0}
      <div class="p-12 text-center">
        <Users class="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
        <h3 class="text-base font-bold text-foreground">Tidak ada pengguna ditemukan</h3>
        <p class="text-muted-foreground text-xs mt-1">Coba sesuaikan kata kunci pencarian atau filter role.</p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-muted/50 text-muted-foreground font-bold border-b border-border">
              <th class="p-4">Identitas (NIM / NIP)</th>
              <th class="p-4">Nama Lengkap & Email</th>
              <th class="p-4">Role Pengguna</th>
              <th class="p-4">Program Studi / Fakultas</th>
              <th class="p-4 text-center">Aksi Manajemen</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            {#each users as u}
              <tr class="hover:bg-muted/40 transition-colors">
                <!-- Identity Number -->
                <td class="p-4 font-mono font-bold text-primary">
                  {u.identityNumber || '-'}
                </td>

                <!-- Name & Email -->
                <td class="p-4">
                  <div class="font-bold text-foreground text-sm">{u.fullName || u.name || '-'}</div>
                  <div class="text-muted-foreground font-mono text-[11px]">{u.email}</div>
                </td>

                <!-- Role Badge -->
                <td class="p-4">
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-xs {getRoleBadge(u.role)}">
                    <ShieldCheck class="w-3.5 h-3.5" /> {u.role}
                  </span>
                </td>

                <!-- Prodi & Faculty -->
                <td class="p-4 text-muted-foreground">
                  <div class="font-medium text-foreground">{u.prodi || '-'}</div>
                  <div class="text-[11px] text-muted-foreground">{u.faculty || '-'}</div>
                </td>

                <!-- Actions -->
                <td class="p-4 text-center">
                  <div class="flex items-center justify-center gap-1.5">
                    <!-- Edit Button -->
                    <button
                      type="button"
                      on:click={() => openEditModal(u)}
                      title="Edit Data User"
                      class="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
                    >
                      <Edit2 class="w-4 h-4" />
                    </button>

                    <!-- Reset Password Button -->
                    <button
                      type="button"
                      on:click={() => openResetPasswordModal(u)}
                      title="Reset Password"
                      class="p-2 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors"
                    >
                      <KeyRound class="w-4 h-4" />
                    </button>

                    <!-- Delete Button -->
                    <button
                      type="button"
                      on:click={() => handleDeleteUser(u)}
                      title="Hapus User"
                      class="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
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
      <div class="p-4 bg-muted/30 border-t border-border flex items-center justify-between">
        <div class="text-xs text-muted-foreground">
          Halaman <span class="font-bold text-foreground">{currentPage}</span> dari <span class="font-bold text-foreground">{totalPages}</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            on:click={() => { if (currentPage > 1) { currentPage--; fetchUsers(); } }}
            disabled={currentPage === 1}
            class="p-2 text-muted-foreground hover:bg-muted rounded-lg disabled:opacity-40 transition-colors"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          <button
            type="button"
            on:click={() => { if (currentPage < totalPages) { currentPage++; fetchUsers(); } }}
            disabled={currentPage === totalPages}
            class="p-2 text-muted-foreground hover:bg-muted rounded-lg disabled:opacity-40 transition-colors"
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
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
    <div class="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg overflow-hidden text-card-foreground">
      <!-- Modal Header -->
      <div class="p-5 border-b border-border flex items-center justify-between bg-card text-card-foreground">
        <div class="flex items-center gap-2.5 font-bold text-base">
          <div class="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <UserPlus class="w-4 h-4" />
          </div>
          <span>{editingUser ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}</span>
        </div>
        <button type="button" on:click={() => (isModalOpen = false)} class="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6 space-y-4">
        <!-- Identity Number -->
        <div>
          <label id="label-identity" for="input-identity" class="block text-xs font-semibold text-muted-foreground mb-1">Identitas (NIM untuk Mahasiswa / NIP untuk Dosen)</label>
          <input
            id="input-identity"
            type="text"
            bind:value={formData.identityNumber}
            placeholder="Contoh: 202601001 atau 19850415..."
            class="w-full px-3 py-2 text-sm border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary text-foreground bg-background placeholder:text-muted-foreground"
          />
        </div>

        <!-- Full Name -->
        <div>
          <label id="label-fullname" for="input-fullname" class="block text-xs font-semibold text-muted-foreground mb-1">Nama Lengkap</label>
          <input
            id="input-fullname"
            type="text"
            bind:value={formData.fullName}
            placeholder="Nama lengkap beserta gelar..."
            class="w-full px-3 py-2 text-sm border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary text-foreground bg-background placeholder:text-muted-foreground"
          />
        </div>

        <!-- Email & Role -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label id="label-email" for="input-email" class="block text-xs font-semibold text-muted-foreground mb-1">Email</label>
            <input
              id="input-email"
              type="email"
              bind:value={formData.email}
              placeholder="user@unupurwokerto.ac.id"
              class="w-full px-3 py-2 text-sm border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary text-foreground bg-background placeholder:text-muted-foreground"
            />
          </div>
          <div>
            <label id="label-role" for="input-role" class="block text-xs font-semibold text-muted-foreground mb-1">Role Pengguna</label>
            <select
              id="input-role"
              bind:value={formData.role}
              class="w-full px-3 py-2 text-sm border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary text-foreground bg-background"
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
            <label id="label-password" for="input-password" class="block text-xs font-semibold text-muted-foreground mb-1">Password Awal</label>
            <input
              id="input-password"
              type="text"
              bind:value={formData.password}
              placeholder="Default: password123"
              class="w-full px-3 py-2 text-sm border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary text-foreground bg-background placeholder:text-muted-foreground"
            />
          </div>
        {/if}

        <!-- Prodi & Faculty Dropdowns -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label id="label-prodi" for="input-prodi" class="block text-xs font-semibold text-muted-foreground mb-1">Program Studi</label>
            <select
              id="input-prodi"
              bind:value={formData.prodi}
              on:change={handleProdiChange}
              class="w-full px-3 py-2 text-sm border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary text-foreground bg-background"
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
            <label id="label-faculty" for="input-faculty" class="block text-xs font-semibold text-muted-foreground mb-1">Fakultas</label>
            <select
              id="input-faculty"
              bind:value={formData.faculty}
              on:change={handleFacultyChange}
              class="w-full px-3 py-2 text-sm border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary text-foreground bg-background"
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
      <div class="p-4 bg-muted/30 border-t border-border flex items-center justify-end gap-3">
        <button
          type="button"
          on:click={() => (isModalOpen = false)}
          class="px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted rounded-xl transition-colors"
        >
          Batal
        </button>
        <button
          type="button"
          on:click={handleSaveUser}
          class="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-md transition-all"
        >
          Simpan Data
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- RESET PASSWORD MODAL -->
{#if isResetModalOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
    <div class="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md overflow-hidden text-card-foreground">
      <div class="p-5 border-b border-border flex items-center justify-between bg-card text-card-foreground">
        <div class="flex items-center gap-2.5 font-bold text-base">
          <div class="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <KeyRound class="w-4 h-4" />
          </div>
          <span>Reset Password Pengguna</span>
        </div>
        <button type="button" on:click={() => (isResetModalOpen = false)} class="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="p-6 space-y-4">
        <p class="text-xs text-muted-foreground">
          Anda akan mereset password untuk pengguna <strong class="text-foreground font-bold">{resetTargetUser?.fullName}</strong> ({resetTargetUser?.identityNumber}).
        </p>

        <div>
          <label id="label-newpassword" for="input-newpassword" class="block text-xs font-semibold text-muted-foreground mb-1">Password Baru</label>
          <input
            id="input-newpassword"
            type="text"
            bind:value={newResetPassword}
            class="w-full px-3 py-2 text-sm border border-border rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono text-foreground bg-background"
          />
        </div>
      </div>

      <div class="p-4 bg-muted/30 border-t border-border flex items-center justify-end gap-3">
        <button
          type="button"
          on:click={() => (isResetModalOpen = false)}
          class="px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted rounded-xl transition-colors"
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
