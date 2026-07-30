<script lang="ts">
  import { onMount } from 'svelte';
  import { apiFetch } from '$api/client';
  import type { User, Role } from '$types';
  import { toast } from 'svelte-sonner';
  import {
    Users,
    Search,
    UserPlus,
    Edit2,
    Trash2,
    Shield,
    X,
    CheckCircle2,
    XCircle,
    ChevronLeft,
    ChevronRight
  } from 'lucide-svelte';

  let users: User[] = [];
  let roles: Role[] = [];
  let isLoading = true;
  let searchQuery = '';
  let selectedRole = '';
  let currentPage = 1;
  let totalPages = 1;

  // Modal State
  let isModalOpen = false;
  let editingUser: User | null = null;
  let formData = {
    name: '',
    email: '',
    password: '',
    roleId: '',
    isActive: true,
  };

  async function fetchUsers() {
    isLoading = true;
    try {
      let queryParams = `?page=${currentPage}&limit=10`;
      if (searchQuery) queryParams += `&search=${encodeURIComponent(searchQuery)}`;
      if (selectedRole) queryParams += `&role=${encodeURIComponent(selectedRole)}`;

      const res = await apiFetch(`/users${queryParams}`);
      users = res.data || [];
      totalPages = res.pagination.totalPages || 1;
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat daftar pengguna');
    } finally {
      isLoading = false;
    }
  }

  async function fetchRoles() {
    try {
      const res = await apiFetch('/roles');
      roles = res.roles || [];
      if (roles.length > 0 && !formData.roleId) {
        formData.roleId = roles[0].id;
      }
    } catch (e) {
      // fallback
    }
  }

  function openCreateModal() {
    editingUser = null;
    formData = {
      name: '',
      email: '',
      password: '',
      roleId: roles.length > 0 ? roles[0].id : '',
      isActive: true,
    };
    isModalOpen = true;
  }

  function openEditModal(user: User) {
    editingUser = user;
    formData = {
      name: user.name,
      email: user.email,
      password: '',
      roleId: user.roleId || (roles.find(r => r.name === user.role)?.id || ''),
      isActive: user.isActive ?? true,
    };
    isModalOpen = true;
  }

  async function handleSave() {
    if (!formData.name || !formData.email) {
      toast.error('Nama dan Email wajib diisi');
      return;
    }
    if (!editingUser && !formData.password) {
      toast.error('Password wajib diisi untuk pengguna baru');
      return;
    }

    try {
      if (editingUser) {
        await apiFetch(`/users/${editingUser.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        toast.success('Pengguna berhasil diperbarui');
      } else {
        await apiFetch('/users', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        toast.success('Pengguna baru berhasil ditambahkan');
      }
      isModalOpen = false;
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan data pengguna');
    }
  }

  async function handleDelete(user: User) {
    if (user.isSystem) {
      toast.error('Pengguna sistem tidak dapat dihapus');
      return;
    }
    if (!confirm(`Apakah Anda yakin ingin menghapus ${user.name}?`)) return;

    try {
      await apiFetch(`/users/${user.id}`, { method: 'DELETE' });
      toast.success('Pengguna berhasil dihapus');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus pengguna');
    }
  }

  onMount(() => {
    fetchRoles();
    fetchUsers();
  });
</script>

<div class="space-y-6 animate-in fade-in duration-200">
  <!-- Header Title & Create Action -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">Manajemen Pengguna</h1>
      <p class="text-xs text-muted-foreground">Kelola akun, role, dan hak akses pengguna sistem.</p>
    </div>
    <button
      on:click={openCreateModal}
      class="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-lg shadow-primary/25 transition-all flex items-center gap-2"
    >
      <UserPlus class="w-4 h-4" />
      <span>Tambah Pengguna Baru</span>
    </button>
  </div>

  <!-- Search & Filter Controls -->
  <div class="p-4 rounded-2xl bg-card border border-border/70 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
    <div class="relative w-full sm:w-80">
      <Search class="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
      <input
        type="text"
        bind:value={searchQuery}
        on:input={() => { currentPage = 1; fetchUsers(); }}
        placeholder="Cari berdasarkan nama atau email..."
        class="w-full pl-9 pr-4 py-2 bg-muted/40 border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary"
      />
    </div>

    <div class="flex items-center gap-3 w-full sm:w-auto">
      <select
        bind:value={selectedRole}
        on:change={() => { currentPage = 1; fetchUsers(); }}
        class="py-2 px-3 bg-muted/40 border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="">Semua Role</option>
        {#each roles as r}
          <option value={r.name}>{r.name}</option>
        {/each}
      </select>
    </div>
  </div>

  <!-- Data Table -->
  <div class="bg-card border border-border/70 rounded-2xl shadow-sm overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse text-xs">
        <thead>
          <tr class="bg-muted/40 border-b border-border text-muted-foreground uppercase tracking-wider font-semibold">
            <th class="p-4">Pengguna</th>
            <th class="p-4">Role</th>
            <th class="p-4">Status</th>
            <th class="p-4">Tanggal Buat</th>
            <th class="p-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          {#if isLoading}
            <tr>
              <td colspan="5" class="p-8 text-center text-muted-foreground">Memuat data pengguna...</td>
            </tr>
          {:else if users.length === 0}
            <tr>
              <td colspan="5" class="p-8 text-center text-muted-foreground">Tidak ada pengguna ditemukan.</td>
            </tr>
          {:else}
            {#each users as u}
              <tr class="hover:bg-muted/20 transition-colors">
                <td class="p-4">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs">
                      {u.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p class="font-semibold text-foreground">{u.name}</p>
                      <p class="text-[11px] text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td class="p-4">
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Shield class="w-3 h-3" /> {u.role}
                  </span>
                </td>
                <td class="p-4">
                  {#if u.isActive}
                    <span class="inline-flex items-center gap-1 text-emerald-400 font-medium">
                      <CheckCircle2 class="w-3.5 h-3.5" /> Aktif
                    </span>
                  {:else}
                    <span class="inline-flex items-center gap-1 text-rose-400 font-medium">
                      <XCircle class="w-3.5 h-3.5" /> Nonaktif
                    </span>
                  {/if}
                </td>
                <td class="p-4 text-muted-foreground">
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                </td>
                <td class="p-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button
                      on:click={() => openEditModal(u)}
                      class="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Edit"
                    >
                      <Edit2 class="w-4 h-4" />
                    </button>
                    {#if !u.isSystem}
                      <button
                        on:click={() => handleDelete(u)}
                        class="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    {/if}
                  </div>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>

    <!-- Pagination Footer -->
    <div class="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
      <span>Halaman {currentPage} dari {totalPages}</span>
      <div class="flex items-center gap-2">
        <button
          disabled={currentPage <= 1}
          on:click={() => { currentPage--; fetchUsers(); }}
          class="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-50"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>
        <button
          disabled={currentPage >= totalPages}
          on:click={() => { currentPage++; fetchUsers(); }}
          class="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-50"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</div>

<!-- Modal Create / Edit User -->
{#if isModalOpen}
  <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
      <div class="flex items-center justify-between border-b border-border pb-3">
        <h3 class="font-bold text-base">{editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h3>
        <button on:click={() => (isModalOpen = false)} class="p-1 rounded-lg text-muted-foreground hover:bg-muted">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="space-y-4 text-xs">
        <div class="space-y-1">
          <label for="name" class="font-semibold">Nama Lengkap</label>
          <input
            id="name"
            type="text"
            bind:value={formData.name}
            class="w-full p-2.5 bg-muted/40 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary"
            placeholder="John Doe"
          />
        </div>

        <div class="space-y-1">
          <label for="email" class="font-semibold">Alamat Email</label>
          <input
            id="email"
            type="email"
            bind:value={formData.email}
            class="w-full p-2.5 bg-muted/40 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary"
            placeholder="john@example.com"
          />
        </div>

        <div class="space-y-1">
          <label for="password" class="font-semibold">{editingUser ? 'Password (Kosongkan jika tidak ingin diubah)' : 'Kata Sandi'}</label>
          <input
            id="password"
            type="password"
            bind:value={formData.password}
            class="w-full p-2.5 bg-muted/40 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary"
            placeholder="••••••••"
          />
        </div>

        <div class="space-y-1">
          <label for="role" class="font-semibold">Role Pengguna</label>
          <select
            id="role"
            bind:value={formData.roleId}
            class="w-full p-2.5 bg-muted/40 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary"
          >
            {#each roles as r}
              <option value={r.id}>{r.name} - {r.description}</option>
            {/each}
          </select>
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 pt-2 border-t border-border">
        <button on:click={() => (isModalOpen = false)} class="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted">Batal</button>
        <button on:click={handleSave} class="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 shadow-md">Simpan</button>
      </div>
    </div>
  </div>
{/if}
