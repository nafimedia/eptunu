import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function saveUploadedFile(filename: string, buffer: Buffer): Promise<{ url: string; key: string }> {
  const fileKey = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const filePath = path.join(UPLOAD_DIR, fileKey);

  await fs.promises.writeFile(filePath, buffer);

  return {
    key: fileKey,
    url: `/uploads/${fileKey}`,
  };
}
