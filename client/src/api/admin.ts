import { apiClient as axiosForBackend } from './http';
import type {
  AdminLoginRequest,
  AdminLoginResponse,
  AdminChangePasswordRequest,
  AdminStatus,
} from '@shared/api.interface';

const API_PREFIX = '/api/admin';

// The Worker keeps the session in an HttpOnly cookie.
export const setToken = (_token: string): void => {};
export const removeToken = (): void => {};

export const getAdminStatus = (): Promise<AdminStatus> =>
  axiosForBackend.get(`${API_PREFIX}/status`).then((r) => r.data.data);

export const adminLogin = (
  body: AdminLoginRequest,
): Promise<AdminLoginResponse> =>
  axiosForBackend.post(`${API_PREFIX}/login`, body).then((r) => r.data.data);

export const adminLogout = (): Promise<{ success: boolean }> =>
  axiosForBackend.post(`${API_PREFIX}/logout`).then((r) => r.data.data);

export const adminChangePassword = (
  body: AdminChangePasswordRequest,
): Promise<{ success: boolean }> =>
  axiosForBackend
    .post(`${API_PREFIX}/change-password`, body)
    .then((r) => r.data.data);
