import apiClient from './client';
import type { ClientInvoiceResponseRequest, CreateInvoiceRequest, Invoice, UpdateInvoiceRequest } from '../types';

async function triggerDownload(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export async function getInvoices(): Promise<Invoice[]> {
  const response = await apiClient.get<Invoice[]>('/invoices');
  return response.data;
}

export async function getInvoice(id: number): Promise<Invoice> {
  const response = await apiClient.get<Invoice>(`/invoices/${id}`);
  return response.data;
}

export async function getMyInvoices(): Promise<Invoice[]> {
  const response = await apiClient.get<Invoice[]>('/invoices/my');
  return response.data;
}

export async function createInvoice(data: CreateInvoiceRequest): Promise<Invoice> {
  const response = await apiClient.post<Invoice>('/invoices', data);
  return response.data;
}

export async function updateInvoice(id: number, data: UpdateInvoiceRequest): Promise<Invoice> {
  const response = await apiClient.put<Invoice>(`/invoices/${id}`, data);
  return response.data;
}

export async function respondToInvoice(id: number, data: ClientInvoiceResponseRequest): Promise<Invoice> {
  const response = await apiClient.post<Invoice>(`/invoices/${id}/response`, data);
  return response.data;
}

export async function deleteInvoice(id: number): Promise<void> {
  await apiClient.delete(`/invoices/${id}`);
}

export async function downloadInvoicePdf(id: number, invoiceNumber?: string): Promise<void> {
  const fileName = invoiceNumber ? `Invoice-${invoiceNumber}.pdf` : `Invoice-${id}.pdf`;
  const response = await apiClient.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
  const blob = response.data as Blob;
  await triggerDownload(blob, fileName);
}

export async function downloadInvoiceExcel(id: number, invoiceNumber?: string): Promise<void> {
  const fileName = invoiceNumber ? `Invoice-${invoiceNumber}.xlsx` : `Invoice-${id}.xlsx`;
  const response = await apiClient.get(`/invoices/${id}/excel`, { responseType: 'blob' });
  const blob = response.data as Blob;
  await triggerDownload(blob, fileName);
}
