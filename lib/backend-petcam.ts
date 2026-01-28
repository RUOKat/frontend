import { backendFetch } from './backend';

export interface PetcamImage {
  key: string;
  url: string;
  lastModified: string;
  size: number;
  fgsScore?: number;
  fgsExplanation?: string;
}

/**
 * 특정 고양이의 펫캠 이미지 목록 조회
 */
export async function fetchPetcamImages(petId: string, limit: number = 50): Promise<PetcamImage[]> {
  const response = await backendFetch<any>(
    `/pets/${petId}/petcam-images?limit=${limit}`,
    { method: 'GET' }
  );

  if (!response) {
    return [];
  }

  // Handle wrapped response
  if (response.success && response.data) {
    return response.data as PetcamImage[];
  }

  // Handle direct response (array)
  if (Array.isArray(response)) {
    return response as PetcamImage[];
  }

  return [];
}

/**
 * 펫캠 이미지 삭제
 */
export async function deletePetcamImage(petId: string, imageKey: string): Promise<boolean> {
  const response = await backendFetch<any>(
    `/pets/${petId}/petcam-images`,
    {
      method: 'DELETE',
      body: JSON.stringify({ imageKey }),
    }
  );

  if (response?.deleted || response?.success) {
    return true;
  }

  return false;
}

/**
 * 펫캠 이미지 업로드
 */
export async function uploadPetcamImage(petId: string, file: File): Promise<{ key: string; url: string } | null> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await backendFetch<any>(
    `/pets/${petId}/petcam-images`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (response?.key && response?.url) {
    return { key: response.key, url: response.url };
  }

  if (response?.success && response?.data) {
    return response.data;
  }

  return null;
}
