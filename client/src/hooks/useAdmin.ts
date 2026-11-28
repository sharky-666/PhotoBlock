import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import * as adminApi from '@client/src/api/admin';
import type {
  AdminLoginRequest,
  AdminChangePasswordRequest,
} from '@shared/api.interface';

export const useAdminStatus = () =>
  useQuery({
    queryKey: ['admin', 'status'],
    queryFn: () => adminApi.getAdminStatus(),
    staleTime: 0,
    retry: false,
  });

export const useAdminLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AdminLoginRequest) => adminApi.adminLogin(body),
    retry: false,
    onSuccess: (data) => {
      adminApi.setToken(data.token);
      queryClient.setQueryData(['admin', 'status'], {
        isLoggedIn: true,
        username: data.username,
      });
    },
  });
};

export const useAdminLogout = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () => adminApi.adminLogout(),
    retry: false,
    onSettled: () => {
      adminApi.removeToken();
      queryClient.clear();
      navigate('/admin/login', { replace: true });
    },
  });
};

export const useAdminChangePassword = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AdminChangePasswordRequest) =>
      adminApi.adminChangePassword(body),
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'status'] });
    },
  });
};
