import type { PageServerLoad } from './$types';
import type { CertificateVerificationDTO, ApiResponse } from '$lib/types';

export const load: PageServerLoad = async ({ params, fetch }) => {
  const certificateNo = params.certificateNo;

  try {
    const res = await fetch(`/api/certificates/verify/${encodeURIComponent(certificateNo || '')}`);
    const json: ApiResponse<CertificateVerificationDTO> = await res.json();

    if (json.success && json.data) {
      return {
        success: true,
        certData: json.data,
        errorMsg: '',
      };
    }

    return {
      success: false,
      certData: null,
      errorMsg: json.message || 'Sertifikat tidak ditemukan.',
    };
  } catch (err: any) {
    return {
      success: false,
      certData: null,
      errorMsg: err?.message || 'Gagal terhubung ke server verifikasi.',
    };
  }
};
