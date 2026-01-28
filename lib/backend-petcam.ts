import { backendFetch } from './backend';

export interface PetcamImage {
  key: string;
  url: string;
  lastModified: string;
  size: number;
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
