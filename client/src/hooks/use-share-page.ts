import { useCallback } from 'react';
import { toast } from 'sonner';

export function useSharePage() {
  return useCallback(async (title: string) => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success('页面链接已复制');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      toast.error('分享失败，请手动复制地址');
    }
  }, []);
}
