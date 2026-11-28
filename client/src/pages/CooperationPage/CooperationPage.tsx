import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { getHomepageCopy } from '@client/src/api/portfolio';
import ShutterSpinner from '@client/src/components/ui/shutter-spinner';
import type { HomepageCopy } from '@shared/api.interface';
import { UniversalLink } from '@client/src/components/UniversalLink';

const parseLines = (text: string): string[] =>
  text
    .split('\n')
    .map((s: string) => s.trim())
    .filter(Boolean);

const CooperationPage: React.FC = () => {
  const { data, isLoading } = useQuery<HomepageCopy>({
    queryKey: ['homepage-copy'],
    queryFn: () => getHomepageCopy(),
    staleTime: 60 * 1000,
    retry: 1,
  });

  const copy = data;

  if (!copy) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <ShutterSpinner size={40} className="animate-spin text-primary" />
      </div>
    );
  }

  const scopeItems = parseLines(copy.cooperationScope);
  const processItems = parseLines(copy.cooperationProcess);
  const hasContact =
    copy.cooperationEmail.trim() ||
    copy.cooperationWechat.trim() ||
    copy.cooperationPhone.trim();

  logger.info('[CooperationPage] loaded');

  return (
    <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
      <header className="mb-16 text-center md:mb-20">
        {copy.cooperationTitle.trim() && (
          <h1 className="text-balance font-display text-3xl leading-[1.1] tracking-tight text-foreground sm:text-4xl md:text-6xl">
            {copy.cooperationTitle}
          </h1>
        )}
      </header>

      <div className="grid gap-12 md:grid-cols-3 md:gap-8">
        {scopeItems.length > 0 && (
          <div>
            <h3 className="font-display text-2xl text-foreground md:text-3xl">合作范围</h3>
            <div className="mt-6 space-y-3">
              {scopeItems.map((item: string, i: number) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-[7px] h-px w-4 shrink-0 bg-primary" />
                  <p className="text-base text-foreground/80">{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasContact && (
          <div>
            <h3 className="font-display text-2xl text-foreground md:text-3xl">联系方式</h3>
            <div className="mt-6 space-y-4">
              {copy.cooperationEmail && (
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">邮箱</p>
                  <UniversalLink
                    to={`mailto:${copy.cooperationEmail}`}
                    className="mt-1 inline-block text-base text-foreground transition-colors hover:text-primary"
                  >
                    {copy.cooperationEmail}
                  </UniversalLink>
                </div>
              )}
              {copy.cooperationWechat && (
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">微信</p>
                  <p className="mt-1 text-base text-foreground tnum">{copy.cooperationWechat}</p>
                </div>
              )}
              {copy.cooperationPhone && (
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">电话</p>
                  <UniversalLink
                    to={`tel:${copy.cooperationPhone}`}
                    className="mt-1 inline-block text-base text-foreground transition-colors hover:text-primary"
                  >
                    {copy.cooperationPhone}
                  </UniversalLink>
                </div>
              )}
            </div>
          </div>
        )}

        {processItems.length > 0 && (
          <div>
            <h3 className="font-display text-2xl text-foreground md:text-3xl">合作流程</h3>
            <div className="mt-6 space-y-4">
              {processItems.map((item: string, i: number) => {
                const dotIdx = item.indexOf('. ');
                const step = dotIdx > 0 ? item.slice(0, dotIdx) : '';
                const content = dotIdx > 0 ? item.slice(dotIdx + 2) : item;
                return (
                  <div key={i} className="flex gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-border text-xs font-medium text-muted-foreground tnum">
                      {step || (i + 1)}
                    </span>
                    <p className="pt-0.5 text-sm text-foreground/80 md:text-base">{content}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CooperationPage;
