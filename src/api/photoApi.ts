import api from './axios';
import type { Photo } from '../types/api';

interface GetPhotosParams {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'title';
  order?: 'asc' | 'desc';
}

interface UploadPhotoResponse {
  photo: Photo;
  message: string;
}

export const photoApi = {
  // 사진 목록 조회
  getPhotos: async (params?: GetPhotosParams): Promise<Photo[]> => {
    const response = await api.get<Photo[]>('/api/photos', { params });
    return response.data;
  },
  
  // 사진 상세 조회
  getPhoto: async (photoId: string): Promise<Photo> => {
    const response = await api.get<Photo>(`/api/photos/${photoId}`);
    return response.data;
  },
  
  // 사진 업로드
  uploadPhoto: async (formData: FormData): Promise<UploadPhotoResponse> => {
    const response = await api.post<UploadPhotoResponse>('/api/photos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  
  // 사진 수정
  updatePhoto: async (photoId: string, data: Partial<Photo>): Promise<Photo> => {
    const response = await api.patch<Photo>(`/api/photos/${photoId}`, data);
    return response.data;
  },
  
  // 사진 삭제
  deletePhoto: async (photoId: string): Promise<void> => {
    await api.delete(`/api/photos/${photoId}`);
  },
};