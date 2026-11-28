import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Lock, Loader2, ShieldCheck } from 'lucide-react';

import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Label } from '@client/src/components/ui/label';
import { useAdminLogin, useAdminStatus } from '@client/src/hooks/useAdmin';

const getErrMsg = (err: unknown): string => {
  if (err instanceof Error && err.message) return err.message;
  if (
    err &&
    typeof err === 'object' &&
    'response' in err &&
    err.response &&
    typeof err.response === 'object'
  ) {
    const data = (err.response as Record<string, unknown>).data as Record<
      string,
      unknown
    >;
    if (data.error && typeof data.error === 'object') {
      const e = data.error as Record<string, unknown>;
      if (typeof e.message === 'string') return e.message;
    }
  }
  return '登录失败，请稍后重试';
};

const AdminLoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const loginMutation = useAdminLogin();
  const { data: status } = useAdminStatus();

  const from = (location.state as { from?: string })?.from || '/admin';

  useEffect(() => {
    if (status?.isLoggedIn) {
      navigate(from, { replace: true });
    }
  }, [status, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error('请输入用户名和密码');
      return;
    }
    try {
      await loginMutation.mutateAsync({
        username: username.trim(),
        password,
      });
      toast.success('登录成功');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(getErrMsg(err));
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md border border-border rounded-[--radius-sm] bg-card/60 p-8 sm:p-10 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full border border-border flex items-center justify-center mb-5">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <h2 className="font-display text-2xl tracking-wide text-foreground">
            管理后台登录
          </h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            请输入管理员账号和密码
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">用户名</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              autoFocus
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="pl-9"
                autoComplete="current-password"
              />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            登录
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;
