import axios from 'axios';
import type { Task, TaskInput } from '../types/task';

const api = axios.create({ baseURL: 'http://localhost:3001' });

export const taskApi = {
  async getAll(): Promise<Task[]> {
    const response = await api.get<Task[]>('/tasks');
    return response.data;
  },
  async create(task: TaskInput): Promise<Task> {
    const response = await api.post<Task>('/tasks', task);
    return response.data;
  },
  async update(id: string, task: TaskInput): Promise<Task> {
    const response = await api.patch<Task>(`/tasks/${id}`, task);
    return response.data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`);
  },
};
