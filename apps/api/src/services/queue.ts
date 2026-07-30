import { sendEmail } from './mailer';

export async function addEmailJob(name: string, data: any) {
  // Clean fallback when Redis / BullMQ is not running locally
  if (name === 'send-welcome') {
    await sendEmail({
      to: data.email,
      subject: 'Selamat Datang di Starter Kit!',
      html: `<h2>Halo ${data.name},</h2><p>Akun Anda telah berhasil dibuat. Silakan login ke dashboard.</p>`,
    });
  } else if (name === 'send-reset-password') {
    await sendEmail({
      to: data.email,
      subject: 'Reset Password Request',
      html: `<h2>Reset Password</h2><p>Gunakan link berikut untuk mereset password Anda: <a href="${data.resetUrl}">${data.resetUrl}</a></p>`,
    });
  }
}
