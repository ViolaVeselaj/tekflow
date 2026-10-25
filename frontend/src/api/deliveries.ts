import apiClient from './client';
import type { AdminDelivery, AvailableDelivery, Delivery, PickupDeliveryRequest } from '../types';

export async function getAvailableDeliveries(): Promise<AvailableDelivery[]> {
  const response = await apiClient.get<AvailableDelivery[]>('/deliveries/available');
  return response.data;
}

export async function getAdminDeliveries(): Promise<AdminDelivery[]> {
  const response = await apiClient.get<AdminDelivery[]>('/deliveries');
  return response.data;
}

export async function pickupInvoice(invoiceId: number): Promise<Delivery> {
  const payload: PickupDeliveryRequest = { invoiceId };
  const response = await apiClient.post<Delivery>('/deliveries/pickup', payload);
  return response.data;
}

export async function getMyDeliveries(): Promise<Delivery[]> {
  const response = await apiClient.get<Delivery[]>('/deliveries');
  return response.data;
}

export async function markDelivered(deliveryId: number): Promise<Delivery> {
  const response = await apiClient.put<Delivery>(`/deliveries/${deliveryId}/deliver`);
  return response.data;
}
