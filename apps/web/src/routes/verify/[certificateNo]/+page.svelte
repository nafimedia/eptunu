<script lang="ts">
  import type { PageData } from './$types';
  import { ShieldCheck, GraduationCap, XCircle } from 'lucide-svelte';

  export let data: PageData;

  $: certData = data.certData;
  $: errorMsg = data.errorMsg;
</script>

<svelte:head>
  <title>
    {certData
      ? `Sertifikat Resmi ${certData.student?.fullName || ''} - UNU Purwokerto`
      : 'Verifikasi Sertifikat EPT - UNU Purwokerto'}
  </title>
</svelte:head>

<div class="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4">
  <div class="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
    {#if errorMsg}
      <div class="w-16 h-16 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
        <XCircle class="w-8 h-8" />
      </div>
      <span class="inline-block px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
        Sertifikat Tidak Ditemukan
      </span>
      <h1 class="text-xl font-extrabold text-white mb-2">Verifikasi Gagal</h1>
      <p class="text-xs text-slate-400 mb-6">{errorMsg}</p>
      <a
        href="/"
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
      >
        <span>Kembali ke Beranda</span>
      </a>
    {:else if certData}
      <div class="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
        <ShieldCheck class="w-8 h-8" />
      </div>

      <span class="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
        Sertifikat Resmi Terverifikasi
      </span>

      <h1 class="text-xl font-extrabold text-white mb-1">UPT Bahasa UNU Purwokerto</h1>
      <p class="text-xs text-slate-400 mb-6">Verifikasi Keaslian Sertifikat English Proficiency Test (EPT)</p>

      <div class="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 text-left space-y-3 text-xs mb-6">
        <div class="flex justify-between border-b border-slate-800 pb-2">
          <span class="text-slate-400">Nomor Sertifikat:</span>
          <span class="font-mono text-indigo-400 font-bold">{certData.certificateNo}</span>
        </div>
        <div class="flex justify-between border-b border-slate-800 pb-2">
          <span class="text-slate-400">Nama Pemilik:</span>
          <span class="text-white font-bold">{certData.student?.fullName}</span>
        </div>
        <div class="flex justify-between border-b border-slate-800 pb-2">
          <span class="text-slate-400">NIM / Identitas:</span>
          <span class="text-slate-200 font-mono">{certData.student?.identityNumber || '-'}</span>
        </div>
        <div class="flex justify-between border-b border-slate-800 pb-2">
          <span class="text-slate-400">Total Skor EPT:</span>
          <span class="text-emerald-400 font-extrabold text-sm">{certData.scores?.total}</span>
        </div>
        <div class="flex justify-between border-b border-slate-800 pb-2">
          <span class="text-slate-400">Status Masa Berlaku:</span>
          <span class={`font-bold ${certData.isExpired ? 'text-rose-400' : 'text-emerald-400'}`}>
            {certData.isExpired ? 'Kedaluwarsa' : 'BERLAKU'}
          </span>
        </div>
        <div class="flex justify-between border-b border-slate-800 pb-2">
          <span class="text-slate-400">Tanggal Terbit:</span>
          <span class="text-slate-200">{new Date(certData.issuedAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-400">Signer / Penerbit:</span>
          <span class="text-slate-200 font-medium">{certData.signerName}</span>
        </div>
      </div>

      <div class="p-3 bg-indigo-950/40 rounded-xl border border-indigo-800/40 text-left text-[10px] text-indigo-300 font-mono break-all mb-6">
        <span class="text-slate-500 block mb-0.5 font-sans uppercase font-bold">SHA-256 Signature Hash:</span>
        {certData.verificationHash}
      </div>

      <a
        href="/login"
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg"
      >
        <GraduationCap class="w-4 h-4" />
        <span>Kembali ke Portal EPTUNU</span>
      </a>
    {/if}
  </div>
</div>
