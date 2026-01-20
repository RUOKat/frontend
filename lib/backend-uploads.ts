import { getTokens, BASE_URL } from './backend';

/**
 * 이미지 파일을 백엔드에 업로드하고 URL을 반환
 */
export async function uploadImage(file: File): Promise<string | null> {
  const { accessToken } = getTokens();

  if (!accessToken) {
    console.error('No access token for upload');
    return null;
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${BASE_URL}/uploads/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      console.error('Upload failed:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();

    // Handle wrapped response
    if (data.success && data.data) {
      return data.data.url;
    }

    return data.url || null;
  } catch (error) {
    console.error('Upload error:', error);
    return null;
  }
}

/**
 * Base64 데이터 URL을 File 객체로 변환
 */
export function dataURLtoFile(dataUrl: string, filename: string): File | null {
  try {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;

    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
  } catch (error) {
    console.error('Failed to convert dataURL to file:', error);
    return null;
  }
}
