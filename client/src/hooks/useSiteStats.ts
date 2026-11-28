import { useQuery } from '@tanstack/react-query';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { getStats } from '@client/src/api/portfolio';
import type { SiteStats } from '@shared/api.interface';

export const STATS_QUERY_KEY = ['portfolio', 'stats'] as const;

export const useSiteStats = () => {
  return useQuery<SiteStats>({
    queryKey: STATS_QUERY_KEY,
    queryFn: () => getStats(),
    staleTime: 5 * 60 * 1000, // 5 分钟
    retry: 1,
    throwOnError: (error) => {
      logger.error('获取站点统计数据失败', error);
      return false;
    },
  });
};
