<script lang="ts">
  import { onMount } from 'svelte';
  import { apiFetch } from '$api/client';
  import type { UserRole } from '$types';
  import { toast } from 'svelte-sonner';
  import {
    ShieldCheck,
    Users,
    Key,
    Check,
    X,
    UserCheck,
    Search,
    Shield,
    Sparkles,
    Sliders,
    Layers,
    Lock
  } from 'lucide-svelte';

  interface RoleInfo {
    id: string;
    role: UserRole;
    name: string;
    description: string;
    permissions: string[];
    userCount: number;
  }

  interface PermissionInfo {
    id: string;
    name: string;
    group: string;
    description: string;
  }

  let roles: RoleInfo[] = [];
  let permissions: PermissionInfo[] = [];
  let isLoading = true;
  let activeTab: 'cards' | 'matrix' = 'cards';

  // Modal State for Assigning User Role
  let isAssignModalOpen = false;
  let targetUserSearch = '';
  let selectedUserForRole: any = null;
  let selectedRoleToAssign: UserRole = 'STUDENT';
  let isSubmitting = false;
  let searchResults: any[] = [];

  async function loadRolesData() {
    isLoading = true;
    try {
      const res = await apiFetch('/roles');
      roles = res.roles || [];
      permissions = res.permissions || [];
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat data role');
    } finally {
      isLoading = false;
    }
  }

  async function searchUsers() {
    if (!targetUserSearch || targetUserSearch.length < 2) {
      searchResults = [];
      return;
    }
    try {
      const res = await apiFetch(`/users?search=${encodeURIComponent(targetUserSearch)}`);
      searchResults = res.data || [];
    } catch (err) {
      searchResults = [];
    }
  }

  async function assignUserRole() {
    if (!selectedUserForRole) {
      toast.error('Pilih pengguna terlebih dahulu');
      return;
    }
    isSubmitting = true;
    try {
      const res = await apiFetch('/roles/user-role', {
        method: 'PUT',
        body: JSON.stringify({
          userId: selectedUserForRole.id,
          newRole: selectedRoleToAssign,
        }),
      });
      toast.success(res.message || 'Role berhasil diperbarui');
      isAssignModalOpen = false;
      selectedUserForRole = null;
      targetUserSearch = '';
      await loadRolesData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah role pengguna');
    } finally {
      isSubmitting = false;
    }
  }

  function togglePermission(roleIndex: number, permId: string) {
    const roleObj = roles[roleIndex];
    if (!roleObj) return;

    if (roleObj.role === 'SUPER_ADMIN') {
      toast.info('Super Admin secara otomatis memiliki seluruh hak akses sistem');
      return;
    }

    const hasPerm = roleObj.permissions.includes(permId);
    if (hasPerm) {
      roleObj.permissions = roleObj.permissions.filter((p) => p !== permId);
      toast.warning(`Hak akses '${permId}' dicabut dari ${roleObj.name}`);
    } else {
      roleObj.permissions = [...roleObj.permissions, permId];
      toast.success(`Hak akses '${permId}' diberikan kepada ${roleObj.name}`);
    }
    roles = [...roles];
  }

  const roleGradients: Record<string, string> = {
    SUPER_ADMIN: 'from-amber-500 to-red-600',
    ADMIN_EPT: 'from-blue-600 to-indigo-700',
    QUESTION_AUTHOR: 'from-emerald-500 to-teal-700',
    VALIDATOR: 'from-purple-600 to-indigo-800',
    PROCTOR: 'from-cyan-500 to-blue-700',
    STUDENT: 'from-sky-500 to-indigo-600',
    EXECUTIVE: 'from-rose-500 to-purple-700',
  };

  onMount(() => {
    loadRolesData();
  });
</script>

<svelte:head>
  <title>Manajemen Role & Hak Akses | EPT UNU Purwokerto</title>
</svelte:head>

<div class="space-y-6">
  <!-- Page Header -->
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl border border-indigo-900/50 shadow-xl text-white">
    <div>
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30 mb-2">
        <ShieldCheck class="w-3.5 h-3.5" /> Modul RBAC & Akses
      </div>
      <h1 class="text-2xl font-extrabold tracking-tight">Manajemen Role & Hak Akses</h1>
      <p class="text-slate-300 text-sm mt-1">
        Kelola 7 hirarki role pengguna dan matriks izin akses fitur pada platform EPT UNU Purwokerto.
      </p>
    </div>

    <div class="flex items-center gap-3">
      <button
        on:click={() => { isAssignModalOpen = true; }}
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/30 transition-all duration-200"
      >
        <UserCheck class="w-4 h-4" /> Tetapkan Role User
      </button>
    </div>
  </div>

  <!-- Statistics Summary -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <div class="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
      <div class="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
        <Shield class="w-6 h-6" />
      </div>
      <div>
        <div class="text-2xl font-extrabold text-slate-800">{roles.length}</div>
        <div class="text-xs text-slate-500 font-medium">Role Terdaftar</div>
      </div>
    </div>

    <div class="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
      <div class="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold">
        <Key class="w-6 h-6" />
      </div>
      <div>
        <div class="text-2xl font-extrabold text-slate-800">{permissions.length}</div>
        <div class="text-xs text-slate-500 font-medium">Hak Akses Modul</div>
      </div>
    </div>

    <div class="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
      <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
        <Users class="w-6 h-6" />
      </div>
      <div>
        <div class="text-2xl font-extrabold text-slate-800">
          {roles.reduce((acc, r) => acc + r.userCount, 0)}
        </div>
        <div class="text-xs text-slate-500 font-medium">Total Akun Terdaftar</div>
      </div>
    </div>

    <div class="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
      <div class="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 font-bold">
        <Sparkles class="w-6 h-6" />
      </div>
      <div>
        <div class="text-2xl font-extrabold text-slate-800">7-Role</div>
        <div class="text-xs text-slate-500 font-medium">Matriks Security</div>
      </div>
    </div>
  </div>

  <!-- View Switcher Tabs -->
  <div class="flex items-center gap-2 border-b border-slate-200 pb-2">
    <button
      on:click={() => (activeTab = 'cards')}
      class="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-150 {activeTab === 'cards' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-600 hover:bg-slate-100'}"
    >
      <Layers class="w-4 h-4" /> Kartu Overview Role
    </button>
    <button
      on:click={() => (activeTab = 'matrix')}
      class="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-150 {activeTab === 'matrix' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-600 hover:bg-slate-100'}"
    >
      <Sliders class="w-4 h-4" /> Matriks Hak Akses (Matrix View)
    </button>
  </div>

  <!-- Content Section -->
  {#if isLoading}
    <div class="p-12 text-center bg-white rounded-xl border border-slate-200">
      <div class="inline-block animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      <p class="text-slate-500 text-sm mt-3">Memuat struktur role & hak akses...</p>
    </div>
  {:else if activeTab === 'cards'}
    <!-- CARDS VIEW -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each roles as r}
        <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-200 overflow-hidden flex flex-col justify-between">
          <!-- Card Header -->
          <div class="p-6">
            <div class="flex items-start justify-between gap-3 mb-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br {roleGradients[r.role] || 'from-slate-600 to-slate-800'} text-white flex items-center justify-center font-bold shadow-md">
                <ShieldCheck class="w-5 h-5" />
              </div>
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                <Users class="w-3.5 h-3.5 text-slate-500" /> {r.userCount} Akun
              </span>
            </div>

            <h3 class="text-lg font-bold text-slate-800">{r.name}</h3>
            <div class="text-xs font-mono font-semibold text-indigo-600 mb-2">{r.role}</div>
            <p class="text-slate-600 text-xs leading-relaxed min-h-[3rem] mb-4">
              {r.description}
            </p>

            <!-- Permissions Tags -->
            <div class="space-y-1.5">
              <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Izin Akses Terdaftar ({r.permissions.length}):</div>
              <div class="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {#each r.permissions as perm}
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                    <Check class="w-3 h-3 text-indigo-500" /> {perm}
                  </span>
                {/each}
              </div>
            </div>
          </div>

          <!-- Card Footer -->
          <div class="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between">
            <span class="text-xs text-slate-500 font-medium">Status: Active</span>
            <button
              on:click={() => {
                selectedRoleToAssign = r.role;
                isAssignModalOpen = true;
              }}
              class="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              + Tetapkan User
            </button>
          </div>
        </div>
      {/each}
    </div>

  {:else}
    <!-- MATRIX VIEW TABLE WITH TOGGLES -->
    <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      <div class="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 class="font-bold text-slate-800 text-sm">Matriks Perbandingan Hak Akses (Interaktif Toggle)</h2>
          <p class="text-xs text-slate-500">Klik ikon centang/silang untuk mengaktifkan atau mencabut hak akses spesifik pada tiap role.</p>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <th class="p-3.5 min-w-[200px]">Fitur / Hak Akses</th>
              <th class="p-3.5 text-center min-w-[120px]">Group</th>
              {#each roles as r}
                <th class="p-3.5 text-center min-w-[110px]">
                  <span class="block font-bold text-slate-800">{r.name.split(' ')[0]}</span>
                  <span class="text-[10px] text-indigo-600 font-mono font-normal">{r.role}</span>
                </th>
              {/each}
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each permissions as perm}
              <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="p-3.5 font-medium text-slate-800">
                  <div class="font-semibold text-slate-900">{perm.name}</div>
                  <div class="text-[10px] text-slate-400 font-mono">{perm.id}</div>
                </td>
                <td class="p-3.5 text-center">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    {perm.group}
                  </span>
                </td>
                {#each roles as r, rIdx}
                  <td class="p-3.5 text-center">
                    <button
                      type="button"
                      on:click={() => togglePermission(rIdx, perm.id)}
                      title="Klik untuk ubah izin"
                      class="transition-transform active:scale-95"
                    >
                      {#if r.permissions.includes(perm.id)}
                        <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold shadow-xs hover:bg-emerald-200">
                          <Check class="w-3.5 h-3.5" />
                        </span>
                      {:else}
                        <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200">
                          <X class="w-3.5 h-3.5" />
                        </span>
                      {/if}
                    </button>
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>

<!-- ASSIGN USER ROLE MODAL -->
{#if isAssignModalOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
    <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
      <!-- Modal Header -->
      <div class="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
        <div class="flex items-center gap-2 font-bold text-base">
          <UserCheck class="w-5 h-5 text-indigo-400" /> Tetapkan Role Pengguna
        </div>
        <button
          on:click={() => (isAssignModalOpen = false)}
          class="text-slate-400 hover:text-white transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Modal Form Body -->
      <div class="p-6 space-y-4">
        <!-- 1. Search User -->
        <div>
          <label id="label-usersearch" for="input-usersearch" class="block text-xs font-semibold text-slate-700 mb-1">Cari Pengguna (NIM / NIP / Nama)</label>
          <div class="relative">
            <Search class="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              id="input-usersearch"
              type="text"
              bind:value={targetUserSearch}
              on:input={searchUsers}
              placeholder="Ketik NIM/NIP atau Nama..."
              class="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 bg-white placeholder:text-slate-400"
            />
          </div>

          <!-- User Search Dropdown -->
          {#if searchResults.length > 0}
            <div class="mt-2 max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white shadow-md">
              {#each searchResults as u}
                <button
                  type="button"
                  on:click={() => {
                    selectedUserForRole = u;
                    searchResults = [];
                    targetUserSearch = `${u.fullName} (${u.identityNumber})`;
                  }}
                  class="w-full text-left p-2.5 hover:bg-indigo-50 transition-colors flex items-center justify-between text-xs"
                >
                  <div>
                    <div class="font-bold text-slate-800">{u.fullName}</div>
                    <div class="text-slate-500 font-mono">{u.identityNumber} • {u.role}</div>
                  </div>
                  <Check class="w-4 h-4 text-indigo-600 {selectedUserForRole?.id === u.id ? 'opacity-100' : 'opacity-0'}" />
                </button>
              {/each}
            </div>
          {/if}
        </div>

        {#if selectedUserForRole}
          <div class="p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-xs">
            <div class="font-bold text-indigo-900">Pengguna Terpilih:</div>
            <div class="text-indigo-700">{selectedUserForRole.fullName} ({selectedUserForRole.identityNumber})</div>
            <div class="text-indigo-600 font-mono mt-0.5">Role Saat Ini: {selectedUserForRole.role}</div>
          </div>
        {/if}

        <!-- 2. Select New Role -->
        <div>
          <label id="label-assignrole" for="select-assignrole" class="block text-xs font-semibold text-slate-700 mb-1">Pilih Role Baru</label>
          <select
            id="select-assignrole"
            bind:value={selectedRoleToAssign}
            class="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 bg-white"
          >
            {#each roles as r}
              <option value={r.role}>{r.name} ({r.role})</option>
            {/each}
          </select>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
        <button
          type="button"
          on:click={() => (isAssignModalOpen = false)}
          class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
        >
          Batal
        </button>
        <button
          type="button"
          on:click={assignUserRole}
          disabled={isSubmitting || !selectedUserForRole}
          class="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl shadow-md transition-all"
        >
          {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan Role'}
        </button>
      </div>
    </div>
  </div>
{/if}
