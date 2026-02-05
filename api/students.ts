import api from './index';
import { ENDPOINTS } from '../constants/api';
import { Student } from '@/types';

export interface StudentInput extends Partial<Student> {
  password?: string;
}

export const createStudent = async (data: StudentInput): Promise<Student> => {
  const response = await api.post<Student>(ENDPOINTS.USERS, data);
  return response.data;
};

export const getStudents = async (): Promise<Student[]> => {
  const response = await api.get<Student[]>(`${ENDPOINTS.USERS}?populate=role`);
  return response.data;
};

export const getStudent = async (id: string | number): Promise<Student> => {
  const response = await api.get<Student>(`${ENDPOINTS.USERS}/${id}?populate=role`);

  return response.data;
};

export const updateStudent = async (id: string | number, data: StudentInput): Promise<Student> => {
  const response = await api.put<Student>(`${ENDPOINTS.USERS}/${id}`, data);
  return response.data;
};
