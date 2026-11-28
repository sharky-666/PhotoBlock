import { useEffect, useState, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Menu, X, ChevronDown } from 'lucide-react';
import { cn } from '@client/src/lib/utils';
import { useIsMobile } from '@client/src/hooks/use-mobile';
import brandLogo from '@client/src/assets/brand-logo-gold.svg';
import * as portfolio from '@client/src/api/portfolio';
import { UniversalLink } from '@client/src/components/UniversalLink';

const primaryNavItems = [
  { label: '图片', to: '/works/photos' },
  { label: '视频', to: '/works/videos' },
  { label: '历程', to: '/journey' },
  { label: '个人档案', to: '/about' },
  { label: '商业合作', to: '/cooperation' },
] as const;

const Nav = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const logoBtnRef = useRef<HTMLButtonElement>(null);

  const isNavActive = (to: string) =>
    !to.startsWith('/#') &&
    (location.pathname === to || location.pathname.startsWith(`${to}/`));

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  const scrollToSection = (hash: string) => {
    const el = document.getElementById(hash);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const handleNavClick = (to: string, highlight?: { mediaType: 'image' | 'video'; categoryName: string }) => {
    setMobileOpen(false);
    if (to.startsWith('/#')) {
      const hash = to.slice(2);
      const doScroll = () => {
        scrollToSection(hash);
        if (highlight) {
          window.dispatchEvent(
            new CustomEvent('highlight-category', { detail: highlight }),
          );
        }
      };
      if (window.location.pathname === '/') {
        doScroll();
      } else {
        navigate('/');
        setTimeout(doScroll, 100);
      }
      return;
    }
    navigate(to);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const handleBrandClick = () => {
    setMobileOpen(false);
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  return (
    <header
      className={cn(
        'site-header fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out',
        scrolled ? 'nav-scrolled' : 'nav-top',
      )}
    >
      <nav className="site-nav mx-auto grid max-w-[110rem] grid-cols-[1fr_auto_1fr] items-center px-4 py-1 md:px-10 lg:px-12">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            ref={logoBtnRef}
            onClick={handleBrandClick}
            className="group shrink-0 transition-transform hover:scale-[1.02] active:scale-95"
            aria-label="返回首页"
          >
            <img
              src={brandLogo}
              alt="Demo Studio"
              width={280}
              height={90}
              draggable={false}
              className="brand-logo h-7 w-auto object-contain transition-opacity duration-300 group-hover:opacity-80 md:h-8"
            />
          </button>
        </div>

        {/* Desktop Nav */}
        {!isMobile && (
          <ul className="flex items-center justify-center gap-6 lg:gap-10 xl:gap-14">
            {primaryNavItems.map((item) => (
              <li key={item.label}>
                <button
                  type="button"
                  onClick={() => handleNavClick(item.to)}
                  aria-current={isNavActive(item.to) ? 'page' : undefined}
                  className={cn(
                    'text-xs font-medium tracking-[0.16em] transition-colors hover:text-primary lg:text-sm',
                    isNavActive(item.to)
                      ? 'text-primary'
                      : 'text-foreground/75',
                  )}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Right actions */}
        {!isMobile ? (
          <div className="flex items-center justify-end gap-2">
            <UniversalLink
              to="/cooperation"
              className="inline-flex h-7 items-center justify-center rounded-full bg-primary px-3.5 text-[10px] font-semibold tracking-[0.16em] text-primary-foreground transition-all duration-300 hover:bg-primary/90"
            >
              联系合作
            </UniversalLink>
          </div>
        ) : (
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="col-start-3 justify-self-end p-1 text-foreground transition-colors hover:text-primary"
            aria-label={mobileOpen ? '关闭菜单' : '打开菜单'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        )}
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobile && mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="border-t border-white/10 bg-background/85 backdrop-blur-xl"
          >
            <ul className="flex flex-col px-6 py-3">
              {primaryNavItems.map((item) => (
                <li
                  key={item.label}
                  className="border-b border-border/45 last:border-b-0"
                >
                  <button
                    type="button"
                    onClick={() => handleNavClick(item.to)}
                    aria-current={isNavActive(item.to) ? 'page' : undefined}
                    className={cn(
                      'w-full py-3.5 text-left text-sm font-medium tracking-[0.14em] transition-colors hover:text-primary',
                      isNavActive(item.to)
                        ? 'text-primary'
                        : 'text-foreground/75',
                    )}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

type DropdownSubItem = {
  label: string;
  to: string;
  highlight?: { mediaType: 'image' | 'video'; categoryName: string };
};

type DropdownItem =
  | {
      kind: 'groupLabel';
      label: string;
    }
  | {
      kind?: 'item';
      label: string;
      to?: string;
      highlight?: { mediaType: 'image' | 'video'; categoryName: string };
      subItems?: DropdownSubItem[];
    };

const NavDropdown: React.FC<{
  label: string;
  items: DropdownItem[];
  onSelect: (to: string, highlight?: { mediaType: 'image' | 'video'; categoryName: string }) => void;
}> = ({ label, items, onSelect }) => {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLLIElement>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleEnter = () => {
    clearTimer();
    setOpen(true);
  };

  const handleLeave = () => {
    clearTimer();
    timerRef.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <li
      ref={containerRef}
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
    >
      <button
        className="flex items-center gap-1 text-xs font-medium tracking-[0.16em] text-foreground/75 transition-colors hover:text-primary lg:text-sm"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {label}
        <ChevronDown
          size={14}
          className={cn(
            'transition-transform duration-300',
            open ? 'rotate-180' : '',
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="classical-menu absolute left-1/2 top-full z-50 mt-3 w-44 -translate-x-1/2 overflow-hidden rounded-sm border border-border bg-background/95 backdrop-blur-md"
            role="menu"
          >
            {items.map((item) => (
              <NavDropdownItem key={item.label} item={item} onSelect={onSelect} />
            ))}
            <div className="absolute left-1/2 top-0 h-px w-12 -translate-x-1/2 -translate-y-px bg-primary" />
          </motion.ul>
        )}
      </AnimatePresence>
    </li>
  );
};

const NavDropdownItem: React.FC<{
  item: DropdownItem;
  onSelect: (to: string, highlight?: { mediaType: 'image' | 'video'; categoryName: string }) => void;
}> = ({ item, onSelect }) => {
  const [subOpen, setSubOpen] = useState(false);
  const subTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasSub = !('kind' in item) && !!item.subItems && item.subItems.length > 0;

  const clearSubTimer = () => {
    if (subTimerRef.current) {
      clearTimeout(subTimerRef.current);
      subTimerRef.current = null;
    }
  };

  const handleSubEnter = () => {
    clearSubTimer();
    setSubOpen(true);
  };

  const handleSubLeave = () => {
    clearSubTimer();
    subTimerRef.current = setTimeout(() => setSubOpen(false), 100);
  };

  if ('kind' in item && item.kind === 'groupLabel') {
    return (
      <li
        className="cursor-default px-5 pb-1 pt-3 text-[11px] font-medium tracking-widest text-muted-foreground/70"
        role="presentation"
      >
        {item.label}
      </li>
    );
  }

  if (hasSub) {
    return (
      <li
        className="relative"
        onMouseEnter={handleSubEnter}
        onMouseLeave={handleSubLeave}
      >
        <button
          className="flex w-full items-center justify-between px-5 py-3 text-left text-sm font-medium tracking-wider text-foreground/80 transition-colors hover:bg-muted/60 hover:text-primary"
          role="menuitem"
          aria-haspopup="true"
          aria-expanded={subOpen}
        >
          {item.label}
          <ChevronDown
            size={12}
            className={cn(
              'shrink-0 -rotate-90 transition-transform duration-200',
              subOpen ? 'rotate-0' : '',
            )}
          />
        </button>
        <AnimatePresence>
          {subOpen && !('kind' in item) && item.subItems && (
            <motion.ul
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute left-full top-0 z-50 ml-1 w-40 overflow-hidden rounded-sm border border-border bg-background/95 shadow-lg backdrop-blur-md"
              role="menu"
            >
                  {!('kind' in item) && item.subItems?.map((sub) => (
                <li key={sub.label}>
                  <button
                    onClick={() => onSelect(sub.to, sub.highlight)}
                    className="block w-full px-4 py-2.5 text-left text-sm font-medium tracking-wider text-foreground/80 transition-colors hover:bg-muted/60 hover:text-primary"
                    role="menuitem"
                  >
                    {sub.label}
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </li>
    );
  }

  return (
    <li>
      <button
        onClick={() => item.to && onSelect(item.to, item.highlight)}
        className="block w-full px-5 py-3 text-left text-sm font-medium tracking-wider text-foreground/80 transition-colors hover:bg-muted/60 hover:text-primary"
        role="menuitem"
      >
        {item.label}
      </button>
    </li>
  );
};

const MobileDropdownGroup: React.FC<{
  label: string;
  items: DropdownItem[];
  onClick: (to: string, highlight?: { mediaType: 'image' | 'video'; categoryName: string }) => void;
}> = ({ label, items, onClick }) => {
  const [open, setOpen] = useState(false);

  return (
    <li>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-4 text-left text-sm font-medium tracking-widest text-foreground/80 transition-colors hover:text-primary"
        aria-expanded={open}
      >
        {label}
        <ChevronDown
          size={16}
          className={cn(
            'transition-transform duration-300',
            open ? 'rotate-180' : '',
          )}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden pl-4"
          >
            <ul className="border-l border-border/60">
              {items.map((item) => (
                <MobileSubItem key={item.label} item={item} onClick={onClick} />
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
};

const MobileSubItem: React.FC<{
  item: DropdownItem;
  onClick: (to: string, highlight?: { mediaType: 'image' | 'video'; categoryName: string }) => void;
}> = ({ item, onClick }) => {
  const [open, setOpen] = useState(false);
  const hasSub = !('kind' in item) && !!item.subItems && item.subItems.length > 0;

  if ('kind' in item && item.kind === 'groupLabel') {
    return (
      <li
        className="cursor-default py-2 text-[11px] font-medium tracking-widest text-muted-foreground/70"
        role="presentation"
      >
        {item.label}
      </li>
    );
  }

  if (hasSub) {
    return (
      <li>
        <button
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between py-3 text-left text-sm tracking-wider text-foreground/70 transition-colors hover:text-primary"
          aria-expanded={open}
        >
          {item.label}
          <ChevronDown
            size={14}
            className={cn(
              'transition-transform duration-200',
              open ? 'rotate-180' : '',
            )}
          />
        </button>
        <AnimatePresence>
          {open && !('kind' in item) && item.subItems && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden pl-4"
            >
              <ul className="border-l border-border/40">
                {!('kind' in item) && item.subItems?.map((sub) => (
                  <li key={sub.label}>
                    <button
                      onClick={() => onClick(sub.to, sub.highlight)}
                      className="block w-full py-2.5 text-left text-sm tracking-wider text-foreground/60 transition-colors hover:text-primary"
                    >
                      {sub.label}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </li>
    );
  }

  return (
    <li>
      <button
        onClick={() => item.to && onClick(item.to, item.highlight)}
        className="block w-full py-3 text-left text-sm tracking-wider text-foreground/70 transition-colors hover:text-primary"
      >
        {item.label}
      </button>
    </li>
  );
};

type SocialQrKey = 'xiaohongshu' | 'douyin' | 'channels';

const XiaohongshuQrIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <path d="M7.5 7.5h9v9h-9z" />
    <path d="M13 9.5h3.5V13H13z" />
    <circle cx="16.5" cy="7.5" r="0.7" fill="currentColor" stroke="none" />
  </svg>
);

const DouyinQrIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M10 17.5a4 4 0 1 1-3-3.87" />
    <path d="M10 17.5V5.5c1.15 2.3 3.15 3.55 6 3.8" />
    <path d="M16 4v5.3" />
  </svg>
);

const ChannelsQrIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M8.2 7.5c2.2 0 3.8 4.5 6 4.5s2.8-2.2 2.1-3.5c-.8-1.5-2.7-1.4-4.1.2L8.2 13c-1.4 1.6-3.4 1.7-4.2.2-.7-1.3.2-3.2 2.1-3.2 2.2 0 3.8 4.5 6 4.5 1.9 0 2.7-1.5 2.1-2.7" />
  </svg>
);

const Footer = () => {
  const [activeQr, setActiveQr] = useState<SocialQrKey | null>(null);
  const { data: settings } = useQuery({
    queryKey: ['site-settings'],
    queryFn: portfolio.getSiteSettings,
    staleTime: 60_000,
  });
  const { data: homepageCopy } = useQuery({
    queryKey: ['homepage-copy'],
    queryFn: portfolio.getHomepageCopy,
    staleTime: 60_000,
  });

  const cooperationEmail =
    homepageCopy?.cooperationEmail?.trim() ||
    settings?.email?.trim() ||
    '';
  const cooperationPhone = homepageCopy?.cooperationPhone?.trim() || '';
  const currentYear = new Date().getFullYear();
  const socialQrItems: Array<{
    key: SocialQrKey;
    label: string;
    image: string;
    icon: React.FC<{ size?: number }>;
  }> = [
    {
      key: 'douyin',
      label: '抖音',
      image: '/images/social/douyin-qr.png',
      icon: DouyinQrIcon,
    },
    {
      key: 'xiaohongshu',
      label: '小红书',
      image: '/images/social/xiaohongshu-qr.png',
      icon: XiaohongshuQrIcon,
    },
    {
      key: 'channels',
      label: '视频号',
      image: '/images/social/channels-qr.png',
      icon: ChannelsQrIcon,
    },
  ];

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="grid gap-6 py-7 text-xs leading-7 text-muted-foreground md:grid-cols-[1fr_auto] md:items-end">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-8">
            <div className="space-y-1">
              {cooperationEmail && (
                <p>
                  商业合作：邮箱
                  <UniversalLink
                    to={`mailto:${cooperationEmail}`}
                    className="ml-2 text-foreground/75 transition-colors hover:text-primary"
                  >
                    {cooperationEmail}
                  </UniversalLink>
                </p>
              )}
              {cooperationPhone && (
                <p>
                  联系电话：
                  <UniversalLink
                    to={`tel:${cooperationPhone}`}
                    className="ml-2 text-foreground/75 transition-colors hover:text-primary"
                  >
                    {cooperationPhone}
                  </UniversalLink>
                </p>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              {socialQrItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeQr === item.key;
                return (
                  <div
                    key={item.key}
                    className="relative"
                    onMouseEnter={() => setActiveQr(item.key)}
                    onMouseLeave={() => setActiveQr(null)}
                  >
                    {isActive && (
                      <div className="qr-popover absolute bottom-full left-1/2 z-50 mb-3 w-44 -translate-x-1/2 border border-border bg-white p-2 shadow-2xl md:w-52">
                        <img
                          src={item.image}
                          alt={`${item.label}二维码`}
                          className="block aspect-square h-auto w-full object-contain"
                        />
                        <span className="absolute left-1/2 top-full h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-border bg-white" />
                      </div>
                    )}
                    <button
                      type="button"
                      aria-label={`查看${item.label}二维码`}
                      aria-expanded={isActive}
                      onClick={() =>
                        setActiveQr((current) =>
                          current === item.key ? null : item.key,
                        )
                      }
                      onFocus={() => setActiveQr(item.key)}
                      className={cn(
                        'flex h-10 w-10 items-center justify-center border transition-all duration-300',
                        isActive
                          ? 'border-primary/70 bg-primary/10 text-primary'
                          : 'border-border bg-card text-foreground/65 hover:border-primary/60 hover:text-primary',
                      )}
                    >
                      <Icon size={19} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="md:text-right">
            {homepageCopy?.footerCopyright?.trim() && (
              <p>{homepageCopy.footerCopyright}</p>
            )}
            <p className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground/55">
              © {currentYear} Demo Studio
            </p>
            <p className="mt-1 font-mono text-[10px] tracking-[0.08em] text-muted-foreground/55">
              DEMO BUILD
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

const Layout = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {!isAdminRoute && <Nav />}
      <main className={cn('flex-1', !isAdminRoute && 'pt-20')}>
        <Outlet />
      </main>
      {!isAdminRoute && <Footer />}
    </div>
  );
};

export default Layout;
