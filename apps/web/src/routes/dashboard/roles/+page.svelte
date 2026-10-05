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
    Sliders,
    Layers
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
  <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-5 sm:p-6 rounded-2xl shadow-xs">
    <div>
      <h1 class="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">Manajemen Role & Hak Akses</h1>
    </div>

    <div class="flex items-center gap-3">
      <button
        type="button"
        on:click={() => { isAssignModalOpen = true; }}
        class="bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-xs px-4 py-2.5 hover:bg-primary/90 transition inline-flex items-center gap-2"
      >
        <UserCheck class="w-4 h-4" /> Tetapkan Role User
      </button>
    </div>
  </header>

  <!-- Statistics Summary -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <div class="bg-card p-5 rounded-xl border border-border shadow-sm flex items-center gap-4 text-card-foreground">
      <div class="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-primary font-bold">
        <Shield class="w-6 h-6" />
      </div>
      <div>
        <div class="text-2xl font-extrabold text-foreground">{roles.length}</div>
        <div class="text-xs text-muted-foreground font-medium">Role Terdaftar</div>
      </div>
    </div>

    <div class="bg-card p-5 rounded-xl border border-border shadow-sm flex items-center gap-4 text-card-foreground">
      <div class="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
        <Key class="w-6 h-6" />
      </div>
      <div>
        <div class="text-2xl font-extrabold text-foreground">{permissions.length}</div>
        <div class="text-xs text-muted-foreground font-medium">Hak Akses Modul</div>
      </div>
    </div>

    <div class="bg-card p-5 rounded-xl border border-border shadow-sm flex items-center gap-4 text-card-foreground">
      <div class="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
        <Users class="w-6 h-6" />
      </div>
      <div>
        <div class="text-2xl font-extrabold text-foreground">
          {roles.reduce((acc, r) => acc + r.userCount, 0)}
        </div>
        <div class="text-xs text-muted-foreground font-medium">Total Akun Terdaftar</div>
      </div>
    </div>

    <div class="bg-card p-5 rounded-xl border border-border shadow-sm flex items-center gap-4 text-card-foreground">
      <div class="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">
        <Shield class="w-6 h-6" />
      </div>
      <div>
        <div class="text-2xl font-extrabold text-foreground">7-Role</div>
        <div class="text-xs text-muted-foreground font-medium">Matriks Security</div>
      </div>
    </div>
  </div>

  <!-- View Switcher Tabs -->
  <div class="flex items-center gap-2 border-b border-border pb-2">
    <button
      type="button"
      on:click={() => (activeTab = 'cards')}
      class="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-150 {activeTab === 'cards' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted'}"
    >
      <Layers class="w-4 h-4" /> Kartu Overview Role
    </button>
    <button
      type="button"
      on:click={() => (activeTab = 'matrix')}
      class="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-150 {activeTab === 'matrix' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted'}"
    >
      <Sliders class="w-4 h-4" /> Matriks Hak Akses (Matrix View)
    </button>
  </div>

  <!-- Content Section -->
  {#if isLoading}
    <div class="p-12 text-center bg-card rounded-xl border border-border text-card-foreground">
      <div class="inline-block animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      <p class="text-muted-foreground text-sm mt-3">Memuat struktur role & hak akses...</p>
    </div>
  {:else if activeTab === 'cards'}
    <!-- CARDS VIEW -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each roles as r}
        <div class="bg-card rounded-2xl border border-border shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col justify-between text-card-foreground">
          <!-- Card Header -->
          <div class="p-6">
            <div class="flex items-start justify-between gap-3 mb-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br {roleGradients[r.role] || 'from-slate-600 to-slate-800'} text-white flex items-center justify-center font-bold shadow-md">
                <ShieldCheck class="w-5 h-5" />
              </div>
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-muted text-foreground border border-border">
                <Users class="w-3.5 h-3.5 text-muted-foreground" /> {r.userCount} Akun
              </span>
            </div>

            <h3 class="text-lg font-bold text-foreground">{r.name}</h3>
            <div class="text-xs font-mono font-semibold text-primary mb-2">{r.role}</div>
            <p class="text-muted-foreground text-xs leading-relaxed min-h-[3rem] mb-4">
              {r.description}
            </p>

            <!-- Permissions Tags -->
            <div class="space-y-1.5">
              <div class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Izin Akses Terdaftar ({r.permissions.length}):</div>
              <div class="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {#each r.permissions as perm}
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
                    <Check class="w-3 h-3" /> {perm}
                  </span>
                {/each}
              </div>
            </div>
          </div>

          <!-- Card Footer -->
          <div class="bg-muted/30 px-6 py-3 border-t border-border flex items-center justify-between">
            <span class="text-xs text-muted-foreground font-medium">Status: Active</span>
            <button
              type="button"
              on:click={() => {
                selectedRoleToAssign = r.role;
                isAssignModalOpen = true;
              }}
              class="text-xs font-semibold text-primary hover:underline transition-colors"
            >
              + Tetapkan User
            </button>
          </div>
        </div>
      {/each}
    </div>

  {:else}
    <!-- MATRIX VIEW TABLE WITH TOGGLES -->
    <div class="bg-card rounded-2xl border border-border shadow-sm overflow-hidden text-card-foreground">
      <div class="p-4 bg-muted/40 border-b border-border flex items-center justify-between">
        <div>
          <h2 class="font-bold text-foreground text-sm">Matriks Perbandingan Hak Akses (Interaktif Toggle)</h2>
          <p class="text-xs text-muted-foreground">Klik ikon centang/silang untuk mengaktifkan atau mencabut hak akses spesifik pada tiap role.</p>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-muted/50 text-muted-foreground font-bold border-b border-border">
              <th class="p-3.5 min-w-[200px]">Fitur / Hak Akses</th>
              <th class="p-3.5 text-center min-w-[120px]">Group</th>
              {#each roles as r}
                <th class="p-3.5 text-center min-w-[110px]">
                  <span class="block font-bold text-foreground">{r.name.split(' ')[0]}</span>
                  <span class="text-[10px] text-primary font-mono font-normal">{r.role}</span>
                </th>
              {/each}
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            {#each permissions as perm}
              <tr class="hover:bg-muted/40 transition-colors">
                <td class="p-3.5 font-medium text-foreground">
                  <div class="font-semibold text-foreground">{perm.name}</div>
                  <div class="text-[10px] text-muted-foreground font-mono">{perm.id}</div>
                </td>
                <td class="p-3.5 text-center">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
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
                        <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20 hover:bg-emerald-500/20">
                          <Check class="w-3.5 h-3.5" />
                        </span>
                      {:else}
                        <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground hover:bg-muted/80">
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
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
    <div class="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md overflow-hidden text-card-foreground">
      <!-- Modal Header -->
      <div class="p-5 border-b border-border flex items-center justify-between bg-card text-card-foreground">
        <div class="flex items-center gap-2.5 font-bold text-base">
          <div class="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <UserCheck class="w-4 h-4" />
          </div>
          <span>Tetapkan Role Pengguna</span>
        </div>
        <button
          type="button"
          on:click={() => (isAssignModalOpen = false)}
          class="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Modal Form Body -->
      <div class="p-6 space-y-4">
        <!-- 1. Search User -->
        <div>
          <label id="label-usersearch" for="input-usersearch" class="block text-xs font-semibold text-muted-foreground mb-1">Cari Pengguna (NIM / NIP / Nama)</label>
          <div class="relative">
            <Search class="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <input
              id="input-usersearch"
              type="text"
              bind:value={targetUserSearch}
              on:input={searchUsers}
              placeholder="Ketik NIM/NIP atau Nama..."
              class="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary text-foreground bg-background placeholder:text-muted-foreground"
            />
          </div>

          <!-- User Search Dropdown -->
          {#if searchResults.length > 0}
            <div class="mt-2 max-h-40 overflow-y-auto border border-border rounded-xl divide-y divide-border bg-card shadow-md">
              {#each searchResults as u}
                <button
                  type="button"
                  on:click={() => {
                    selectedUserForRole = u;
                    searchResults = [];
                    targetUserSearch = `${u.fullName} (${u.identityNumber})`;
                  }}
                  class="w-full text-left p-2.5 hover:bg-muted/60 transition-colors flex items-center justify-between text-xs"
                >
                  <div>
                    <div class="font-bold text-foreground">{u.fullName}</div>
                    <div class="text-muted-foreground font-mono">{u.identityNumber} • {u.role}</div>
                  </div>
                  <Check class="w-4 h-4 text-primary {selectedUserForRole?.id === u.id ? 'opacity-100' : 'opacity-0'}" />
                </button>
              {/each}
            </div>
          {/if}
        </div>

        {#if selectedUserForRole}
          <div class="p-3 bg-primary/10 rounded-xl border border-primary/20 text-xs">
            <div class="font-bold text-primary">Pengguna Terpilih:</div>
            <div class="text-foreground font-medium">{selectedUserForRole.fullName} ({selectedUserForRole.identityNumber})</div>
            <div class="text-muted-foreground font-mono mt-0.5">Role Saat Ini: {selectedUserForRole.role}</div>
          </div>
        {/if}

        <!-- 2. Select New Role -->
        <div>
          <label id="label-assignrole" for="select-assignrole" class="block text-xs font-semibold text-muted-foreground mb-1">Pilih Role Baru</label>
          <select
            id="select-assignrole"
            bind:value={selectedRoleToAssign}
            class="w-full px-3 py-2 text-sm border border-border rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary text-foreground bg-background"
          >
            {#each roles as r}
              <option value={r.role}>{r.name} ({r.role})</option>
            {/each}
          </select>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="p-4 bg-muted/30 border-t border-border flex items-center justify-end gap-3">
        <button
          type="button"
          on:click={() => (isAssignModalOpen = false)}
          class="px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted rounded-xl transition-colors"
        >
          Batal
        </button>
        <button
          type="button"
          on:click={assignUserRole}
          disabled={isSubmitting || !selectedUserForRole}
          class="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary/90 disabled:opacity-50 rounded-xl shadow-md transition-all"
        >
          {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan Role'}
        </button>
      </div>
    </div>
  </div>
{/if}
