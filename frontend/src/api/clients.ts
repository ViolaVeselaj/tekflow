import apiClient from './client';
import type { Client, CreateClientRequest, UpdateClientRequest } from '../types';

export async function getClients(): Promise<Client[]> {
  const response = await apiClient.get<Client[]>('/clients');
  return response.data;
}

export async function getClient(id: number): Promise<Client> {
  const response = await apiClient.get<Client>(`/clients/${id}`);
  return response.data;
}

export async function createClient(data: CreateClientRequest): Promise<Client> {
  const response = await apiClient.post<Client>('/clients', data);
  return response.data;
}

export async function updateClient(id: number, data: UpdateClientRequest): Promise<Client> {
  const response = await apiClient.put<Client>(`/clients/${id}`, data);
  return response.data;
}

export async function deleteClient(id: number): Promise<void> {
  await apiClient.delete(`/clients/${id}`);
}
