export type UserRole = 'Admin' | 'Finance' | 'Courier' | 'Client';
export type InvoiceStatus = 'Created' | 'PickedUp' | 'Delivered' | 'Accepted' | 'PartiallyAccepted' | 'Rejected';

export interface CurrentUser {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  clientId?: number | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: CurrentUser;
}

export interface Client {
  id: number;
  name: string;
  address: string;
  city: string;
  contactName?: string | null;
  phone?: string | null;
  createdAt: string;
}

export interface CreateClientRequest {
  name: string;
  address: string;
  city: string;
  contactName?: string;
  phone?: string;
  email: string;
  password: string;
}

export interface UpdateClientRequest {
  name: string;
  address: string;
  city: string;
  contactName?: string;
  phone?: string;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  issueDate: string;
  amount: number;
  description?: string | null;
  status: InvoiceStatus;
  clientId: number;
  clientName: string;
  createdBy: number;
  createdByName: string;
  clientComment?: string | null;
  acceptedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceRequest {
  invoiceNumber: string;
  issueDate: string;
  amount: number;
  description?: string;
  clientId: number;
}

export interface UpdateInvoiceRequest {
  invoiceNumber: string;
  issueDate: string;
  amount: number;
  description?: string;
  clientId: number;
}

export interface AvailableDelivery {
  invoiceId: number;
  invoiceNumber: string;
  clientId: number;
  clientName: string;
  clientAddress: string;
  clientCity: string;
  issueDate: string;
  amount: number;
  invoiceStatus: InvoiceStatus;
}

export interface Delivery {
  id: number;
  invoiceId: number;
  invoiceNumber: string;
  clientId: number;
  clientName: string;
  clientAddress: string;
  clientCity: string;
  courierId: number;
  courierName: string;
  pickedUpAt: string;
  deliveredAt?: string | null;
  invoiceStatus: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminDelivery {
  id: number;
  invoiceId: number;
  invoiceNumber: string;
  clientId: number;
  clientName: string;
  clientAddress: string;
  clientCity: string;
  courierId: number;
  courierName: string;
  pickedUpAt: string;
  deliveredAt?: string | null;
  invoiceStatus: InvoiceStatus;
  postalCost: number;
  createdAt: string;
  updatedAt: string;
}

export interface PickupDeliveryRequest {
  invoiceId: number;
}

export type InvoiceDecision = 'Accepted' | 'PartiallyAccepted' | 'Rejected';

export interface ClientInvoiceResponseRequest {
  decision: InvoiceDecision;
  comment?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}
