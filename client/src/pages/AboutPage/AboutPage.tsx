import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { getHomepageCopy } from '@client/src/api/portfolio';
import { Image } from '@client/src/components/ui/image';
import ShutterSpinner from '@client/src/components/ui/shutter-spinner';
import type { HomepageCopy } from '@shared/api.interface';

const ARTIST_IMAGE_URL = '/images/artist-default.svg';

const DEFAULT_COPY: HomepageCopy = {
  heroMainTitle: '',
  heroSubtitle: '',
  heroSlogan: '',
  signatureUrl: '',
  heroHonors: '',
  imageWorksTitle: '',
  imageWorksSubtitle: '',
  imageSeriesTitle: '',
  imageSeriesSubtitle: '',
  imageCategoriesTitle: '',
  videoWorksTitle: '',
  videoWorksSubtitle: '',
  videoSeriesTitle: '',
  videoSeriesSubtitle: '',
  videoCategoriesTitle: '',
  aboutTitle: '以光影为笔，写静默的诗',
  aboutBody: '',
  aboutQuote: '',
  aboutQuoteAuthor: '',
  aboutPortraitUrl: '',
  bioTitle: '',
  bioBody: '',
  bioPhilosophy: '',
  bioManifesto: '',
  profileName: '示例作者',
  profileStageName: 'Demo Studio',
  profileBirthday: '',
  profileLocation: '示例城市',
  profileStyle: '作品展示 / 视觉叙事 / 商业摄影',
  profileExpertise: '',
  resumeExperience: '',
  resumeAwards: '',
  resumeExhibitions: '',
  statsTitle: '',
  statsArtworksLabel: '',
  statsSeriesLabel: '',
  statsCitiesLabel: '',
  statsCountriesLabel: '',
  ctaTitle: '',
  ctaSubtitle: '',
  ctaButtonText: '',
  cooperationTitle: '',
  cooperationScope: '',
  cooperationEmail: '',
  cooperationWechat: '',
  cooperationPhone: '',
  cooperationProcess: '',
  footerCopyright: '',
};

const parseLines = (text: string): string[] =>
  text.split('\n').map((s: string) => s.trim()).filter(Boolean);

const ResumeSection: React.FC<{ title: string; items: string[] }> = ({ title, items }) => {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="font-display text-2xl text-foreground md:text-3xl">{title}</h3>
      <div className="mt-6 space-y-4">
        {items.map((item: string, i: number) => {
          const dashIdx = item.indexOf(' - ');
          const year = dashIdx > 0 ? item.slice(0, dashIdx) : '';
          const content = dashIdx > 0 ? item.slice(dashIdx + 3) : item;
          return (
            <div key={i} className="flex gap-6 border-b border-border pb-4 last:border-0">
              {year && (
                <span className="w-20 shrink-0 font-mono text-sm text-muted-foreground tnum">
                  {year}
                </span>
              )}
              <p className="text-sm text-foreground md:text-base">{content}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AboutPage: React.FC = () => {
  const { data, isLoading } = useQuery<HomepageCopy>({
    queryKey: ['homepage-copy'],
    queryFn: () => getHomepageCopy(),
    staleTime: 60 * 1000,
    retry: 1,
  });

  const copy = data || DEFAULT_COPY;
  const portraitUrl = copy.aboutPortraitUrl || ARTIST_IMAGE_URL;
  const aboutParagraphs = copy.aboutBody.split('\n').filter(Boolean);

  const experience = parseLines(copy.resumeExperience);
  const awards = parseLines(copy.resumeAwards);
  const exhibitions = parseLines(copy.resumeExhibitions);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <ShutterSpinner size={40} className="animate-spin text-primary" />
      </div>
    );
  }

  logger.info('[AboutPage] loaded');

  return (
    <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
      <header className="mb-16 text-center md:mb-20">
        <h1 className="text-balance font-display text-3xl leading-[1.08] tracking-tight text-foreground sm:text-4xl md:text-6xl">
          {copy.profileStageName || copy.profileName || '个人档案'}
        </h1>
        {copy.aboutTitle.trim() && (
          <p className="mt-4 text-base text-muted-foreground md:text-lg">
            {copy.aboutTitle}
          </p>
        )}
      </header>

      <section className="grid gap-12 md:grid-cols-5 md:gap-16">
        <div className="md:col-span-2">
          <div className="relative aspect-[3/4] overflow-hidden rounded-sm">
            <Image
              src={portraitUrl}
              alt={copy.profileStageName || '摄影师'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 30vw"
            />
          </div>

          <div className="mt-8 space-y-5 border-t border-border pt-8">
            {copy.profileName && (
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  姓名
                </p>
                <p className="mt-1 text-base text-foreground">{copy.profileName}</p>
              </div>
            )}
            {copy.profileStageName && (
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  艺名
                </p>
                <p className="mt-1 text-base text-foreground">{copy.profileStageName}</p>
              </div>
            )}
            {copy.profileBirthday && (
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  出生日期
                </p>
                <p className="mt-1 text-base text-foreground">{copy.profileBirthday}</p>
              </div>
            )}
            {copy.profileLocation && (
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  所在地
                </p>
                <p className="mt-1 text-base text-foreground">{copy.profileLocation}</p>
              </div>
            )}
            {copy.profileStyle && (
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  拍摄风格
                </p>
                <p className="mt-1 text-base text-foreground">{copy.profileStyle}</p>
              </div>
            )}
            {copy.profileExpertise && (
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  擅长领域
                </p>
                <p className="mt-1 text-base text-foreground">{copy.profileExpertise}</p>
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="mb-12">
            {copy.aboutTitle.trim() && (
              <h2 className="text-balance font-display text-2xl font-light text-foreground sm:text-3xl md:text-4xl">
                {copy.aboutTitle}
              </h2>
            )}
          </div>

          {aboutParagraphs.length > 0 && (
            <div className="space-y-5 text-base leading-relaxed text-foreground/80 md:text-lg">
              {aboutParagraphs.map((para: string, i: number) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}

          {copy.aboutQuote && (
            <blockquote className="mt-10 border-l-2 border-primary pl-6">
              <p className="font-display text-xl italic text-foreground md:text-2xl">
                {copy.aboutQuote}
              </p>
              {copy.aboutQuoteAuthor && (
                <footer className="mt-3 text-sm text-muted-foreground">
                  {copy.aboutQuoteAuthor}
                </footer>
              )}
            </blockquote>
          )}

          {copy.bioBody && (
            <div className="mt-16">
              {copy.bioTitle.trim() && (
                <h3 className="font-display text-2xl text-foreground md:text-3xl">
                  {copy.bioTitle}
                </h3>
              )}
              <div className="mt-6 space-y-4 text-base leading-relaxed text-foreground/80">
                {copy.bioBody.split('\n').filter(Boolean).map((para: string, i: number) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
              {copy.bioPhilosophy && (
                <div className="mt-8">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    创作理念
                  </p>
                  <p className="mt-2 text-base text-foreground/80">{copy.bioPhilosophy}</p>
                </div>
              )}
              {copy.bioManifesto && (
                <div className="mt-6">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    艺术宣言
                  </p>
                  <p className="mt-2 text-base text-foreground/80">{copy.bioManifesto}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {(experience.length > 0 || awards.length > 0 || exhibitions.length > 0) && (
        <section className="mt-24 border-t border-border pt-20 md:mt-32 md:pt-28">
          <div className="mb-12 text-center md:mb-16">
            <h2 className="text-balance font-display text-2xl font-light text-foreground sm:text-3xl md:text-4xl">
              光影之路
            </h2>
          </div>
          <div className="grid gap-12 md:grid-cols-3 md:gap-8">
            <ResumeSection title="从业经历" items={experience} />
            <ResumeSection title="获奖荣誉" items={awards} />
            <ResumeSection title="展览与发表" items={exhibitions} />
          </div>
        </section>
      )}
    </div>
  );
};

export default AboutPage;
