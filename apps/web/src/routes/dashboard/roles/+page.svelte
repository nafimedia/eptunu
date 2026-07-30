<script lang="ts">
  import { onMount } from 'svelte';
  import { apiFetch } from '$api/client';
  import type { Role, Permission } from '$types';
  import { toast } from 'svelte-sonner';
  import { ShieldCheck, Check, Save } from 'lucide-svelte';

  let roles: Role[] = [];
  let permissions: Permission[] = [];
  let selectedRole: Role | null = null;
  let activePermissionSet: Set<string> = new Set();
  let isLoading = true;
  let isSaving = false;

  async function loadRolesAndPermissions() {
    isLoading = true;
    try {
      const res = await apiFetch('/roles');
      roles = res.roles || [];
      permissions = res.permissions || [];

      if (roles.length > 0) {
        selectRole(roles[0]);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat role dan permission');
    } finally {
      isLoading = false;
    }
  }

  function selectRole(role: Role) {
    selectedRole = role;
    const permNames = role.permissions || [];
    const activeIds = permissions
      .filter(p => permNames.includes(p.name))
      .map(p => p.id);
    activePermissionSet = new Set(activeIds);
  }

  function togglePermission(permId: string) {
    if (activePermissionSet.has(permId)) {
      activePermissionSet.delete(permId);
    } else {
      activePermissionSet.add(permId);
    }
    activePermissionSet = new Set(activePermissionSet);
  }

  async function saveRolePermissions() {
    if (!selectedRole) return;
    isSaving = true;

    try {
      await apiFetch(`/roles/${selectedRole.id}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ permissionIds: Array.from(activePermissionSet) }),
      });

      toast.success(`Hak akses untuk role '${selectedRole.name}' berhasil diperbarui!`);
      await loadRolesAndPermissions();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memperbarui hak akses role');
    } finally {
      isSaving = false;
    }
  }

  onMount(() => {
    loadRolesAndPermissions();
  });
</script>

<div class="space-y-6 animate-in fade-in duration-200">
  <div>
    <h1 class="text-2xl font-bold tracking-tight">Manajemen Role & Hak Akses (RBAC)</h1>
    <p class="text-xs text-muted-foreground">Konfigurasi matriks izin (permissions) untuk setiap role dalam aplikasi.</p>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
    <!-- Role Selection Column -->
    <div class="space-y-2">
      <h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">Pilih Role</h2>
      <div class="space-y-2">
        {#each roles as r}
          <button
            on:click={() => selectRole(r)}
            class="w-full text-left p-4 rounded-2xl border transition-all duration-150 flex items-center justify-between {selectedRole?.id === r.id ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25' : 'bg-card border-border/70 hover:bg-muted text-foreground'}"
          >
            <div>
              <p class="font-bold text-sm">{r.name}</p>
              <p class="text-[11px] opacity-80">{r.description || 'Role standar'}</p>
            </div>
            <ShieldCheck class="w-5 h-5 opacity-80" />
          </button>
        {/each}
      </div>
    </div>

    <!-- Permission Matrix Column -->
    <div class="lg:col-span-3 p-6 rounded-2xl bg-card border border-border/70 shadow-sm space-y-6">
      {#if selectedRole}
        <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 gap-4">
          <div>
            <h2 class="text-lg font-bold">Matriks Izin: <span class="text-primary">{selectedRole.name}</span></h2>
            <p class="text-xs text-muted-foreground">Centang fitur yang dapat diakses oleh role ini.</p>
          </div>

          {#if selectedRole.name !== 'SUPER_ADMIN'}
            <button
              on:click={saveRolePermissions}
              disabled={isSaving}
              class="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-md flex items-center gap-2"
            >
              <Save class="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Matriks Izin'}</span>
            </button>
          {/if}
        </div>

        {#if selectedRole.name === 'SUPER_ADMIN'}
          <div class="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
            ⚡ SUPER_ADMIN memiliki akses penuh secara otomatis ke seluruh sistem dan tidak dapat diubah.
          </div>
        {:else}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            {#each permissions as p}
              <label class="p-3.5 rounded-xl border border-border/70 bg-muted/20 hover:bg-muted/40 cursor-pointer flex items-start gap-3 transition-colors">
                <input
                  type="checkbox"
                  checked={activePermissionSet.has(p.id)}
                  on:change={() => togglePermission(p.id)}
                  class="mt-0.5 rounded text-primary focus:ring-primary"
                />
                <div class="space-y-0.5">
                  <span class="font-semibold text-xs text-foreground block">{p.name}</span>
                  <span class="text-[11px] text-muted-foreground block">{p.description || `Permit action ${p.action} on ${p.resource}`}</span>
                </div>
              </label>
            {/each}
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>
