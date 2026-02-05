import api from '.';
import { LoginResponse } from '@/types';
import { ENDPOINTS } from '@/constants/api';

export const loginUser = async (username: string, password: string): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>(ENDPOINTS.AUTH_LOCAL, {
    identifier: username,
    password,
  });

  return response.data;
};