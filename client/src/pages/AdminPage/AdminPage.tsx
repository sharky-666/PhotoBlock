import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  Upload,
  Pencil,
  Trash2,
  Plus,
  Image as ImageIcon,
  Images,
  Film,
  X,
  Star,
  GripVertical,
  Settings,
  ChevronDown,
  ChevronUp,
  User as UserIcon,
  Handshake,
  History,
  Play,
  LogOut,
  Files,
  CheckCircle2,
  Search,
} from 'lucide-react';

import type { MediaMetadata } from '@client/src/utils/media-metadata';
import ShutterSpinner from '@client/src/components/ui/shutter-spinner';
import {
  readImageMetadata,
  readVideoMetadata,
  formatDuration,
  isRawFile,
  extractRawPreview,
} from '@client/src/utils/media-metadata';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Textarea } from '@client/src/components/ui/textarea';

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'];
const VIDEO_EXTENSIONS = ['mp4', 'mov', 'webm'];

const IMAGE_ACCEPT = '.jpg,.jpeg,.png,.webp,.avif,.gif';
const VIDEO_ACCEPT = '.mp4,.mov,.webm';

const ARTWORK_IMAGE_EXTENSIONS = IMAGE_EXTENSIONS;
const ARTWORK_VIDEO_EXTENSIONS = VIDEO_EXTENSIONS;

function validateArtworkVideoFile(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ARTWORK_VIDEO_EXTENSIONS.includes(ext)) {
    return '仅支持 MP4、MOV 或 WebM 格式';
  }
  return null;
}

function validateArtworkImageFile(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ARTWORK_IMAGE_EXTENSIONS.includes(ext)) {
    return '仅支持 JPG、PNG、WebP、AVIF 或 GIF 格式';
  }
  return null;
}

function validateFile(file: File, type: 'image' | 'video'): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (type === 'image') {
    if (!IMAGE_EXTENSIONS.includes(ext)) {
      return '请上传图片格式文件';
    }
  } else {
    if (!VIDEO_EXTENSIONS.includes(ext)) {
      return '请上传视频格式文件';
    }
  }
  return null;
}
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import { Checkbox } from '@client/src/components/ui/checkbox';
import { Label } from '@client/src/components/ui/label';
import { Switch } from '@client/src/components/ui/switch';
import { Skeleton } from '@client/src/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@client/src/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@client/src/components/ui/alert-dialog';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@client/src/components/ui/tabs';
import Image from '@client/src/components/ui/image';
import ShutterLogo from '@client/src/components/ShutterLogo';
import { cn } from '@client/src/lib/utils';
import * as portfolio from '@client/src/api/portfolio';
import {
  useAdminChangePassword,
  useAdminLogout,
} from '@client/src/hooks/useAdmin';
import { DEFAULT_HOMEPAGE_COPY } from '@shared/homepage-defaults';
import type {
  Artwork,
  Series,
  Category,
  CreateArtworkRequest,
  UpdateArtworkRequest,
  CreateSeriesRequest,
  UpdateSeriesRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  SiteSettings,
  HomepageCopy,
  HeroSlide,
  CreateHeroSlideRequest,
  UpdateHeroSlideRequest,
} from '@shared/api.interface';

/* ---------- Helpers ---------- */

const getErrMsg = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  if (
    err &&
    typeof err === 'object' &&
    'response' in err &&
    err.response &&
    typeof err.response === 'object' &&
    'data' in err.response &&
    err.response &&
    err.response.data &&
    typeof (err.response as Record<string, unknown>).data === 'object'
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
  return '操作失败';
};

function useUploadFile() {
  const uploadFile = useCallback(
    async (file: File): Promise<string> => {
      const result = await portfolio.uploadMedia(file);
      return result.url;
    },
    [],
  );

  return { uploadFile };
}

/* ---------- Site Settings Panel ---------- */

const SiteSettingsPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: portfolio.getSiteSettings,
  });

  const [form, setForm] = useState<SiteSettings>({
    email: '',
    xiaohongshuUrl: '',
    douyinUrl: '',
    weiboUrl: '',
    instagramUrl: '',
    ctripUrl: '',
    citiesVisited: 0,
    countriesVisited: 0,
  });

  useEffect(() => {
    if (settings) {
      setForm(settings);
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: portfolio.updateSiteSettings,
    retry: false,
    onSuccess: (data) => {
      queryClient.setQueryData(['site-settings'], data);
      toast.success('站点设置已保存');
    },
    onError: (err: Error) => {
      toast.error(err.message || '保存失败');
    },
  });

  const handleSave = () => {
    mutation.mutate(form);
  };

  const fields: Array<{
    key: keyof SiteSettings;
    label: string;
    placeholder: string;
    type?: string;
  }> = [
    { key: 'email', label: '邮箱地址', placeholder: 'hello@example.com', type: 'email' },
    { key: 'xiaohongshuUrl', label: '小红书主页链接', placeholder: 'https://xiaohongshu.com/...' },
    { key: 'douyinUrl', label: '抖音主页链接', placeholder: 'https://douyin.com/...' },
    { key: 'weiboUrl', label: '微博主页链接', placeholder: 'https://weibo.com/...' },
    { key: 'instagramUrl', label: 'Instagram 主页链接', placeholder: 'https://instagram.com/...' },
    { key: 'ctripUrl', label: '携程主页链接', placeholder: 'https://ctrip.com/...' },
    { key: 'citiesVisited', label: '走过的城市数量', placeholder: '0', type: 'number' },
    { key: 'countriesVisited', label: '去过的国家数量', placeholder: '0', type: 'number' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-xl">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="font-display text-2xl">联系方式</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          管理页脚展示的社交平台链接和邮箱，留空的平台将不会显示
        </p>
      </div>

      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={`setting-${field.key}`}>{field.label}</Label>
            <Input
              id={`setting-${field.key}`}
              type={field.type || 'url'}
              value={form[field.key]}
              placeholder={field.placeholder}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, [field.key]: e.target.value }))
              }
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button onClick={handleSave} disabled={mutation.isPending}>
          {mutation.isPending && <ShutterSpinner size={16} className="mr-2 animate-spin" />}
          保存设置
        </Button>
        {mutation.isSuccess && (
          <span className="text-sm text-primary">已保存</span>
        )}
      </div>
    </div>
  );
};

/* ---------- Aliyun OSS Storage Panel ---------- */

const StorageSettingsPanel: React.FC = () => (
  <div className="max-w-xl space-y-4">
    <div>
      <h2 className="font-display text-2xl">图片存储</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        作品图片由阿里云 OSS 安全存储，上传后会自动生成访问地址。
      </p>
    </div>
    <div className="border border-border bg-card/40 p-5">
      <div className="flex items-center gap-3">
        <Images className="h-5 w-5 text-primary" />
        <div>
          <p className="text-sm font-medium">阿里云 OSS</p>
          <p className="mt-1 text-xs text-muted-foreground">
            单张图片最大 20 MB，支持 JPG、PNG、WebP、AVIF 和 GIF。
          </p>
        </div>
      </div>
    </div>
  </div>
);

const PasswordSettingsPanel: React.FC = () => {
  const mutation = useAdminChangePassword();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = () => {
    if (newPassword.length < 12) {
      toast.error('新密码至少需要 12 个字符');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('两次输入的新密码不一致');
      return;
    }
    mutation.mutate(
      { oldPassword, newPassword },
      {
        onSuccess: () => {
          toast.success('密码已更新');
          setOldPassword('');
          setNewPassword('');
          setConfirmPassword('');
        },
        onError: (error) => {
          toast.error(error.message || '密码更新失败');
        },
      },
    );
  };

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <h2 className="font-display text-2xl">管理员密码</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          使用 Cloudflare Access 登录时可忽略此项。
        </p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="admin-old-password">原密码</Label>
          <Input
            id="admin-old-password"
            type="password"
            value={oldPassword}
            onChange={(event) => setOldPassword(event.target.value)}
            autoComplete="current-password"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="admin-new-password">新密码</Label>
          <Input
            id="admin-new-password"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="admin-confirm-password">确认新密码</Label>
          <Input
            id="admin-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(event.target.value)
            }
            autoComplete="new-password"
          />
        </div>
      </div>
      <Button
        variant="outline"
        onClick={handleSubmit}
        disabled={
          mutation.isPending ||
          !oldPassword ||
          !newPassword ||
          !confirmPassword
        }
      >
        {mutation.isPending && (
          <ShutterSpinner
            size={16}
            className="mr-2 animate-spin"
          />
        )}
        更新密码
      </Button>
    </div>
  );
};

/* ---------- Homepage Copy Panel ---------- */

type CopyField = {
  key: Extract<keyof HomepageCopy, string>;
  label: string;
  hint?: string;
  multiline?: boolean;
  rows?: number;
  type?: 'text' | 'image';
  fullWidth?: boolean;
};

type CopySection = {
  title: string;
  description: string;
  fields: CopyField[];
};

type TimelineCategory = '经历' | '荣誉' | '展览';

type TimelineEntry = {
  id: string;
  year: string;
  category: TimelineCategory;
  content: string;
};

const TIMELINE_FIELDS: Array<{
  key: 'resumeExperience' | 'resumeAwards' | 'resumeExhibitions';
  category: TimelineCategory;
}> = [
  { key: 'resumeExperience', category: '经历' },
  { key: 'resumeAwards', category: '荣誉' },
  { key: 'resumeExhibitions', category: '展览' },
];

const createTimelineEntryId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `timeline-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const parseTimelineEntries = (copy: HomepageCopy): TimelineEntry[] => {
  const entries = TIMELINE_FIELDS.flatMap(({ key, category }) =>
    String(copy[key] || '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const match = line.match(/^(\d{4})\s*(?:[-—–]\s*)?(.+)$/);
        return {
          id: createTimelineEntryId(),
          year: match?.[1] || '',
          category,
          content: match?.[2]?.trim() || line,
        };
      }),
  );

  return entries.sort((a, b) => {
    const yearA = Number(a.year) || Number.MAX_SAFE_INTEGER;
    const yearB = Number(b.year) || Number.MAX_SAFE_INTEGER;
    return yearA - yearB;
  });
};

const serializeTimelineEntries = (
  entries: TimelineEntry[],
): Pick<
  HomepageCopy,
  'resumeExperience' | 'resumeAwards' | 'resumeExhibitions'
> => {
  const result: Record<TimelineCategory, string[]> = {
    经历: [],
    荣誉: [],
    展览: [],
  };

  [...entries]
    .sort((a, b) => Number(a.year) - Number(b.year))
    .forEach((entry) => {
      result[entry.category].push(
        `${entry.year.trim()} - ${entry.content.trim()}`,
      );
    });

  return {
    resumeExperience: result['经历'].join('\n'),
    resumeAwards: result['荣誉'].join('\n'),
    resumeExhibitions: result['展览'].join('\n'),
  };
};

const PROFILE_COPY_SECTIONS: CopySection[] = [
  {
    title: '个人形象照',
    description: '关于页展示的摄影师肖像照片',
    fields: [
      {
        key: 'aboutPortraitUrl',
        label: '个人形象照',
        type: 'image',
        fullWidth: true,
        hint: '建议 3:4 竖构图，大小不超过 5MB。这是摄影师本人肖像，不是摄影作品。',
      },
    ],
  },
  {
    title: '基本信息',
    description: '摄影师的基本资料，展示在个人档案页侧边',
    fields: [
      { key: 'profileName', label: '姓名' },
      { key: 'profileStageName', label: '艺名 / 署名' },
      { key: 'profileBirthday', label: '出生日期' },
      { key: 'profileLocation', label: '所在地' },
      { key: 'profileStyle', label: '拍摄风格', multiline: true, rows: 2 },
      { key: 'profileExpertise', label: '擅长领域', multiline: true, rows: 2 },
    ],
  },
  {
    title: '个人简介',
    description: '关于页的介绍正文、引言和创作理念',
    fields: [
      { key: 'aboutTitle', label: '区块标题' },
      { key: 'aboutBody', label: '正文介绍', multiline: true, rows: 6, fullWidth: true },
      { key: 'aboutQuote', label: '引用语' },
      { key: 'aboutQuoteAuthor', label: '引用语署名' },
      { key: 'bioTitle', label: '第二段落 · 标题' },
      { key: 'bioBody', label: '第二段落 · 正文', multiline: true, rows: 8, fullWidth: true },
      { key: 'bioPhilosophy', label: '创作理念', multiline: true, rows: 3 },
      { key: 'bioManifesto', label: '艺术宣言', multiline: true, rows: 2 },
    ],
  },
];

const HOMEPAGE_COPY_SECTIONS: CopySection[] = [
  {
    title: '视频首屏',
    description: '首页视频主视觉的标语',
    fields: [
      {
        key: 'heroSlogan',
        label: '首屏标语',
        multiline: true,
        rows: 2,
        fullWidth: true,
        hint: '可留空，留空后首页视频区不显示主标语。',
      },
    ],
  },
  {
    title: '图片展示',
    description: '首页图片轮播、图片系列和更多图片系列',
    fields: [
      { key: 'imageWorksTitle', label: '精选影像 · 主标题' },
      { key: 'imageSeriesTitle', label: '图片系列 · 主标题' },
      { key: 'imageSeriesSubtitle', label: '图片系列 · 副标题', multiline: true, rows: 2 },
      { key: 'imageCategoriesTitle', label: '更多图片系列 · 主标题' },
    ],
  },
  {
    title: '视频内容',
    description: '首页动态影像、视频系列和更多视频系列',
    fields: [
      { key: 'videoWorksTitle', label: '动态影像 · 主标题' },
      { key: 'videoWorksSubtitle', label: '动态影像 · 副标题', multiline: true, rows: 2 },
      { key: 'videoSeriesTitle', label: '视频系列 · 主标题' },
      { key: 'videoSeriesSubtitle', label: '视频系列 · 副标题', multiline: true, rows: 2 },
      { key: 'videoCategoriesTitle', label: '更多视频系列 · 主标题' },
    ],
  },
  {
    title: '数字旅程与底部',
    description: '统计数字、底部合作邀请和页脚版权',
    fields: [
      {
        key: 'statsTitle',
        label: '光影足迹 · 副标题',
        hint: '显示在“光影足迹”标题下方。',
      },
      { key: 'statsArtworksLabel', label: '作品数标签（如：幅作品）' },
      { key: 'statsCitiesLabel', label: '城市数标签（如：座城市）' },
      { key: 'statsCountriesLabel', label: '国家数标签（如：个国家）' },
      { key: 'ctaTitle', label: 'CTA 主标题' },
      { key: 'ctaSubtitle', label: 'CTA 副标题', multiline: true, rows: 2 },
      { key: 'ctaButtonText', label: 'CTA 按钮文字' },
      { key: 'footerCopyright', label: '页脚版权文字' },
    ],
  },
];

const COOPERATION_COPY_SECTIONS: CopySection[] = [
  {
    title: '页面标题',
    description: '商业合作页顶部标题区',
    fields: [
      { key: 'cooperationTitle', label: '主标题' },
    ],
  },
  {
    title: '合作范围',
    description: '列出可承接的合作类型',
    fields: [
      { key: 'cooperationScope', label: '合作范围列表', multiline: true, rows: 6, fullWidth: true, hint: '每行一项，例如「品牌商业拍摄」' },
    ],
  },
  {
    title: '联系方式',
    description: '访客联系你的渠道',
    fields: [
      { key: 'cooperationEmail', label: '联系邮箱' },
      { key: 'cooperationWechat', label: '微信号' },
      { key: 'cooperationPhone', label: '联系电话' },
    ],
  },
  {
    title: '合作流程',
    description: '从接洽到交付的步骤',
    fields: [
      { key: 'cooperationProcess', label: '流程步骤', multiline: true, rows: 8, fullWidth: true, hint: '每行一步，格式如「1. 需求沟通 - 明确拍摄方向与交付要求」' },
    ],
  },
];

interface PortraitUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
}

const PortraitUploadField: React.FC<PortraitUploadFieldProps> = ({ value, onChange }) => {
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadFile } = useUploadFile();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('请上传图片文件');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过 5MB');
      return;
    }
    try {
      setUploading(true);
      const url = await uploadFile(file);
      onChange(url);
      toast.success('上传成功');
    } catch (err: unknown) {
      logger.error('[PortraitUpload] upload failed:', err);
      toast.error('上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div
      className={cn(
        'space-y-3 rounded-sm transition-shadow',
        isDragging && 'ring-1 ring-primary',
      )}
      onDragOver={(event) => {
        event.preventDefault();
        if (!uploading) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        const file = event.dataTransfer.files?.[0];
        if (file && !uploading) void handleFile(file);
      }}
    >
      {value ? (
        <div className="relative inline-block overflow-hidden rounded-sm border border-border">
          <Image
            src={value}
            alt="个人形象照预览"
            className="h-64 w-auto object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
            aria-label="删除图片，恢复默认"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
      ) : (
        <div
          className="flex h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-primary hover:bg-primary/5"
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={24} strokeWidth={1.5} />
          <span className="text-sm">点击或拖拽上传个人形象照</span>
          <span className="text-xs text-muted-foreground/70">建议 4:5 竖构图，不超过 5MB</span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="hidden"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {uploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShutterSpinner size={14} className="animate-spin" />
          上传中…
        </div>
      )}
    </div>
  );
};

const HomepageCopyPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: copy, isLoading } = useQuery({
    queryKey: ['homepage-copy'],
    queryFn: portfolio.getHomepageCopy,
  });

  const [form, setForm] = useState<HomepageCopy>(DEFAULT_HOMEPAGE_COPY);

  useEffect(() => {
    if (copy) {
      setForm(copy);
    }
  }, [copy]);

  const mutation = useMutation({
    mutationFn: portfolio.updateHomepageCopy,
    retry: false,
    onSuccess: (data) => {
      queryClient.setQueryData(['homepage-copy'], data);
      queryClient.invalidateQueries({ queryKey: ['homepage-copy'] });
      toast.success('首页文案已保存');
    },
    onError: (err: Error) => {
      toast.error(err.message || '保存失败');
    },
  });

  const handleSave = () => {
    mutation.mutate(form);
  };

  const handleReset = () => {
    setForm(DEFAULT_HOMEPAGE_COPY);
    toast.info('已恢复默认文案，点击保存才会生效');
  };

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-3xl">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((__, j) => (
                <div key={j} className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="admin-content-panel mx-auto max-w-5xl space-y-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl">首页文案</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            按首页实际板块管理文案；留空字段会在前台自动隐藏
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset}>
          恢复默认
        </Button>
      </div>

      {HOMEPAGE_COPY_SECTIONS.map((section) => (
        <div key={section.title} className="admin-form-section space-y-5">
          <div className="border-b border-border pb-3">
            <h3 className="font-display text-xl font-medium">{section.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {section.description}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {section.fields.map((field) => (
              <div
                key={field.key}
                className={cn(
                  'space-y-2',
                  (field.multiline || field.fullWidth) && 'md:col-span-2',
                )}
              >
                <Label htmlFor={`copy-${field.key}`}>{field.label}</Label>
                {field.type === 'image' ? (
                  <PortraitUploadField
                    value={form[field.key] as string}
                    onChange={(url) =>
                      setForm((prev) => ({
                        ...prev,
                        [field.key]: url,
                      }))
                    }
                  />
                ) : field.multiline ? (
                  <Textarea
                    id={`copy-${field.key}`}
                    value={form[field.key]}
                    rows={field.rows || 3}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                    className="resize-y"
                  />
                ) : (
                  <Input
                    id={`copy-${field.key}`}
                    value={form[field.key]}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                  />
                )}
                {field.hint && (
                  <p className="text-xs text-muted-foreground">{field.hint}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3 pt-4">
        <Button onClick={handleSave} disabled={mutation.isPending}>
          {mutation.isPending && (
            <ShutterSpinner size={16} className="mr-2 animate-spin" />
          )}
          保存文案
        </Button>
        {mutation.isSuccess && (
          <span className="text-sm text-primary">已保存</span>
        )}
      </div>
    </div>
  );
};

const ProfileCopyPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: copy, isLoading } = useQuery({
    queryKey: ['homepage-copy'],
    queryFn: portfolio.getHomepageCopy,
  });

  const [form, setForm] = useState<HomepageCopy>(DEFAULT_HOMEPAGE_COPY);

  useEffect(() => {
    if (copy) {
      setForm(copy);
    }
  }, [copy]);

  const mutation = useMutation({
    mutationFn: portfolio.updateHomepageCopy,
    retry: false,
    onSuccess: (data) => {
      queryClient.setQueryData(['homepage-copy'], data);
      queryClient.invalidateQueries({ queryKey: ['homepage-copy'] });
      toast.success('个人档案已保存');
    },
    onError: (err: Error) => {
      toast.error(err.message || '保存失败');
    },
  });

  const handleSave = () => {
    mutation.mutate(form);
  };

  const handleReset = () => {
    setForm(DEFAULT_HOMEPAGE_COPY);
    toast.info('已恢复默认内容，点击保存才会生效');
  };

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-3xl">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((__, j) => (
                <div key={j} className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="admin-content-panel mx-auto max-w-5xl space-y-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl">个人档案</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            管理个人形象、基本信息和简介；履历统一在“时间历程”中维护
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset}>
          恢复默认
        </Button>
      </div>

      {PROFILE_COPY_SECTIONS.map((section) => (
        <div key={section.title} className="admin-form-section space-y-5">
          <div className="border-b border-border pb-3">
            <h3 className="font-display text-xl font-medium">{section.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {section.description}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {section.fields.map((field) => (
              <div
                key={field.key}
                className={cn(
                  'space-y-2',
                  (field.multiline || field.fullWidth) && 'md:col-span-2',
                )}
              >
                <Label htmlFor={`profile-${field.key}`}>{field.label}</Label>
                {field.type === 'image' ? (
                  <PortraitUploadField
                    value={form[field.key] as string}
                    onChange={(url) =>
                      setForm((prev) => ({
                        ...prev,
                        [field.key]: url,
                      }))
                    }
                  />
                ) : field.multiline ? (
                  <Textarea
                    id={`profile-${field.key}`}
                    value={form[field.key]}
                    rows={field.rows || 3}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                  />
                ) : (
                  <Input
                    id={`profile-${field.key}`}
                    value={form[field.key]}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                  />
                )}
                {field.hint && (
                  <p className="text-xs text-muted-foreground">{field.hint}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-4 pt-4 border-t border-border">
        <Button onClick={handleSave} disabled={mutation.isPending}>
          {mutation.isPending ? '保存中…' : '保存'}
        </Button>
        {mutation.isSuccess && (
          <span className="text-sm text-primary">已保存</span>
        )}
      </div>
    </div>
  );
};

const TimelineCopyPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: copy, isLoading } = useQuery({
    queryKey: ['homepage-copy'],
    queryFn: portfolio.getHomepageCopy,
  });
  const [entries, setEntries] = useState<TimelineEntry[]>([]);

  useEffect(() => {
    if (copy) {
      setEntries(parseTimelineEntries(copy));
    }
  }, [copy]);

  const mutation = useMutation({
    mutationFn: portfolio.updateHomepageCopy,
    retry: false,
    onSuccess: (data) => {
      queryClient.setQueryData(['homepage-copy'], data);
      queryClient.invalidateQueries({ queryKey: ['homepage-copy'] });
      toast.success('时间历程已保存');
    },
    onError: (err: Error) => {
      toast.error(err.message || '保存失败');
    },
  });

  const updateEntry = (
    id: string,
    patch: Partial<Omit<TimelineEntry, 'id'>>,
  ) => {
    setEntries((current) =>
      current.map((entry) =>
        entry.id === id ? { ...entry, ...patch } : entry,
      ),
    );
  };

  const addEntry = () => {
    setEntries((current) => [
      ...current,
      {
        id: createTimelineEntryId(),
        year: String(new Date().getFullYear()),
        category: '经历',
        content: '',
      },
    ]);
  };

  const removeEntry = (id: string) => {
    setEntries((current) => current.filter((entry) => entry.id !== id));
    toast.info('已从当前编辑中移除，保存后生效');
  };

  const handleSave = () => {
    if (entries.length === 0) {
      mutation.mutate(serializeTimelineEntries([]));
      return;
    }

    const invalidEntry = entries.find(
      (entry) =>
        !/^\d{4}$/.test(entry.year.trim()) || !entry.content.trim(),
    );
    if (invalidEntry) {
      toast.error('请为每条时间历程填写四位年份和事件内容');
      return;
    }

    mutation.mutate(serializeTimelineEntries(entries));
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const categoryCounts = entries.reduce(
    (counts, entry) => ({
      ...counts,
      [entry.category]: counts[entry.category] + 1,
    }),
    { 经历: 0, 荣誉: 0, 展览: 0 } as Record<TimelineCategory, number>,
  );

  return (
    <div className="admin-content-panel mx-auto max-w-5xl space-y-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-2xl">时间历程</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            统一管理首页时间轴与关于页履历；保存后按年份自动排序展示。
          </p>
        </div>
        <Button type="button" onClick={addEntry} className="shrink-0">
          <Plus className="mr-1.5 h-4 w-4" />
          新增历程
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {(['经历', '荣誉', '展览'] as TimelineCategory[]).map((category) => (
          <div
            key={category}
            className="border border-border bg-foreground/[0.025] px-4 py-3"
          >
            <p className="text-xs text-muted-foreground">{category}</p>
            <p className="mt-1 font-display text-2xl text-foreground">
              {categoryCounts[category]}
            </p>
          </div>
        ))}
      </div>

      {entries.length === 0 ? (
        <div className="flex min-h-52 flex-col items-center justify-center border border-dashed border-border px-6 text-center">
          <History className="h-9 w-9 text-muted-foreground/45" />
          <p className="mt-4 font-display text-xl text-foreground">
            还没有时间历程
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            点击「新增历程」添加第一条记录
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="grid gap-4 border border-border bg-foreground/[0.025] p-4 md:grid-cols-[104px_130px_minmax(0,1fr)_40px] md:items-start"
            >
              <div className="space-y-2">
                <Label htmlFor={`timeline-year-${entry.id}`}>年份</Label>
                <Input
                  id={`timeline-year-${entry.id}`}
                  value={entry.year}
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="2026"
                  onChange={(event) =>
                    updateEntry(entry.id, {
                      year: event.target.value.replace(/\D/g, '').slice(0, 4),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>类型</Label>
                <Select
                  value={entry.category}
                  onValueChange={(value) =>
                    updateEntry(entry.id, {
                      category: value as TimelineCategory,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="经历">经历</SelectItem>
                    <SelectItem value="荣誉">荣誉</SelectItem>
                    <SelectItem value="展览">展览</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`timeline-content-${entry.id}`}>
                  事件内容
                </Label>
                <Textarea
                  id={`timeline-content-${entry.id}`}
                  value={entry.content}
                  rows={2}
                  placeholder="例如：举办《光影诗行》个人摄影展"
                  onChange={(event) =>
                    updateEntry(entry.id, { content: event.target.value })
                  }
                  className="resize-y"
                />
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`删除 ${entry.year} 年时间历程`}
                onClick={() => removeEntry(entry.id)}
                className="justify-self-start text-muted-foreground hover:text-destructive md:mt-7"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
        <p className="text-xs leading-5 text-muted-foreground">
          该数据同时用于首页时间轴和关于页履历，并按年份从早到晚排列。
        </p>
        <div className="flex items-center gap-3">
          {mutation.isSuccess && (
            <span className="text-sm text-primary">已保存</span>
          )}
          <Button onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending && (
              <ShutterSpinner size={16} className="mr-2 animate-spin" />
            )}
            保存时间历程
          </Button>
        </div>
      </div>
    </div>
  );
};

const CooperationPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: copy, isLoading } = useQuery({
    queryKey: ['homepage-copy'],
    queryFn: portfolio.getHomepageCopy,
  });

  const [form, setForm] = useState<HomepageCopy>(DEFAULT_HOMEPAGE_COPY);

  useEffect(() => {
    if (copy) {
      setForm(copy);
    }
  }, [copy]);

  const mutation = useMutation({
    mutationFn: portfolio.updateHomepageCopy,
    retry: false,
    onSuccess: (data) => {
      queryClient.setQueryData(['homepage-copy'], data);
      queryClient.invalidateQueries({ queryKey: ['homepage-copy'] });
      toast.success('商业合作内容已保存');
    },
    onError: (err: Error) => {
      toast.error(err.message || '保存失败');
    },
  });

  const handleSave = () => {
    mutation.mutate(form);
  };

  const handleReset = () => {
    setForm(DEFAULT_HOMEPAGE_COPY);
    toast.info('已恢复默认内容，点击保存才会生效');
  };

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-3xl">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((__, j) => (
                <div key={j} className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="admin-content-panel mx-auto max-w-5xl space-y-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl">商业合作</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            管理合作范围、联系方式和流程；可不填写的文案会直接隐藏
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset}>
          恢复默认
        </Button>
      </div>

      {COOPERATION_COPY_SECTIONS.map((section) => (
        <div key={section.title} className="admin-form-section space-y-5">
          <div className="border-b border-border pb-3">
            <h3 className="font-display text-xl font-medium">{section.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {section.description}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {section.fields.map((field) => (
              <div
                key={field.key}
                className={cn(
                  'space-y-2',
                  (field.multiline || field.fullWidth) && 'md:col-span-2',
                )}
              >
                <Label htmlFor={`coop-${field.key}`}>{field.label}</Label>
                {field.multiline ? (
                  <Textarea
                    id={`coop-${field.key}`}
                    value={form[field.key]}
                    rows={field.rows || 3}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                    className="resize-y"
                  />
                ) : (
                  <Input
                    id={`coop-${field.key}`}
                    value={form[field.key]}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                  />
                )}
                {field.hint && (
                  <p className="text-xs text-muted-foreground">{field.hint}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3 pt-4">
        <Button onClick={handleSave} disabled={mutation.isPending}>
          {mutation.isPending && (
            <ShutterSpinner size={16} className="mr-2 animate-spin" />
          )}
          保存内容
        </Button>
        {mutation.isSuccess && (
          <span className="text-sm text-primary">已保存</span>
        )}
      </div>
    </div>
  );
};

/* ---------- Hero Carousel Panel ---------- */

interface HeroSlideForm {
  mediaType: 'image' | 'video';
  mediaUrl: string;
  thumbnailUrl: string;
  title: string;
  subtitle: string;
}

const HERO_SLIDE_FORM_INIT: HeroSlideForm = {
  mediaType: 'image',
  mediaUrl: '',
  thumbnailUrl: '',
  title: '',
  subtitle: '',
};

const HeroCarouselPanel: React.FC<{
  mediaType: 'image' | 'video';
}> = ({ mediaType }) => {
  const queryClient = useQueryClient();
  const { uploadFile } = useUploadFile();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [form, setForm] = useState<HeroSlideForm>(HERO_SLIDE_FORM_INIT);
  const [deleteTarget, setDeleteTarget] = useState<HeroSlide | null>(null);
  const [uploading, setUploading] = useState<'media' | 'thumbnail' | null>(null);
  const [dragTarget, setDragTarget] = useState<'media' | 'thumbnail' | null>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const { data: slides, isLoading } = useQuery({
    queryKey: ['hero-slides'],
    queryFn: () => portfolio.getHeroSlides(),
  });

  const sortedSlides = slides
    ? slides
        .filter((slide: HeroSlide) => slide.mediaType === mediaType)
        .sort((a: HeroSlide, b: HeroSlide) => a.sortOrder - b.sortOrder)
    : [];
  const mediaLabel = mediaType === 'video' ? '视频' : '图片';

  const createMutation = useMutation({
    mutationFn: (body: CreateHeroSlideRequest) => portfolio.createHeroSlide(body),
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-slides'] });
      toast.success(`${mediaLabel}轮播项已创建`);
      setDialogOpen(false);
      setForm({ ...HERO_SLIDE_FORM_INIT, mediaType });
    },
    onError: (err: Error) => {
      toast.error(getErrMsg(err));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateHeroSlideRequest }) =>
      portfolio.updateHeroSlide(id, body),
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-slides'] });
      toast.success(`${mediaLabel}轮播项已更新`);
      setDialogOpen(false);
      setEditingSlide(null);
    },
    onError: (err: Error) => {
      toast.error(getErrMsg(err));
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      portfolio.updateHeroSlide(id, { isActive }),
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-slides'] });
    },
    onError: (err: Error) => {
      toast.error(getErrMsg(err));
      queryClient.invalidateQueries({ queryKey: ['hero-slides'] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (items: { id: string; sortOrder: number }[]) =>
      portfolio.reorderHeroSlides({ items }),
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-slides'] });
    },
    onError: (err: Error) => {
      toast.error(getErrMsg(err));
      queryClient.invalidateQueries({ queryKey: ['hero-slides'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => portfolio.deleteHeroSlide(id),
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hero-slides'] });
      toast.success(`${mediaLabel}轮播项已删除`);
      setDeleteTarget(null);
    },
    onError: (err: Error) => {
      toast.error(getErrMsg(err));
    },
  });

  const handleOpenCreate = () => {
    setEditingSlide(null);
    setForm({ ...HERO_SLIDE_FORM_INIT, mediaType });
    setDialogOpen(true);
  };

  const handleOpenEdit = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setForm({
      mediaType: slide.mediaType,
      mediaUrl: slide.mediaUrl,
      thumbnailUrl: slide.thumbnailUrl || '',
      title: slide.title || '',
      subtitle: slide.subtitle || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.mediaUrl.trim()) {
      toast.error('请填写媒体地址');
      return;
    }
    if (editingSlide) {
      updateMutation.mutate({
        id: editingSlide.id,
        body: {
          mediaUrl: form.mediaUrl,
          thumbnailUrl: form.thumbnailUrl || undefined,
          title: form.title || undefined,
          subtitle: form.subtitle || undefined,
        },
      });
    } else {
      createMutation.mutate({
        mediaType: form.mediaType,
        mediaUrl: form.mediaUrl,
        thumbnailUrl: form.thumbnailUrl || undefined,
        title: form.title || undefined,
        subtitle: form.subtitle || undefined,
      });
    }
  };

  const handleUpload = async (
    file: File | undefined,
    target: 'media' | 'thumbnail',
  ) => {
    if (!file) return;
    const validationError =
      target === 'media' ? validateFile(file, mediaType) : validateFile(file, 'image');
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setUploading(target);
    try {
      const url = await uploadFile(file);
      setForm((current) => ({
        ...current,
        ...(target === 'media'
          ? {
              mediaUrl: url,
              thumbnailUrl:
                mediaType === 'image' ? url : current.thumbnailUrl,
            }
          : { thumbnailUrl: url }),
      }));
      toast.success(target === 'media' ? `${mediaLabel}已上传` : '视频封面已上传');
    } catch (err) {
      toast.error(getErrMsg(err));
    } finally {
      setUploading(null);
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (!sortedSlides.length) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedSlides.length) return;

    const newSlides = [...sortedSlides];
    [newSlides[index], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[index]];

    const sortBase = mediaType === 'video' ? 1000 : 1;
    const reorderItems = newSlides.map((slide: HeroSlide, i: number) => ({
      id: slide.id,
      sortOrder: sortBase + i,
    }));
    reorderMutation.mutate(reorderItems);
  };

  const handleToggle = (slide: HeroSlide, isActive: boolean) => {
    toggleMutation.mutate({ id: slide.id, isActive });
  };

  const handleDelete = (slide: HeroSlide) => {
    setDeleteTarget(slide);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border border-border rounded">
            <Skeleton className="h-20 w-36 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-60" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl">首页{mediaLabel}轮播</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            管理首页{mediaLabel}轮播，支持上传、调整顺序和启停，修改后前台立即生效
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-1" />
          上传{mediaLabel}
        </Button>
      </div>

      {sortedSlides.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 border border-dashed border-border rounded">
          {mediaType === 'video' ? (
            <Film className="h-12 w-12 text-muted-foreground/40 mb-3" />
          ) : (
            <Images className="h-12 w-12 text-muted-foreground/40 mb-3" />
          )}
          <p className="text-muted-foreground">暂无{mediaLabel}轮播</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            点击右上角「上传{mediaLabel}」开始添加
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedSlides.map((slide: HeroSlide, index: number) => (
            <div
              key={slide.id}
              className="flex items-center gap-3 p-3 border border-border bg-card hover-elevate transition-colors"
            >
              {/* Thumbnail */}
              <div className="relative w-28 h-16 flex-shrink-0 overflow-hidden bg-muted">
                {slide.mediaType === 'image' ||
                (slide.mediaType === 'video' && slide.thumbnailUrl) ? (
                  <Image
                    src={slide.thumbnailUrl || slide.mediaUrl}
                    alt={slide.title || '轮播预览'}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Play className="h-8 w-8 text-muted-foreground/60" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded">
                    {mediaLabel}
                  </span>
                  {!slide.isActive && (
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground/60 rounded">
                      已停用
                    </span>
                  )}
                </div>
                <h4 className="font-medium truncate">{slide.title || '（无标题）'}</h4>
                <p className="text-sm text-muted-foreground truncate">
                  {slide.subtitle || '（无副标题）'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="上移"
                  disabled={index === 0 || reorderMutation.isPending}
                  onClick={() => handleMove(index, 'up')}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="下移"
                  disabled={index === sortedSlides.length - 1 || reorderMutation.isPending}
                  onClick={() => handleMove(index, 'down')}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-1" />
                <Switch
                  checked={slide.isActive}
                  onCheckedChange={(checked) => handleToggle(slide, checked)}
                  aria-label="启用停用"
                  disabled={toggleMutation.isPending}
                />
                <div className="w-px h-6 bg-border mx-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="编辑"
                  onClick={() => handleOpenEdit(slide)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="删除"
                  onClick={() => handleDelete(slide)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-2xl">
          <DialogHeader className="shrink-0">
            <DialogTitle>
              {editingSlide ? `编辑首页${mediaLabel}` : `上传首页${mediaLabel}`}
            </DialogTitle>
            <DialogDescription>
              {editingSlide
                ? `替换${mediaLabel}文件或修改标题文案`
                : `上传一个首页${mediaLabel}轮播项`}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto py-2 pr-1 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
            <div className="space-y-2">
              <Label>{mediaLabel}文件</Label>
              <div
                className={cn(
                  'space-y-3 border border-dashed p-4 transition-colors',
                  dragTarget === 'media'
                    ? 'border-primary bg-primary/[0.06]'
                    : 'border-border bg-foreground/[0.025]',
                )}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (!uploading) setDragTarget('media');
                }}
                onDragLeave={() => setDragTarget(null)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragTarget(null);
                  if (!uploading) {
                    void handleUpload(event.dataTransfer.files?.[0], 'media');
                  }
                }}
              >
                <input
                  ref={mediaInputRef}
                  type="file"
                  accept={mediaType === 'video' ? VIDEO_ACCEPT : IMAGE_ACCEPT}
                  className="hidden"
                  onChange={(event) => {
                    void handleUpload(event.target.files?.[0], 'media');
                    event.currentTarget.value = '';
                  }}
                />

                {form.mediaUrl ? (
                  <div className="relative mx-auto h-40 w-full max-w-md overflow-hidden border border-border bg-muted">
                    {mediaType === 'image' ? (
                      <Image
                        src={form.mediaUrl}
                        alt="首页图片预览"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <video
                        src={form.mediaUrl}
                        controls
                        muted
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                ) : (
                  <div className="flex h-36 w-full flex-col items-center justify-center bg-muted/35 text-muted-foreground">
                    {mediaType === 'video' ? (
                      <Film className="h-10 w-10" />
                    ) : (
                      <ImageIcon className="h-10 w-10" />
                    )}
                    <p className="mt-3 text-sm">尚未选择{mediaLabel}文件</p>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => mediaInputRef.current?.click()}
                    disabled={uploading !== null}
                  >
                    {uploading === 'media' ? (
                      <ShutterSpinner size={15} className="mr-2 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    {form.mediaUrl ? `重新上传${mediaLabel}` : `选择${mediaLabel}文件`}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {mediaType === 'video'
                      ? '支持 MP4、MOV、WebM，可拖拽文件到这里'
                      : '支持 JPG、PNG、WebP、AVIF、GIF，可拖拽文件到这里'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hero-media-url">媒体地址（可选）</Label>
              <Input
                id="hero-media-url"
                placeholder="https://..."
                value={form.mediaUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, mediaUrl: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                上传后会自动填写，也可以直接粘贴完整 URL
              </p>
            </div>

            {mediaType === 'video' && (
              <div className="space-y-2">
                <Label>视频封面（可选）</Label>
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept={IMAGE_ACCEPT}
                  className="hidden"
                  onChange={(event) => {
                    void handleUpload(event.target.files?.[0], 'thumbnail');
                    event.currentTarget.value = '';
                  }}
                />
                <div
                  className={cn(
                    'flex items-center gap-3 border border-dashed p-3 transition-colors',
                    dragTarget === 'thumbnail'
                      ? 'border-primary bg-primary/[0.06]'
                      : 'border-border',
                  )}
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (!uploading) setDragTarget('thumbnail');
                  }}
                  onDragLeave={() => setDragTarget(null)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragTarget(null);
                    if (!uploading) {
                      void handleUpload(
                        event.dataTransfer.files?.[0],
                        'thumbnail',
                      );
                    }
                  }}
                >
                  {form.thumbnailUrl && (
                    <div className="relative h-16 w-28 shrink-0 overflow-hidden border border-border bg-muted">
                      <Image
                        src={form.thumbnailUrl}
                        alt="视频封面预览"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => thumbnailInputRef.current?.click()}
                    disabled={uploading !== null}
                  >
                    {uploading === 'thumbnail' ? (
                      <ShutterSpinner size={15} className="mr-2 animate-spin" />
                    ) : (
                      <ImageIcon className="mr-2 h-4 w-4" />
                    )}
                    上传或拖入视频封面
                  </Button>
                </div>
                <Input
                  placeholder="也可以粘贴封面图片 URL"
                  value={form.thumbnailUrl}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, thumbnailUrl: e.target.value }))
                  }
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="hero-title">标题</Label>
              <Input
                id="hero-title"
                placeholder="轮播标题"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hero-subtitle">副标题</Label>
              <Textarea
                id="hero-subtitle"
                placeholder="轮播副标题"
                value={form.subtitle}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, subtitle: e.target.value }))
                }
                rows={2}
                className="resize-y"
              />
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t border-border pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || uploading !== null}
            >
              {(isSubmitting || uploading !== null) && (
                <ShutterSpinner size={14} className="mr-2 animate-spin" />
              )}
              {editingSlide ? '保存修改' : `创建${mediaLabel}轮播`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除轮播项「{deleteTarget?.title || '未命名'}」吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <ShutterSpinner size={14} className="mr-2 animate-spin" />
              )}
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

/* ---------- Artwork Upload / Edit Dialog ---------- */

interface ArtworkFormData {
  title: string;
  description: string;
  seriesId: string;
  categoryId: string;
  location: string;
  latitude: string;
  longitude: string;
  shotDirection: string;
  shotAltitude: string;
  shotAngle: string;
  cameraPositionDesc: string;
  takenAt: string;
  sortOrder: string;
}

const ARTWORK_FORM_INIT: ArtworkFormData = {
  title: '',
  description: '',
  seriesId: '',
  categoryId: '',
  location: '',
  latitude: '',
  longitude: '',
  shotDirection: '',
  shotAltitude: '',
  shotAngle: '',
  cameraPositionDesc: '',
  takenAt: '',
  sortOrder: '',
};

interface ArtworkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: Artwork | null;
  initialFile?: File | null;
  mediaType: 'image' | 'video';
  seriesList: Series[];
  categoryList: Category[];
  onCreate: (body: CreateArtworkRequest, file: File, rawFile: File | null) => Promise<void>;
  onUpdate: (id: string, body: UpdateArtworkRequest) => Promise<void>;
}

const ArtworkDialog: React.FC<ArtworkDialogProps> = ({
  open,
  onOpenChange,
  editItem,
  initialFile,
  mediaType: lockedMediaType,
  seriesList,
  categoryList,
  onCreate,
  onUpdate,
}) => {
  const isEdit = !!editItem;
  const [form, setForm] = useState<ArtworkFormData>(ARTWORK_FORM_INIT);
  const [file, setFile] = useState<File | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>(
    lockedMediaType,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [metadata, setMetadata] = useState<MediaMetadata | null>(null);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (editItem) {
        setForm({
          title: editItem.title,
          description: editItem.description || '',
          seriesId: editItem.seriesId || '',
          categoryId: editItem.categoryId || '',
          location: editItem.location || '',
          latitude: editItem.latitude != null ? String(editItem.latitude) : '',
          longitude: editItem.longitude != null ? String(editItem.longitude) : '',
          shotDirection: editItem.shotDirection != null ? String(editItem.shotDirection) : '',
          shotAltitude: editItem.shotAltitude != null ? String(editItem.shotAltitude) : '',
          shotAngle: editItem.shotAngle != null ? String(editItem.shotAngle) : '',
          cameraPositionDesc: editItem.cameraPositionDesc || '',
          takenAt: editItem.takenAt ? editItem.takenAt.slice(0, 10) : '',
          sortOrder: String(editItem.sortOrder ?? ''),
        });
        setPreviewUrl(editItem.imageUrl);
        setFile(null);
        setMediaType(editItem.mediaType);
        setMetadata(editItem.width && editItem.height
          ? {
              width: editItem.width,
              height: editItem.height!,
              durationSeconds: editItem.durationSeconds ?? undefined,
              fps: editItem.fps ?? undefined,
              quality: (editItem.quality as MediaMetadata['quality']) || 'FHD',
            }
          : null);
      } else {
        setForm(ARTWORK_FORM_INIT);
        setFile(null);
        setRawFile(null);
        setPreviewUrl('');
        setMediaType(lockedMediaType);
        setMetadata(null);
      }
    }
  }, [open, editItem, lockedMediaType]);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const handleFile = useCallback(async (f: File | null) => {
    if (!f) return;
    const nextMediaType = f.type.startsWith('video/') ? 'video' : 'image';
    if (nextMediaType !== lockedMediaType) {
      toast.error(
        lockedMediaType === 'image'
          ? '当前通道仅支持上传图片作品'
          : '当前通道仅支持上传视频作品',
      );
      return;
    }
    const err = nextMediaType === 'image'
      ? validateArtworkImageFile(f)
      : validateArtworkVideoFile(f);
    if (err) {
      toast.error(err);
      return;
    }
    setFile(f);
    setRawFile(null);
    setMediaType(nextMediaType);
    setMetadata(null);
    setMetadataLoading(true);
    try {
      const isVideo = f.type.startsWith('video/');
      const meta = isVideo
        ? await readVideoMetadata(f)
        : await readImageMetadata(f);
      setMetadata(meta);
      setForm((prev) => ({
        ...prev,
        takenAt: prev.takenAt || meta.takenAt ? meta.takenAt?.slice(0, 10) || prev.takenAt : '',
        location: prev.location || meta.location || '',
      }));
    } catch (err) {
      logger.error('读取媒体元数据失败', err);
    } finally {
      setMetadataLoading(false);
    }
  }, [lockedMediaType]);

  useEffect(() => {
    if (open && !editItem && initialFile) {
      void handleFile(initialFile);
    }
  }, [editItem, handleFile, initialFile, open]);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files?.[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error('请输入标题');
      return;
    }
    if (isEdit) {
      const body: UpdateArtworkRequest = {
        title: form.title.trim(),
        description: form.description || undefined,
        seriesId: form.seriesId || null,
        categoryId: form.categoryId || null,
        location: form.location || undefined,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        shotDirection: form.shotDirection ? Number(form.shotDirection) : null,
        shotAltitude: form.shotAltitude ? Number(form.shotAltitude) : null,
        shotAngle: form.shotAngle ? Number(form.shotAngle) : null,
        cameraPositionDesc: form.cameraPositionDesc || undefined,
        takenAt: form.takenAt || undefined,
      };
      if (form.sortOrder) body.sortOrder = Number(form.sortOrder);
      setSubmitting(true);
      try {
        await onUpdate(editItem!.id, body);
        onOpenChange(false);
      } catch (err) {
        logger.error('更新作品失败', err);
        toast.error(getErrMsg(err));
      } finally {
        setSubmitting(false);
      }
    } else {
      if (!file) {
        toast.error('请选择要上传的文件');
        return;
      }
      const body: CreateArtworkRequest = {
        title: form.title.trim(),
        description: form.description || undefined,
        imageUrl: '', // will be set after upload
        mediaType,
        width: metadata?.width,
        height: metadata?.height,
        durationSeconds: metadata?.durationSeconds,
        fps: metadata?.fps,
        quality: metadata?.quality,
        fileSize: metadata?.fileSize,
        cameraModel: metadata?.cameraModel,
        lensModel: metadata?.lensModel,
        aperture: metadata?.aperture,
        shutterSpeed: metadata?.shutterSpeed,
        iso: metadata?.iso,
        focalLength: metadata?.focalLength,
        exposureCompensation: metadata?.exposureCompensation,
        whiteBalance: metadata?.whiteBalance,
        seriesId: form.seriesId || undefined,
        categoryId: form.categoryId || undefined,
        location: form.location || undefined,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        shotDirection: form.shotDirection ? Number(form.shotDirection) : null,
        shotAltitude: form.shotAltitude ? Number(form.shotAltitude) : null,
        shotAngle: form.shotAngle ? Number(form.shotAngle) : null,
        cameraPositionDesc: form.cameraPositionDesc || undefined,
        takenAt: form.takenAt || undefined,
      };
      if (form.sortOrder) body.sortOrder = Number(form.sortOrder);
      setSubmitting(true);
      try {
        await onCreate(body, file, rawFile);
        onOpenChange(false);
      } catch (err) {
        logger.error('上传作品失败', err);
        toast.error(getErrMsg(err));
      } finally {
        setSubmitting(false);
      }
    }
  };

  const isVideo = previewUrl && mediaType === 'video';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-xl">
        <DialogHeader className="shrink-0">
          <DialogTitle className="font-display text-xl">
            {isEdit
              ? '编辑作品'
              : lockedMediaType === 'video'
                ? '上传视频作品'
                : '上传图片作品'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? '修改作品信息'
              : lockedMediaType === 'video'
                ? '上传视频作品到作品集'
                : '上传图片作品到作品集'}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-2 pr-1">
          {/* Upload area */}
          {!isEdit && (
            <div
              className={cn(
                'relative flex flex-col items-center justify-center border-2 border-dashed rounded-md p-8 transition-colors cursor-pointer',
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/60 hover:bg-accent/30',
              )}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={mediaType === 'image' ? IMAGE_ACCEPT : VIDEO_ACCEPT}
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
              {previewUrl ? (
                <div className="relative w-full">
                  {isVideo ? (
                    <video
                      src={previewUrl}
                      controls
                      className="w-full max-h-64 object-contain rounded-sm bg-black/5"
                    />
                  ) : (
                    <Image
                      src={previewUrl}
                      alt="预览"
                      width={600}
                      height={400}
                      className="w-full max-h-64 object-contain rounded-sm"
                    />
                  )}
                  <Button
                    size="icon"
                    variant="outline"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setPreviewUrl('');
                    }}
                    aria-label="移除文件"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">拖拽文件到这里，或点击选择</p>
                  <p className="text-xs text-muted-foreground">
                    {mediaType === 'image'
                      ? '支持 JPG、PNG、WebP、AVIF、GIF'
                      : '支持 MP4、MOV、WebM'}
                  </p>
                </div>
              )}
            </div>
          )}

          {isEdit && editItem && (
            <div className="relative w-full">
              {editItem.mediaType === 'video' ? (
                <video
                  src={editItem.imageUrl}
                  controls
                  className="w-full max-h-48 object-contain rounded-sm bg-black/5"
                />
              ) : (
                <Image
                  src={editItem.imageUrl}
                  alt={editItem.title}
                  width={600}
                  height={400}
                  className="w-full max-h-48 object-contain rounded-sm"
                />
              )}
            </div>
          )}

          {/* Form fields */}
          <div className="relative z-10 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="art-title">标题 *</Label>
              <Input
                id="art-title"
                autoFocus={!isEdit}
                autoComplete="off"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="作品标题"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="art-desc">描述</Label>
              <Textarea
                id="art-desc"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="作品描述（可选）"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="art-series">所属系列</Label>
                <Select
                  value={form.seriesId}
                  onValueChange={(v) => setForm({ ...form, seriesId: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择系列" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">无</SelectItem>
                    {seriesList.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.titleZh}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="art-category">所属分类</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(v) => setForm({ ...form, categoryId: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">无</SelectItem>
                    {categoryList.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nameZh}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="art-location">拍摄地点</Label>
                <Input
                  id="art-location"
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  placeholder="如：冰岛"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="art-lat">纬度</Label>
                <Input
                  id="art-lat"
                  type="number"
                  step="0.000001"
                  value={form.latitude}
                  onChange={(e) =>
                    setForm({ ...form, latitude: e.target.value })
                  }
                  placeholder="如：64.9631"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="art-lng">经度</Label>
                <Input
                  id="art-lng"
                  type="number"
                  step="0.000001"
                  value={form.longitude}
                  onChange={(e) =>
                    setForm({ ...form, longitude: e.target.value })
                  }
                  placeholder="如：-19.0208"
                />
              </div>
            </div>

            <Collapsible className="border border-border rounded-md p-3">
              <CollapsibleTrigger className="group flex w-full items-center justify-between text-sm font-medium">
                <span>拍摄机位</span>
                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="art-shot-direction">拍摄朝向</Label>
                    <Input
                      id="art-shot-direction"
                      type="number"
                      min={0}
                      max={360}
                      step="0.1"
                      value={form.shotDirection}
                      onChange={(e) =>
                        setForm({ ...form, shotDirection: e.target.value })
                      }
                      placeholder="0-360 度"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="art-shot-altitude">机位海拔</Label>
                    <Input
                      id="art-shot-altitude"
                      type="number"
                      step="0.1"
                      value={form.shotAltitude}
                      onChange={(e) =>
                        setForm({ ...form, shotAltitude: e.target.value })
                      }
                      placeholder="单位：米"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="art-shot-angle">俯仰角</Label>
                    <Input
                      id="art-shot-angle"
                      type="number"
                      step="0.1"
                      value={form.shotAngle}
                      onChange={(e) =>
                        setForm({ ...form, shotAngle: e.target.value })
                      }
                      placeholder="正值仰拍 / 负值俯拍"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="art-camera-position-desc">机位描述</Label>
                  <Textarea
                    id="art-camera-position-desc"
                    rows={3}
                    value={form.cameraPositionDesc}
                    onChange={(e) =>
                      setForm({ ...form, cameraPositionDesc: e.target.value })
                    }
                    placeholder="描述机位环境、取景角度等细节"
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="art-date">拍摄日期</Label>
                <Input
                  id="art-date"
                  type="date"
                  value={form.takenAt}
                  onChange={(e) =>
                    setForm({ ...form, takenAt: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="art-sort">排序序号</Label>
                <Input
                  id="art-sort"
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm({ ...form, sortOrder: e.target.value })
                  }
                  placeholder="数字越小越靠前"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-border pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && (
              <ShutterSpinner size={16} className="animate-spin" />
            )}
            {isEdit ? '保存修改' : '上传'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ---------- Batch artwork upload ---------- */

type BatchItemStatus = 'pending' | 'uploading' | 'done' | 'error';

interface BatchArtworkItem {
  id: string;
  file: File;
  form: ArtworkFormData;
  status: BatchItemStatus;
  error?: string;
}

interface BatchArtworkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaType: 'image' | 'video';
  seriesList: Series[];
  categoryList: Category[];
  onUpload: (
    body: CreateArtworkRequest,
    file: File,
  ) => Promise<void>;
}

const BatchArtworkDialog: React.FC<BatchArtworkDialogProps> = ({
  open,
  onOpenChange,
  mediaType,
  seriesList,
  categoryList,
  onUpload,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<BatchArtworkItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!open) {
      setItems([]);
      setCurrentIndex(0);
      setSubmitting(false);
      setPreviewUrl('');
    }
  }, [open]);

  const currentItem = items[currentIndex];

  useEffect(() => {
    if (!currentItem) {
      setPreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(currentItem.file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [currentItem]);

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const nextItems: BatchArtworkItem[] = [];
    for (const file of Array.from(files)) {
      const error =
        mediaType === 'image'
          ? validateArtworkImageFile(file)
          : validateArtworkVideoFile(file);
      if (error) {
        toast.error(`${file.name}：${error}`);
        continue;
      }
      const title = file.name.replace(/\.[^.]+$/, '');
      nextItems.push({
        id: crypto.randomUUID(),
        file,
        form: {
          ...ARTWORK_FORM_INIT,
          title,
        },
        status: 'pending',
      });
    }
    if (nextItems.length > 0) {
      setItems((prev) => [...prev, ...nextItems]);
      if (items.length === 0) setCurrentIndex(0);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const updateCurrentForm = <K extends keyof ArtworkFormData>(
    key: K,
    value: ArtworkFormData[K],
  ) => {
    setItems((prev) =>
      prev.map((item, index) =>
        index === currentIndex
          ? {
              ...item,
              form: { ...item.form, [key]: value },
              status: item.status === 'done' ? item.status : 'pending',
              error: undefined,
            }
          : item,
      ),
    );
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
    setCurrentIndex((index) => Math.max(0, Math.min(index, items.length - 2)));
  };

  const submitCurrent = async () => {
    const item = items[currentIndex];
    if (!item) return;
    if (!item.form.title.trim()) {
      toast.error('请填写作品标题');
      return;
    }

    setSubmitting(true);
    setItems((prev) =>
      prev.map((entry, index) =>
        index === currentIndex
          ? { ...entry, status: 'uploading', error: undefined }
          : entry,
      ),
    );

    try {
      const metadata =
        mediaType === 'image'
          ? await readImageMetadata(item.file)
          : await readVideoMetadata(item.file);
      const body: CreateArtworkRequest = {
        title: item.form.title.trim(),
        description: item.form.description || undefined,
        imageUrl: '',
        mediaType,
        width: metadata.width,
        height: metadata.height,
        durationSeconds: metadata.durationSeconds,
        fps: metadata.fps,
        quality: metadata.quality,
        fileSize: metadata.fileSize,
        cameraModel: metadata.cameraModel,
        lensModel: metadata.lensModel,
        aperture: metadata.aperture,
        shutterSpeed: metadata.shutterSpeed,
        iso: metadata.iso,
        focalLength: metadata.focalLength,
        exposureCompensation: metadata.exposureCompensation,
        whiteBalance: metadata.whiteBalance,
        seriesId: item.form.seriesId || undefined,
        categoryId: item.form.categoryId || undefined,
        location: item.form.location || undefined,
        takenAt: item.form.takenAt || undefined,
      };
      await onUpload(body, item.file);
      setItems((prev) =>
        prev.map((entry, index) =>
          index === currentIndex
            ? { ...entry, status: 'done' }
            : entry,
        ),
      );
      const nextIndex = items.findIndex(
        (entry, index) =>
          index !== currentIndex &&
          entry.status !== 'done',
      );
      if (nextIndex >= 0) setCurrentIndex(nextIndex);
    } catch (error) {
      logger.error('批量上传作品失败', error);
      setItems((prev) =>
        prev.map((entry, index) =>
          index === currentIndex
            ? {
                ...entry,
                status: 'error',
                error: getErrMsg(error),
              }
            : entry,
        ),
      );
      toast.error(getErrMsg(error));
    } finally {
      setSubmitting(false);
    }
  };

  const completedCount = items.filter(
    (item) => item.status === 'done',
  ).length;
  const allDone = items.length > 0 && completedCount === items.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            批量上传作品
          </DialogTitle>
          <DialogDescription>
            一次选择多个文件，按顺序填写信息并逐个上传。
          </DialogDescription>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={mediaType === 'image' ? IMAGE_ACCEPT : VIDEO_ACCEPT}
          className="hidden"
          onChange={(event) => addFiles(event.target.files)}
        />

        {items.length === 0 ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              addFiles(event.dataTransfer.files);
            }}
            className={cn(
              'flex min-h-56 w-full flex-col items-center justify-center gap-3 border-2 border-dashed px-6 text-center transition-colors',
              isDragging
                ? 'border-primary bg-primary/[0.06]'
                : 'border-border hover:border-primary/60 hover:bg-primary/[0.03]',
            )}
          >
            <Files className="h-9 w-9 text-muted-foreground" />
            <span className="font-medium">拖拽文件到这里，或点击选择多个文件</span>
            <span className="text-xs text-muted-foreground">
              {mediaType === 'image'
                ? '支持 JPG、PNG、WebP、AVIF、GIF；可一次多选'
                : '支持 MP4、MOV、WebM；可一次多选'}
            </span>
          </button>
        ) : (
          <div className="grid gap-5 md:grid-cols-[220px_1fr]">
            <aside className="space-y-2">
              <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
                <span>
                  已完成 {completedCount}/{items.length}
                </span>
                <button
                  type="button"
                  className="text-primary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  继续添加
                </button>
              </div>
              <div className="max-h-72 space-y-1 overflow-y-auto md:max-h-[430px]">
                {items.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCurrentIndex(index)}
                    className={cn(
                      'flex w-full items-center gap-2 border px-3 py-2 text-left text-xs transition-colors',
                      index === currentIndex
                        ? 'border-primary/60 bg-primary/10'
                        : 'border-border bg-card/40 hover:border-primary/40',
                    )}
                  >
                    {item.status === 'done' ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    ) : (
                      <span className="h-4 w-4 shrink-0 rounded-full border border-muted-foreground/50 text-center font-mono text-[8px] leading-[14px]">
                        {index + 1}
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate">
                      {item.form.title || item.file.name}
                    </span>
                  </button>
                ))}
              </div>
            </aside>

            {currentItem && (
              <div className="space-y-4">
                <div className="relative overflow-hidden border border-border bg-black/20">
                  {mediaType === 'video' ? (
                    <video
                      src={previewUrl}
                      muted
                      controls
                      className="max-h-56 w-full object-contain"
                    />
                  ) : (
                    <img
                      src={previewUrl}
                      alt=""
                      className="max-h-56 w-full object-contain"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removeItem(currentIndex)}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center bg-black/70 text-white hover:text-primary"
                    aria-label="移除当前文件"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="batch-art-title">标题 *</Label>
                    <Input
                      id="batch-art-title"
                      value={currentItem.form.title}
                      onChange={(event) =>
                        updateCurrentForm('title', event.target.value)
                      }
                      className="mt-1.5"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="batch-art-desc">描述</Label>
                    <Textarea
                      id="batch-art-desc"
                      rows={3}
                      value={currentItem.form.description}
                      onChange={(event) =>
                        updateCurrentForm(
                          'description',
                          event.target.value,
                        )
                      }
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>所属系列</Label>
                    <Select
                      value={currentItem.form.seriesId}
                      onValueChange={(value) =>
                        updateCurrentForm('seriesId', value)
                      }
                    >
                      <SelectTrigger className="mt-1.5 w-full">
                        <SelectValue placeholder="选择系列" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">无</SelectItem>
                        {seriesList.map((series) => (
                          <SelectItem key={series.id} value={series.id}>
                            {series.titleZh}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>所属分类</Label>
                    <Select
                      value={currentItem.form.categoryId}
                      onValueChange={(value) =>
                        updateCurrentForm('categoryId', value)
                      }
                    >
                      <SelectTrigger className="mt-1.5 w-full">
                        <SelectValue placeholder="选择分类" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">无</SelectItem>
                        {categoryList.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.nameZh}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="batch-art-location">拍摄地点</Label>
                    <Input
                      id="batch-art-location"
                      value={currentItem.form.location}
                      onChange={(event) =>
                        updateCurrentForm(
                          'location',
                          event.target.value,
                        )
                      }
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="batch-art-date">拍摄日期</Label>
                    <Input
                      id="batch-art-date"
                      type="date"
                      value={currentItem.form.takenAt}
                      onChange={(event) =>
                        updateCurrentForm(
                          'takenAt',
                          event.target.value,
                        )
                      }
                      className="mt-1.5"
                    />
                  </div>
                </div>

                {currentItem.error && (
                  <p className="text-xs text-destructive">
                    {currentItem.error}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            关闭
          </Button>
          {items.length > 0 && (
            <Button
              onClick={submitCurrent}
              disabled={
                submitting ||
                allDone ||
                !currentItem ||
                currentItem.status === 'done'
              }
            >
              {submitting && (
                <ShutterSpinner
                  size={16}
                  className="mr-2 animate-spin"
                />
              )}
              {allDone
                ? '全部完成'
                : currentItem?.status === 'done'
                  ? '已上传'
                  : '保存并继续'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ---------- Series Dialog ---------- */

interface SeriesFormData {
  titleZh: string;
  titleEn: string;
  description: string;
  yearStart: string;
  yearEnd: string;
  sortOrder: string;
  isFeatured: boolean;
  mediaType: 'image' | 'video';
}

const SERIES_FORM_INIT: SeriesFormData = {
  titleZh: '',
  titleEn: '',
  description: '',
  yearStart: '',
  yearEnd: '',
  sortOrder: '',
  isFeatured: false,
  mediaType: 'image',
};

interface SeriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: Series | null;
  defaultMediaType?: 'image' | 'video';
  onSubmit: (body: CreateSeriesRequest | UpdateSeriesRequest) => Promise<void>;
}

const SeriesDialog: React.FC<SeriesDialogProps> = ({
  open,
  onOpenChange,
  editItem,
  defaultMediaType = 'image',
  onSubmit,
}) => {
  const isEdit = !!editItem;
  const [form, setForm] = useState<SeriesFormData>(SERIES_FORM_INIT);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile } = useUploadFile();

  useEffect(() => {
    if (open) {
      if (editItem) {
        setForm({
          titleZh: editItem.titleZh,
          titleEn: editItem.titleEn,
          description: editItem.description || '',
          yearStart: editItem.yearStart ? String(editItem.yearStart) : '',
          yearEnd: editItem.yearEnd ? String(editItem.yearEnd) : '',
          sortOrder: String(editItem.sortOrder ?? ''),
          isFeatured: editItem.isFeatured,
          mediaType: editItem.mediaType,
        });
        setPreviewUrl(editItem.coverUrl);
        setFile(null);
      } else {
        setForm({ ...SERIES_FORM_INIT, mediaType: defaultMediaType });
        setFile(null);
        setPreviewUrl('');
      }
    }
  }, [open, editItem, defaultMediaType]);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const handleSubmit = async () => {
    if (!form.titleZh.trim()) {
      toast.error('请输入中文名称');
      return;
    }
    if (!isEdit && !file) {
      toast.error('请上传封面图');
      return;
    }

    setSubmitting(true);
    try {
      let coverUrl = editItem?.coverUrl || '';
      if (file) {
        coverUrl = await uploadFile(file);
      }

      const body: CreateSeriesRequest | UpdateSeriesRequest = {
        titleZh: form.titleZh.trim(),
        titleEn: form.titleEn.trim(),
        description: form.description || '',
        coverUrl,
        isFeatured: form.isFeatured,
        mediaType: form.mediaType,
      };
      if (form.yearStart) body.yearStart = Number(form.yearStart);
      if (form.yearEnd) body.yearEnd = Number(form.yearEnd);
      if (form.sortOrder) body.sortOrder = Number(form.sortOrder);

      if (isEdit) {
        const updateBody: UpdateSeriesRequest = { ...body };
        if (!form.yearStart) updateBody.yearStart = null;
        if (!form.yearEnd) updateBody.yearEnd = null;
        await onSubmit(updateBody);
      } else {
        await onSubmit(body as CreateSeriesRequest);
      }
      onOpenChange(false);
    } catch (err) {
      logger.error('保存系列失败', err);
      toast.error(getErrMsg(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {isEdit ? '编辑系列' : '新建系列'}
          </DialogTitle>
          <DialogDescription>
            系列是长期摄影项目，包含多幅相关作品
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cover upload */}
          <div
            className={cn(
              'relative flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-6 transition-colors',
              isDragging
                ? 'border-primary bg-primary/[0.06]'
                : 'hover:border-primary/60 hover:bg-accent/30',
            )}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              const droppedFile = event.dataTransfer.files?.[0];
              if (!droppedFile) return;
              if (validateFile(droppedFile, 'image')) {
                toast.error('请上传图片格式文件');
                return;
              }
              setFile(droppedFile);
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={IMAGE_ACCEPT}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                if (f && validateFile(f, 'image')) {
                  toast.error('请上传图片格式文件');
                  return;
                }
                setFile(f);
              }}
            />
            {previewUrl ? (
              <div className="relative w-full">
                <Image
                  src={previewUrl}
                  alt="封面预览"
                  width={500}
                  height={375}
                  className="w-full h-48 object-cover rounded-sm"
                />
                <Button
                  size="icon"
                  variant="outline"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    if (!isEdit) setPreviewUrl('');
                  }}
                  aria-label="移除封面"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">点击或拖拽上传封面图</p>
                <p className="text-xs text-muted-foreground">
                  建议比例 3:4，横图或竖图皆可
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ser-zh">中文名称 *</Label>
              <Input
                id="ser-zh"
                value={form.titleZh}
                onChange={(e) => setForm({ ...form, titleZh: e.target.value })}
                placeholder="如：冰岛之旅"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ser-en">英文名称</Label>
              <Input
                id="ser-en"
                value={form.titleEn}
                onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                placeholder="如：Iceland Journey"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ser-desc">描述</Label>
            <Textarea
              id="ser-desc"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="系列介绍（可选）"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ser-ys">起始年份</Label>
              <Input
                id="ser-ys"
                type="number"
                value={form.yearStart}
                onChange={(e) =>
                  setForm({ ...form, yearStart: e.target.value })
                }
                placeholder="2020"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ser-ye">结束年份</Label>
              <Input
                id="ser-ye"
                type="number"
                value={form.yearEnd}
                onChange={(e) =>
                  setForm({ ...form, yearEnd: e.target.value })
                }
                placeholder="2024"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 items-center">
            <div className="space-y-1.5">
              <Label htmlFor="ser-sort">排序序号</Label>
              <Input
                id="ser-sort"
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm({ ...form, sortOrder: e.target.value })
                }
                placeholder="数字越小越靠前"
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <Checkbox
                id="ser-featured"
                checked={form.isFeatured}
                onCheckedChange={(v) =>
                  setForm({ ...form, isFeatured: !!v })
                }
              />
              <Label htmlFor="ser-featured" className="cursor-pointer">
                设为精选系列
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && (
              <ShutterSpinner size={16} className="animate-spin" />
            )}
            {isEdit ? '保存修改' : '创建系列'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ---------- Category Dialog ---------- */

interface CategoryFormData {
  nameZh: string;
  nameEn: string;
  description: string;
  sortOrder: string;
  mediaType: 'image' | 'video';
}

const CATEGORY_FORM_INIT: CategoryFormData = {
  nameZh: '',
  nameEn: '',
  description: '',
  sortOrder: '',
  mediaType: 'image',
};

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: Category | null;
  defaultMediaType?: 'image' | 'video';
  onSubmit: (
    body: CreateCategoryRequest | UpdateCategoryRequest,
  ) => Promise<void>;
}

const CategoryDialog: React.FC<CategoryDialogProps> = ({
  open,
  onOpenChange,
  editItem,
  defaultMediaType = 'image',
  onSubmit,
}) => {
  const isEdit = !!editItem;
  const [form, setForm] = useState<CategoryFormData>(CATEGORY_FORM_INIT);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile } = useUploadFile();

  useEffect(() => {
    if (open) {
      if (editItem) {
        setForm({
          nameZh: editItem.nameZh,
          nameEn: editItem.nameEn,
          description: editItem.description || '',
          sortOrder: String(editItem.sortOrder ?? ''),
          mediaType: editItem.mediaType,
        });
        setPreviewUrl(editItem.coverUrl);
        setFile(null);
      } else {
        setForm({ ...CATEGORY_FORM_INIT, mediaType: defaultMediaType });
        setFile(null);
        setPreviewUrl('');
      }
    }
  }, [open, editItem, defaultMediaType]);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const handleSubmit = async () => {
    if (!form.nameZh.trim()) {
      toast.error('请输入中文名称');
      return;
    }
    if (!isEdit && !file) {
      toast.error('请上传封面图');
      return;
    }

    setSubmitting(true);
    try {
      let coverUrl = editItem?.coverUrl || '';
      if (file) {
        coverUrl = await uploadFile(file);
      }

      const body: CreateCategoryRequest | UpdateCategoryRequest = {
        nameZh: form.nameZh.trim(),
        nameEn: form.nameEn.trim(),
        description: form.description || '',
        coverUrl,
        mediaType: form.mediaType,
      };
      if (form.sortOrder) body.sortOrder = Number(form.sortOrder);

      await onSubmit(body);
      onOpenChange(false);
    } catch (err) {
      logger.error('保存分类失败', err);
      toast.error(getErrMsg(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {isEdit ? '编辑分类' : '新建分类'}
          </DialogTitle>
          <DialogDescription>
            分类用于松散地组织作品，如旅行风光、商业拍摄等
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className={cn(
              'relative flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-6 transition-colors',
              isDragging
                ? 'border-primary bg-primary/[0.06]'
                : 'hover:border-primary/60 hover:bg-accent/30',
            )}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              const droppedFile = event.dataTransfer.files?.[0];
              if (!droppedFile) return;
              if (validateFile(droppedFile, 'image')) {
                toast.error('请上传图片格式文件');
                return;
              }
              setFile(droppedFile);
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={IMAGE_ACCEPT}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                if (f && validateFile(f, 'image')) {
                  toast.error('请上传图片格式文件');
                  return;
                }
                setFile(f);
              }}
            />
            {previewUrl ? (
              <div className="relative w-full">
                <Image
                  src={previewUrl}
                  alt="封面预览"
                  width={500}
                  height={300}
                  className="w-full h-40 object-cover rounded-sm"
                />
                <Button
                  size="icon"
                  variant="outline"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    if (!isEdit) setPreviewUrl('');
                  }}
                  aria-label="移除封面"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">点击或拖拽上传封面图</p>
                <p className="text-xs text-muted-foreground">
                  建议横版，宽高比 16:9
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cat-zh">中文名称 *</Label>
              <Input
                id="cat-zh"
                value={form.nameZh}
                onChange={(e) => setForm({ ...form, nameZh: e.target.value })}
                placeholder="如：旅行风光"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-en">英文名称</Label>
              <Input
                id="cat-en"
                value={form.nameEn}
                onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                placeholder="如：Travel"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-media">媒体类型</Label>
            <Select
              value={form.mediaType}
              onValueChange={(v) => setForm({ ...form, mediaType: v as 'image' | 'video' })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image">图片</SelectItem>
                <SelectItem value="video">视频</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-desc">描述</Label>
            <Textarea
              id="cat-desc"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="分类介绍（可选）"
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-sort">排序序号</Label>
            <Input
              id="cat-sort"
              type="number"
              value={form.sortOrder}
              onChange={(e) =>
                setForm({ ...form, sortOrder: e.target.value })
              }
              placeholder="数字越小越靠前"
              className="w-40"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && (
              <ShutterSpinner size={16} className="animate-spin" />
            )}
            {isEdit ? '保存修改' : '创建分类'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ---------- Collection Artwork Manager ---------- */

type ManagedCollection =
  | { kind: 'series'; item: Series }
  | { kind: 'category'; item: Category };

interface CollectionArtworkManagerProps {
  selection: ManagedCollection | null;
  artworks: Artwork[];
  seriesMap: Map<string, Series>;
  categoryMap: Map<string, Category>;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (ids: string[], targetId: string | null) => Promise<void>;
}

const CollectionArtworkManager: React.FC<
  CollectionArtworkManagerProps
> = ({
  selection,
  artworks,
  seriesMap,
  categoryMap,
  loading,
  onOpenChange,
  onAssign,
}) => {
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState<'all' | 'unassigned' | 'current'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selection) return;
    setSearch('');
    setScope('all');
    setSelectedIds(new Set());
  }, [selection?.kind, selection?.item.id]);

  const currentTargetId = selection?.item.id ?? '';
  const collectionTitle = selection
    ? selection.kind === 'series'
      ? (selection.item as Series).titleZh
      : (selection.item as Category).nameZh
    : '';
  const collectionLabel = selection?.kind === 'series' ? '系列' : '分类';

  const getAssignedId = useCallback(
    (artwork: Artwork) =>
      selection?.kind === 'series'
        ? artwork.seriesId
        : artwork.categoryId,
    [selection?.kind],
  );

  const filteredArtworks = React.useMemo(() => {
    if (!selection) return [];
    const keyword = search.trim().toLowerCase();
    return artworks.filter((artwork) => {
      const assignedId = getAssignedId(artwork);
      if (scope === 'unassigned' && assignedId) return false;
      if (scope === 'current' && assignedId !== currentTargetId) return false;
      if (!keyword) return true;
      const seriesName = artwork.seriesId
        ? seriesMap.get(artwork.seriesId)?.titleZh
        : '';
      const categoryName = artwork.categoryId
        ? categoryMap.get(artwork.categoryId)?.nameZh
        : '';
      return [
        artwork.title,
        artwork.description,
        seriesName,
        categoryName,
      ].some((value) => value?.toLowerCase().includes(keyword));
    });
  }, [
    artworks,
    categoryMap,
    currentTargetId,
    getAssignedId,
    scope,
    search,
    selection,
    seriesMap,
  ]);

  const currentCount = artworks.filter(
    (artwork) => getAssignedId(artwork) === currentTargetId,
  ).length;
  const unassignedCount = artworks.filter(
    (artwork) => !getAssignedId(artwork),
  ).length;
  const allVisibleSelected =
    filteredArtworks.length > 0 &&
    filteredArtworks.every((artwork) => selectedIds.has(artwork.id));
  const hasCurrentSelection = artworks.some(
    (artwork) =>
      selectedIds.has(artwork.id) &&
      getAssignedId(artwork) === currentTargetId,
  );

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleVisible = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      filteredArtworks.forEach((artwork) => {
        if (allVisibleSelected) next.delete(artwork.id);
        else next.add(artwork.id);
      });
      return next;
    });
  };

  const handleAssign = async (targetId: string | null) => {
    if (!selection || selectedIds.size === 0) return;
    setSaving(true);
    try {
      await onAssign(Array.from(selectedIds), targetId);
      setSelectedIds(new Set());
      onOpenChange(false);
    } catch (error) {
      logger.error('批量调整作品归类失败', error);
      toast.error(getErrMsg(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!selection} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-5xl flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="font-display text-xl">
            管理「{collectionTitle}」中的作品
          </DialogTitle>
          <DialogDescription>
            可搜索并勾选已有作品，批量调整它们所属的{collectionLabel}。
          </DialogDescription>
        </DialogHeader>

        <div className="shrink-0 space-y-3 border-b border-border pb-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="搜索作品标题、描述、分类或系列"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { value: 'all' as const, label: `全部 ${artworks.length}` },
              { value: 'unassigned' as const, label: `未归${collectionLabel} ${unassignedCount}` },
              { value: 'current' as const, label: `当前${collectionLabel} ${currentCount}` },
            ].map((item) => (
              <Button
                key={item.value}
                type="button"
                size="sm"
                variant={scope === item.value ? 'default' : 'outline'}
                onClick={() => setScope(item.value)}
              >
                {item.label}
              </Button>
            ))}
            <button
              type="button"
              onClick={toggleVisible}
              disabled={filteredArtworks.length === 0}
              className="ml-auto text-xs font-medium text-primary transition-opacity hover:opacity-75 disabled:opacity-40"
            >
              {allVisibleSelected ? '取消全选当前结果' : '全选当前结果'}
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex min-h-52 items-center justify-center gap-3 text-sm text-muted-foreground">
              <ShutterSpinner size={22} className="animate-spin text-primary" />
              正在读取作品…
            </div>
          ) : filteredArtworks.length === 0 ? (
            <div className="flex min-h-52 flex-col items-center justify-center text-center text-sm text-muted-foreground">
              <Images className="mb-3 h-9 w-9 opacity-40" />
              没有符合筛选条件的作品
            </div>
          ) : (
            <div className="space-y-2">
              {filteredArtworks.map((artwork) => {
                const selected = selectedIds.has(artwork.id);
                const seriesName = artwork.seriesId
                  ? seriesMap.get(artwork.seriesId)?.titleZh
                  : '';
                const categoryName = artwork.categoryId
                  ? categoryMap.get(artwork.categoryId)?.nameZh
                  : '';
                return (
                  <label
                    key={artwork.id}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-md border p-2.5 transition-colors',
                      selected
                        ? 'border-primary/60 bg-primary/[0.07]'
                        : 'border-border bg-card/50 hover:border-primary/35',
                    )}
                  >
                    <Checkbox
                      checked={selected}
                      onCheckedChange={() => toggleSelected(artwork.id)}
                    />
                    <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-sm bg-black/20">
                      {artwork.mediaType === 'video' ? (
                        <video
                          src={artwork.imageUrl}
                          muted
                          preload="metadata"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Image
                          src={artwork.imageUrl}
                          alt={artwork.title}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {artwork.title}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        系列：{seriesName || '未归系列'} · 分类：
                        {categoryName || '未归分类'}
                      </p>
                    </div>
                    {getAssignedId(artwork) === currentTargetId && (
                      <span className="shrink-0 rounded-sm bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary">
                        已归入
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 border-t border-border pt-4">
          <span className="mr-auto self-center text-xs text-muted-foreground">
            已选择 {selectedIds.size} 个作品
          </span>
          <Button
            type="button"
            variant="outline"
            disabled={saving || !hasCurrentSelection}
            onClick={() => void handleAssign(null)}
          >
            从当前{collectionLabel}移出
          </Button>
          <Button
            type="button"
            disabled={saving || selectedIds.size === 0}
            onClick={() => void handleAssign(currentTargetId)}
          >
            {saving && (
              <ShutterSpinner size={15} className="mr-2 animate-spin" />
            )}
            归入「{collectionTitle}」
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ---------- Artwork Card ---------- */

interface ArtworkCardProps {
  artwork: Artwork;
  onEdit: (artwork: Artwork) => void;
  onDelete: (artwork: Artwork) => void;
  seriesMap: Map<string, Series>;
  categoryMap: Map<string, Category>;
}

const ArtworkCard: React.FC<ArtworkCardProps> = ({
  artwork,
  onEdit,
  onDelete,
  seriesMap,
  categoryMap,
}) => {
  const series = artwork.seriesId ? seriesMap.get(artwork.seriesId) : null;
  const category = artwork.categoryId
    ? categoryMap.get(artwork.categoryId)
    : null;

  return (
    <div className="group relative bg-card border border-border rounded-md overflow-hidden transition-all duration-300 hover:border-primary/50 hover:-translate-y-0.5">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted/30">
        {artwork.mediaType === 'video' ? (
          <>
            <video
              src={artwork.imageUrl}
              muted
              preload="metadata"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
            <div className="absolute left-3 top-3 flex items-center gap-1 rounded-sm bg-black/50 px-2 py-0.5 backdrop-blur-sm">
              <Film size={12} strokeWidth={1.5} className="text-white" />
              <span className="text-[9px] font-medium tracking-widest text-white">
                VIDEO
              </span>
            </div>
          </>
        ) : (
          <Image
            src={artwork.imageUrl}
            alt={artwork.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        )}
        {/* Actions overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <Button
            size="icon"
            variant="outline"
            className="h-9 w-9 bg-background/90 backdrop-blur-sm"
            onClick={() => onEdit(artwork)}
            aria-label={`编辑 ${artwork.title}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-9 w-9 bg-background/90 backdrop-blur-sm text-destructive hover:text-destructive"
            onClick={() => onDelete(artwork)}
            aria-label={`删除 ${artwork.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="p-3 space-y-1">
        <p className="text-sm font-medium truncate">{artwork.title}</p>
        <p className="text-xs text-muted-foreground truncate">
          {series?.titleZh || category?.nameZh || '未分类'}
        </p>
        <p className="text-[11px] text-muted-foreground/80 tnum">
          {artwork.quality && (
            <span className="inline-flex items-center rounded-sm bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              {artwork.quality}
            </span>
          )}
          {artwork.width && artwork.height && (
            <span className="ml-2">
              {artwork.width}×{artwork.height}
            </span>
          )}
          {artwork.durationSeconds != null && artwork.durationSeconds > 0 && (
            <span className="ml-2">
              {formatDuration(artwork.durationSeconds)}
            </span>
          )}
          {artwork.fps != null && artwork.fps > 0 && (
            <span className="ml-2">{artwork.fps}fps</span>
          )}
        </p>
      </div>
    </div>
  );
};

/* ---------- Main Page ---------- */

const AdminPage: React.FC = () => {
  const queryClient = useQueryClient();
  const logoutMutation = useAdminLogout();
  const location = useLocation();
  const navigate = useNavigate();
  const adminSegments = location.pathname
    .replace(/^\/admin\/?/, '')
    .split('/')
    .filter(Boolean);
  const adminSection = adminSegments[0] ?? '';
  const adminSubsection = adminSegments[1] ?? '';
  const uploadSection:
    | 'image'
    | 'video'
    | 'hero-video'
    | 'hero-image'
    | null =
    adminSection === 'upload' &&
    ['image', 'video', 'hero', 'hero-video', 'hero-image'].includes(
      adminSubsection,
    )
      ? adminSubsection === 'hero'
        ? 'hero-image'
        : (adminSubsection as
            | 'image'
            | 'video'
            | 'hero-video'
            | 'hero-image')
      : null;
  const copySection:
    | 'homepage'
    | 'profile'
    | 'timeline'
    | 'cooperation'
    | null =
    adminSection === 'copy' &&
    ['homepage', 'profile', 'timeline', 'cooperation'].includes(adminSubsection)
      ? (adminSubsection as
          | 'homepage'
          | 'profile'
          | 'timeline'
          | 'cooperation')
      : null;
  const [subTab, setSubTab] = useState<'artworks' | 'series' | 'categories'>('artworks');

  // Filters
  const [filterSeriesId, setFilterSeriesId] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState('');

  // Reset filters when switching between image/video sections
  useEffect(() => {
    if (uploadSection === 'image' || uploadSection === 'video') {
      setFilterSeriesId('');
      setFilterCategoryId('');
      setSubTab('artworks');
    }
  }, [uploadSection]);

  useEffect(() => {
    if (!adminSection) return;

    let target = '';
    if (adminSection === 'upload' && uploadSection) return;
    if (adminSection === 'copy' && copySection) return;
    if (adminSection === 'settings' && !adminSubsection) return;

    if (adminSection === 'upload') {
      target = '/admin/upload/image';
    } else if (adminSection === 'copy') {
      target = '/admin/copy/homepage';
    } else if (adminSection === 'settings') {
      target = '/admin/settings';
    } else {
      target = '/admin';
    }

    if (location.pathname !== target) {
      navigate(target, { replace: true });
    }
  }, [
    adminSection,
    adminSubsection,
    copySection,
    location.pathname,
    navigate,
    uploadSection,
  ]);

  useEffect(() => {
    document.body.classList.add('admin-theme');
    return () => document.body.classList.remove('admin-theme');
  }, []);

  // Artwork dialog state
  const [artworkDialogOpen, setArtworkDialogOpen] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [initialArtworkFile, setInitialArtworkFile] = useState<File | null>(null);
  const [uploadZoneDragging, setUploadZoneDragging] = useState(false);

  // Series dialog state
  const [seriesDialogOpen, setSeriesDialogOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);

  // Category dialog state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [managedCollection, setManagedCollection] =
    useState<ManagedCollection | null>(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<
    | { type: 'artwork'; item: Artwork }
    | { type: 'series'; item: Series }
    | { type: 'category'; item: Category }
    | null
  >(null);

  /* --- Queries --- */

  const currentMediaType: 'image' | 'video' | null =
    uploadSection === 'image' || uploadSection === 'video'
      ? uploadSection
      : null;

  const { data: seriesData, isLoading: seriesLoading } = useQuery({
    queryKey: ['series-list', currentMediaType],
    queryFn: () => portfolio.getSeriesList(currentMediaType ?? undefined),
    enabled: currentMediaType !== null,
  });

  const { data: categoryData, isLoading: categoryLoading } = useQuery({
    queryKey: ['category-list', currentMediaType],
    queryFn: () => portfolio.getCategoryList(currentMediaType ?? undefined),
    enabled: currentMediaType !== null,
  });

  const { data: allCategoryData, isLoading: allCategoryLoading } = useQuery({
    queryKey: ['category-list', 'all'],
    queryFn: () => portfolio.getCategoryList(),
    staleTime: 5 * 60 * 1000,
  });

  const managedMediaType =
    managedCollection?.item.mediaType ?? currentMediaType;
  const { data: managerSeriesData } = useQuery({
    queryKey: ['series-list', managedMediaType],
    queryFn: () => portfolio.getSeriesList(managedMediaType ?? undefined),
    enabled: managedMediaType !== null,
  });
  const { data: managerCategoryData } = useQuery({
    queryKey: ['category-list', managedMediaType],
    queryFn: () => portfolio.getCategoryList(managedMediaType ?? undefined),
    enabled: managedMediaType !== null,
  });
  const {
    data: managerArtworkData,
    isLoading: managerArtworksLoading,
  } = useQuery({
    queryKey: ['artworks', 'collection-manager', managedMediaType],
    queryFn: () =>
      portfolio.getArtworks({
        mediaType: managedMediaType ?? undefined,
        limit: 200,
      }),
    enabled: managedMediaType !== null && !!managedCollection,
  });

  const {
    data: artworksData,
    isLoading: artworksLoading,
    refetch: refetchArtworks,
  } = useQuery({
    queryKey: ['artworks', currentMediaType, filterSeriesId, filterCategoryId],
    queryFn: () =>
      portfolio.getArtworks({
        seriesId: filterSeriesId || undefined,
        categoryId: filterCategoryId || undefined,
        mediaType: currentMediaType ?? undefined,
        limit: 100,
      }),
    enabled: currentMediaType !== null,
  });

  const seriesList = seriesData?.items || [];
  const categoryList = categoryData?.items || [];
  const artworks = artworksData?.items || [];
  const managerArtworks = managerArtworkData?.items || [];

  const seriesMap = new Map(seriesList.map((s: Series) => [s.id, s]));
  const categoryMap = new Map(categoryList.map((c: Category) => [c.id, c]));
  const managerSeriesMap = new Map(
    (managerSeriesData?.items || []).map((s: Series) => [s.id, s]),
  );
  const managerCategoryMap = new Map(
    (managerCategoryData?.items || []).map((c: Category) => [c.id, c]),
  );

  /* --- Mutations --- */

  const createArtworkMutation = useMutation({
    mutationFn: async (body: CreateArtworkRequest) =>
      portfolio.createArtwork(body),
    retry: false,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['artworks'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      if (data.mediaType === 'video') {
        queryClient.invalidateQueries({ queryKey: ['portfolio', 'featured-videos'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['portfolio', 'featured-images'] });
      }
      queryClient.invalidateQueries({ queryKey: ['portfolio', 'featured-series'] });
      queryClient.invalidateQueries({ queryKey: ['category-list'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(`「${data.title}」已上线，首页可见`);
    },
  });

  const updateArtworkMutation = useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: UpdateArtworkRequest;
    }) => portfolio.updateArtwork(id, body),
    retry: false,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['artworks'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio', 'featured-images'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio', 'featured-videos'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio', 'featured-series'] });
      queryClient.invalidateQueries({ queryKey: ['category-list'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(`「${data.title}」已更新`);
    },
  });

  const assignArtworksMutation = useMutation({
    mutationFn: portfolio.assignArtworks,
    retry: false,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['artworks'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category-list'] });
      queryClient.invalidateQueries({ queryKey: ['series-list'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio', 'featured-series'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio', 'featured-images'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio', 'featured-videos'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success(`已调整 ${data.updated} 个作品的归类`);
    },
  });

  const deleteArtworkMutation = useMutation({
    mutationFn: async (id: string) => portfolio.deleteArtwork(id),
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artworks'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio', 'featured-images'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio', 'featured-videos'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio', 'featured-series'] });
      queryClient.invalidateQueries({ queryKey: ['category-list'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('作品已删除，首页已同步移除');
    },
  });

  const createSeriesMutation = useMutation({
    mutationFn: async (body: CreateSeriesRequest) =>
      portfolio.createSeries(body),
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['series-list'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio', 'featured-series'] });
      toast.success('系列已创建');
    },
  });

  const updateSeriesMutation = useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: UpdateSeriesRequest;
    }) => portfolio.updateSeries(id, body),
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['series-list'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio', 'featured-series'] });
      toast.success('系列已更新');
    },
  });

  const deleteSeriesMutation = useMutation({
    mutationFn: async (id: string) => portfolio.deleteSeries(id),
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['series-list'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['artworks'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio', 'featured-series'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio', 'featured-images'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio', 'featured-videos'] });
      toast.success('系列已删除');
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (body: CreateCategoryRequest) =>
      portfolio.createCategory(body),
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-list'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('分类已创建');
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: UpdateCategoryRequest;
    }) => portfolio.updateCategory(id, body),
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-list'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('分类已更新');
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => portfolio.deleteCategory(id),
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-list'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['artworks'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio', 'featured-images'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio', 'featured-videos'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('分类已删除');
    },
  });

  /* --- Handlers --- */

  const { uploadFile } = useUploadFile();

  const handleCreateArtwork = async (
    body: CreateArtworkRequest,
    file: File,
    rawFile: File | null,
  ) => {
    const imageUrl = await uploadFile(file);
    let rawFileUrl: string | undefined;
    if (rawFile) {
      rawFileUrl = await uploadFile(rawFile);
    }
    await createArtworkMutation.mutateAsync({
      ...body,
      imageUrl,
      rawFileUrl,
    });
  };

  const handleUpdateArtwork = async (id: string, body: UpdateArtworkRequest) => {
    await updateArtworkMutation.mutateAsync({ id, body });
  };

  const handleCreateSeries = async (body: CreateSeriesRequest) => {
    await createSeriesMutation.mutateAsync(body);
  };

  const handleUpdateSeries = async (body: UpdateSeriesRequest) => {
    if (!editingSeries) return;
    await updateSeriesMutation.mutateAsync({ id: editingSeries.id, body });
  };

  const handleCreateCategory = async (body: CreateCategoryRequest) => {
    await createCategoryMutation.mutateAsync(body);
  };

  const handleUpdateCategory = async (body: UpdateCategoryRequest) => {
    if (!editingCategory) return;
    await updateCategoryMutation.mutateAsync({ id: editingCategory.id, body });
  };

  const handleAssignCollectionArtworks = async (
    ids: string[],
    targetId: string | null,
  ) => {
    if (!managedCollection) return;
    await assignArtworksMutation.mutateAsync({
      ids,
      targetType: managedCollection.kind,
      targetId,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'artwork') {
        await deleteArtworkMutation.mutateAsync(deleteTarget.item.id);
      } else if (deleteTarget.type === 'series') {
        await deleteSeriesMutation.mutateAsync(deleteTarget.item.id);
      } else {
        await deleteCategoryMutation.mutateAsync(deleteTarget.item.id);
      }
    } catch (err) {
      logger.error('删除失败', err);
      toast.error(getErrMsg(err));
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <div className="admin-page min-h-screen bg-background text-foreground">
        <div className="admin-shell mx-auto px-4 py-6 sm:px-6 sm:py-8">
          {/* Header */}
          <header className="admin-topbar flex items-center justify-between gap-4">
            <Link
              to="/admin"
              className="flex items-center gap-3 text-foreground transition-opacity hover:opacity-80"
              aria-label="返回管理首页"
            >
              <ShutterLogo size={34} />
              <span>
                <span className="block text-sm font-semibold tracking-[0.12em]">
                  光影诗篇
                </span>
              </span>
            </Link>
            <Button
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="admin-logout-button"
            >
              <LogOut className="h-4 w-4 mr-2" />
              退出登录
            </Button>
          </header>

          {!adminSection ? (
            <section className="admin-landing">
              <div className="admin-landing-heading">
                <h1>选择管理功能</h1>
                <p>进入对应页面完成上传、文案维护或站点配置</p>
              </div>
              <div className="admin-landing-grid">
                <Link
                  to="/admin/upload/image"
                  className="admin-landing-card"
                >
                  <span className="admin-landing-index">01</span>
                  <Upload className="h-8 w-8" />
                  <h2>上传</h2>
                  <p>图片作品、视频作品与首页视频/图片双通道</p>
                  <span className="admin-card-action">进入上传页面 →</span>
                </Link>
                <Link
                  to="/admin/copy/homepage"
                  className="admin-landing-card"
                >
                  <span className="admin-landing-index">02</span>
                  <Pencil className="h-8 w-8" />
                  <h2>文案</h2>
                  <p>首页文案、个人档案、时间历程与商业合作</p>
                  <span className="admin-card-action">进入文案页面 →</span>
                </Link>
                <Link
                  to="/admin/settings"
                  className="admin-landing-card"
                >
                  <span className="admin-landing-index">03</span>
                  <Settings className="h-8 w-8" />
                  <h2>站点设置</h2>
                  <p>联系方式、媒体存储与管理员密码</p>
                  <span className="admin-card-action">进入设置页面 →</span>
                </Link>
              </div>
            </section>
          ) : (
            <>
              <div className="admin-subpage-heading">
                <Link to="/admin" className="admin-back-link">
                  ← 返回管理首页
                </Link>
                <div>
                  <h1>
                    {adminSection === 'upload'
                      ? '上传管理'
                      : adminSection === 'copy'
                        ? '文案管理'
                        : '站点设置'}
                  </h1>
                </div>
              </div>

              {adminSection === 'upload' && (
              <nav className="admin-section-nav" aria-label="上传类型">
              <Link
                to="/admin/upload/image"
                className={cn(
                  uploadSection === 'image' && 'is-active',
                )}
              >
                <ImageIcon className="h-4 w-4" />
                图片作品
              </Link>
              <Link
                to="/admin/upload/video"
                className={cn(
                  uploadSection === 'video' && 'is-active',
                )}
              >
                <Film className="h-4 w-4" />
                视频作品
              </Link>
              <Link
                to="/admin/upload/hero-video"
                className={cn(
                  uploadSection === 'hero-video' && 'is-active',
                )}
              >
                <Film className="h-4 w-4" />
                首页视频
              </Link>
              <Link
                to="/admin/upload/hero-image"
                className={cn(
                  uploadSection === 'hero-image' && 'is-active',
                )}
              >
                <Images className="h-4 w-4" />
                首页图片
              </Link>
              </nav>
              )}

              {adminSection === 'copy' && (
              <nav className="admin-section-nav" aria-label="文案页面">
              <Link
                to="/admin/copy/homepage"
                className={cn(copySection === 'homepage' && 'is-active')}
              >
                <Pencil className="h-4 w-4" />
                首页文案
              </Link>
              <Link
                to="/admin/copy/profile"
                className={cn(copySection === 'profile' && 'is-active')}
              >
                <UserIcon className="h-4 w-4" />
                个人档案
              </Link>
              <Link
                to="/admin/copy/timeline"
                className={cn(copySection === 'timeline' && 'is-active')}
              >
                <History className="h-4 w-4" />
                时间历程
              </Link>
              <Link
                to="/admin/copy/cooperation"
                className={cn(
                  copySection === 'cooperation' && 'is-active',
                )}
              >
                <Handshake className="h-4 w-4" />
                商业合作
              </Link>
              </nav>
              )}
            </>
          )}

          {/* Route content: only the page matching the current URL is mounted. */}
          <div
            key={location.pathname}
            className="admin-route-page relative mt-5 sm:mt-6"
          >
              {adminSection === 'upload' &&
                uploadSection &&
                uploadSection !== 'hero-video' &&
                uploadSection !== 'hero-image' && (
                <div key={uploadSection}>
                  <div
                    className={cn(
                      'admin-upload-zone transition-colors',
                      uploadZoneDragging && 'border-primary bg-primary/[0.04]',
                    )}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setUploadZoneDragging(true);
                    }}
                    onDragLeave={() => setUploadZoneDragging(false)}
                    onDrop={(event) => {
                      event.preventDefault();
                      setUploadZoneDragging(false);
                      const file = event.dataTransfer.files?.[0];
                      if (!file) return;
                      const expectedType =
                        uploadSection === 'video' ? 'video' : 'image';
                      const validationError = validateFile(file, expectedType);
                      if (validationError) {
                        toast.error(validationError);
                        return;
                      }
                      setInitialArtworkFile(file);
                      setEditingArtwork(null);
                      setArtworkDialogOpen(true);
                    }}
                  >
                    <span className="admin-upload-icon">
                      {uploadSection === 'video' ? (
                        <Film className="h-7 w-7" />
                      ) : (
                        <ImageIcon className="h-7 w-7" />
                      )}
                    </span>
                    <h2>
                      {uploadSection === 'video'
                        ? '上传视频作品'
                        : '上传图片作品'}
                    </h2>
                    <p>
                      {uploadSection === 'video'
                        ? '支持 MP4、MOV、WebM，单个视频不超过 100 MB；也可以直接拖拽到这里'
                        : '支持 JPG、PNG、WebP、AVIF、GIF，单张图片不超过 20 MB；也可以直接拖拽到这里'}
                    </p>
                    <div className="mt-8 flex flex-wrap justify-center gap-4">
                      <Button
                        className="admin-primary-button min-w-36"
                        onClick={() => {
                          setInitialArtworkFile(null);
                          setEditingArtwork(null);
                          setArtworkDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        选择文件
                      </Button>
                      <Button
                        variant="outline"
                        className="admin-secondary-button min-w-36"
                        onDragOver={(event) => {
                          event.preventDefault();
                          setUploadZoneDragging(true);
                        }}
                        onClick={() => setBatchDialogOpen(true)}
                      >
                        <Files className="h-4 w-4 mr-2" />
                        批量选择
                      </Button>
                    </div>
                  </div>

                  {/* Sub tabs */}
                  <Tabs
                    value={subTab}
                    onValueChange={(v) => setSubTab(v as 'artworks' | 'series' | 'categories')}
                    className="w-full"
                  >
                    <TabsList className="bg-muted/40 h-auto p-1">
                      <TabsTrigger
                        value="artworks"
                        className="px-4 py-1.5 text-sm data-[state=active]:bg-background"
                      >
                        作品管理
                      </TabsTrigger>
                      <TabsTrigger
                        value="series"
                        className="px-4 py-1.5 text-sm data-[state=active]:bg-background"
                      >
                        <Star className="h-3.5 w-3.5 mr-1.5" />
                        系列管理
                      </TabsTrigger>
                      <TabsTrigger
                        value="categories"
                        className="px-4 py-1.5 text-sm data-[state=active]:bg-background"
                      >
                        <GripVertical className="h-3.5 w-3.5 mr-1.5" />
                        分类管理
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {/* Sub tab content */}
                  <div className="relative mt-10">
                      {subTab === 'artworks' && (
                      <div className="admin-subpage">
                        {/* Toolbar */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">
                              {uploadSection === 'video'
                                ? '视频作品管理'
                                : '图片作品管理'}
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                              管理已发布作品、系列和分类
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">系列：</span>
                              <Select
                                value={filterSeriesId}
                                onValueChange={setFilterSeriesId}
                              >
                                <SelectTrigger className="w-36">
                                  <SelectValue placeholder="全部" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">全部</SelectItem>
                                  {seriesList.map((s: Series) => (
                                    <SelectItem key={s.id} value={s.id}>
                                      {s.titleZh}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">分类：</span>
                              <Select
                                value={filterCategoryId}
                                onValueChange={setFilterCategoryId}
                              >
                                <SelectTrigger className="w-36">
                                  <SelectValue placeholder="全部" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">全部</SelectItem>
                                  {categoryList.map((c: Category) => (
                                    <SelectItem key={c.id} value={c.id}>
                                      {c.nameZh}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        {/* Artwork grid */}
                        {artworksLoading ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {Array.from({ length: 6 }).map((_, i) => (
                              <div key={i} className="space-y-2">
                                <Skeleton className="w-full aspect-[4/3] rounded-md" />
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                              </div>
                            ))}
                          </div>
                        ) : artworks.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-20 text-center">
                            <ImageIcon className="h-12 w-12 text-muted-foreground/40 mb-3" />
                            <p className="text-muted-foreground">暂无作品</p>
                            <p className="text-xs text-muted-foreground/70 mt-1">
                              点击「上传作品」添加你的第一张作品
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {artworks.map((artwork: Artwork) => (
                              <ArtworkCard
                                key={artwork.id}
                                artwork={artwork}
                                seriesMap={seriesMap}
                                categoryMap={categoryMap}
                                onEdit={(a) => {
                                  setInitialArtworkFile(null);
                                  setEditingArtwork(a);
                                  setArtworkDialogOpen(true);
                                }}
                                onDelete={(a) =>
                                  setDeleteTarget({ type: 'artwork', item: a })
                                }
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      )}

                      {subTab === 'series' && (
                      <div className="admin-subpage">
                        <div className="flex justify-between items-center mb-6">
                          <h2 className="font-display text-2xl">系列列表</h2>
                          <Button
                            onClick={() => {
                              setEditingSeries(null);
                              setSeriesDialogOpen(true);
                            }}
                          >
                            <Plus className="h-4 w-4" />
                            新建系列
                          </Button>
                        </div>

                        {seriesLoading ? (
                          <div className="space-y-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-4 p-3 border border-border rounded-md"
                              >
                                <Skeleton className="w-16 h-20 rounded-sm shrink-0" />
                                <div className="flex-1 space-y-2">
                                  <Skeleton className="h-5 w-1/3" />
                                  <Skeleton className="h-3 w-1/4" />
                                </div>
                                <Skeleton className="w-20 h-8 rounded-md" />
                              </div>
                            ))}
                          </div>
                        ) : seriesList.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-md">
                            <Star className="h-12 w-12 text-muted-foreground/40 mb-3" />
                            <p className="text-muted-foreground">暂无系列</p>
                            <p className="text-xs text-muted-foreground/70 mt-1">
                              创建系列来组织你的长期摄影项目
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {seriesList.map((series: Series) => (
                              <div
                                key={series.id}
                                className="flex items-center gap-4 p-3 border border-border rounded-md hover:border-primary/50 hover:-translate-y-px transition-all duration-300 bg-card"
                              >
                                <div className="w-16 h-20 shrink-0 overflow-hidden rounded-sm bg-muted/30 relative">
                                  {series.coverUrl ? (
                                    <Image
                                      src={series.coverUrl}
                                      alt={series.titleZh}
                                      fill
                                      sizes="64px"
                                      className="object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium truncate">
                                      {series.titleZh}
                                    </span>
                                    {series.isFeatured && (
                                      <span className="inline-flex items-center text-[10px] text-gold-foreground bg-gold/20 px-1.5 py-0.5 rounded-sm">
                                        精选
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                    {series.titleEn}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {series.yearStart || '—'}
                                    {series.yearEnd ? ` – ${series.yearEnd}` : ''}
                                    <span className="mx-2">·</span>
                                    {series.artworkCount || 0} 幅作品
                                  </p>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="mr-1 h-8 gap-1.5 px-2.5 text-xs"
                                    onClick={() =>
                                      setManagedCollection({
                                        kind: 'series',
                                        item: series,
                                      })
                                    }
                                  >
                                    <Images className="h-3.5 w-3.5" />
                                    管理作品
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingSeries(series);
                                      setSeriesDialogOpen(true);
                                    }}
                                    aria-label={`编辑系列 ${series.titleZh}`}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() =>
                                      setDeleteTarget({ type: 'series', item: series })
                                    }
                                    aria-label={`删除系列 ${series.titleZh}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      )}

                      {subTab === 'categories' && (
                      <div className="admin-subpage">
                        <div className="flex justify-between items-center mb-6">
                          <h2 className="font-display text-2xl">分类列表</h2>
                          <Button
                            onClick={() => {
                              setEditingCategory(null);
                              setCategoryDialogOpen(true);
                            }}
                          >
                            <Plus className="h-4 w-4" />
                            新建分类
                          </Button>
                        </div>

                        {allCategoryLoading ? (
                          <div className="space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-4 p-3 border border-border rounded-md"
                              >
                                <Skeleton className="w-24 h-14 rounded-sm shrink-0" />
                                <div className="flex-1 space-y-2">
                                  <Skeleton className="h-5 w-1/3" />
                                  <Skeleton className="h-3 w-1/4" />
                                </div>
                                <Skeleton className="w-20 h-8 rounded-md" />
                              </div>
                            ))}
                          </div>
                        ) : !allCategoryData || allCategoryData.items.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-md">
                            <GripVertical className="h-12 w-12 text-muted-foreground/40 mb-3" />
                            <p className="text-muted-foreground">暂无分类</p>
                            <p className="text-xs text-muted-foreground/70 mt-1">
                              创建分类来组织不同主题的作品
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-8">
                            {(['image', 'video'] as const).map((mt) => {
                              const items = allCategoryData.items.filter((c: Category) => c.mediaType === mt);
                              if (items.length === 0) return null;
                              return (
                                <div key={mt} className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-display text-lg text-foreground">
                                      {mt === 'image' ? '图片分类' : '视频分类'}
                                    </h3>
                                    <span className="text-xs text-muted-foreground">
                                      {items.length} 个
                                    </span>
                                  </div>
                                  <div className="space-y-2">
                                    {items.map((category: Category) => (
                                      <div
                                        key={category.id}
                                        className="flex items-center gap-4 p-3 border border-border rounded-md hover:border-primary/50 hover:-translate-y-px transition-all duration-300 bg-card"
                                      >
                                        <div className="w-24 h-14 shrink-0 overflow-hidden rounded-sm bg-muted/30 relative">
                                          {category.coverUrl ? (
                                            <Image
                                              src={category.coverUrl}
                                              alt={category.nameZh}
                                              fill
                                              sizes="96px"
                                              className="object-cover"
                                            />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                              <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium truncate">{category.nameZh}</p>
                                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                            {category.nameEn}
                                          </p>
                                          <p className="text-xs text-muted-foreground mt-1">
                                            {category.artworkCount || 0} 幅作品
                                          </p>
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="mr-1 h-8 gap-1.5 px-2.5 text-xs"
                                            onClick={() =>
                                              setManagedCollection({
                                                kind: 'category',
                                                item: category,
                                              })
                                            }
                                          >
                                            <Images className="h-3.5 w-3.5" />
                                            管理作品
                                          </Button>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => {
                                              setEditingCategory(category);
                                              setCategoryDialogOpen(true);
                                            }}
                                            aria-label={`编辑分类 ${category.nameZh}`}
                                          >
                                            <Pencil className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() =>
                                              setDeleteTarget({
                                                type: 'category',
                                                item: category,
                                              })
                                            }
                                            aria-label={`删除分类 ${category.nameZh}`}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      )}
                  </div>
                </div>
              )}

              {adminSection === 'settings' && (
              <div>
                <div className="admin-content-panel space-y-16">
                  <SiteSettingsPanel />
                  <StorageSettingsPanel />
                  <PasswordSettingsPanel />
                </div>
              </div>
              )}

              {(uploadSection === 'hero-video' ||
                uploadSection === 'hero-image') && (
              <div>
                <div className="admin-content-panel admin-hero-upload-page">
                  <HeroCarouselPanel
                    key={uploadSection}
                    mediaType={
                      uploadSection === 'hero-video' ? 'video' : 'image'
                    }
                  />
                </div>
              </div>
              )}

              {adminSection === 'copy' && (
              <div>
                {copySection === 'homepage' && <HomepageCopyPanel />}
                {copySection === 'profile' && <ProfileCopyPanel />}
                {copySection === 'timeline' && <TimelineCopyPanel />}
                {copySection === 'cooperation' && <CooperationPanel />}
              </div>
              )}
          </div>
        </div>

        {/* Artwork dialog */}
        <ArtworkDialog
          open={artworkDialogOpen}
          onOpenChange={(open) => {
            setArtworkDialogOpen(open);
            if (!open) setInitialArtworkFile(null);
          }}
          editItem={editingArtwork}
          initialFile={initialArtworkFile}
          mediaType={uploadSection === 'video' ? 'video' : 'image'}
          seriesList={seriesList}
          categoryList={categoryList}
          onCreate={handleCreateArtwork}
          onUpdate={handleUpdateArtwork}
        />

        <BatchArtworkDialog
          open={batchDialogOpen}
          onOpenChange={setBatchDialogOpen}
          mediaType={uploadSection === 'video' ? 'video' : 'image'}
          seriesList={seriesList}
          categoryList={categoryList}
          onUpload={(body, file) =>
            handleCreateArtwork(body, file, null)
          }
        />

        {/* Series dialog */}
        <SeriesDialog
          open={seriesDialogOpen}
          onOpenChange={setSeriesDialogOpen}
          editItem={editingSeries}
          defaultMediaType={
            uploadSection === 'video' ? 'video' : 'image'
          }
          onSubmit={editingSeries ? handleUpdateSeries : handleCreateSeries}
        />

        {/* Category dialog */}
        <CategoryDialog
          open={categoryDialogOpen}
          onOpenChange={setCategoryDialogOpen}
          editItem={editingCategory}
          defaultMediaType={
            uploadSection === 'video' ? 'video' : 'image'
          }
          onSubmit={
            editingCategory ? handleUpdateCategory : handleCreateCategory
          }
        />

        <CollectionArtworkManager
          selection={managedCollection}
          artworks={managerArtworks}
          seriesMap={managerSeriesMap}
          categoryMap={managerCategoryMap}
          loading={managerArtworksLoading}
          onOpenChange={(open) => {
            if (!open) setManagedCollection(null);
          }}
          onAssign={handleAssignCollectionArtworks}
        />

        {/* Delete confirm dialog */}
        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display text-xl">
                确认删除
              </AlertDialogTitle>
              <AlertDialogDescription>
                {deleteTarget?.type === 'artwork' && (
                  <>
                    确定要删除作品「{deleteTarget.item.title}」吗？
                    <br />
                    此操作不可撤销。
                  </>
                )}
                {deleteTarget?.type === 'series' && (
                  <>
                    确定要删除系列「
                    {(deleteTarget.item as Series).titleZh}」吗？
                    <br />
                    系列下的作品不会被删除，但会失去系列关联。
                  </>
                )}
                {deleteTarget?.type === 'category' && (
                  <>
                    确定要删除分类「
                    {(deleteTarget.item as Category).nameZh}」吗？
                    <br />
                    分类下的作品不会被删除，但会失去分类关联。
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground border-destructive-border"
                onClick={handleDeleteConfirm}
              >
                确认删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <style>{`
        .admin-page [data-slot="button"] {
          transition: color 0.2s ease, border-color 0.2s ease;
        }
        .admin-page [data-slot="button"].border:not([class*="bg-"]).hover-elevate:hover::after {
          background-color: hsl(42 75% 58% / 0.1);
        }
        .admin-page [data-slot="button"].border:not([class*="bg-"]):not(.border-transparent):hover {
          border-color: hsl(42 75% 58%);
          color: hsl(42 75% 58%);
        }
        .admin-page [data-slot="button"].border:not([class*="bg-"]):not(.border-transparent):hover svg {
          color: hsl(42 75% 58%);
        }
        .admin-page [data-slot="button"].border-transparent:hover {
          color: hsl(42 75% 58%);
        }
        .admin-page [data-slot="button"].border-transparent:hover svg {
          color: hsl(42 75% 58%);
        }
        .admin-page [data-slot="tabs-trigger"] {
          transition: color 0.2s ease;
        }
        .admin-page [data-slot="tabs-trigger"]:hover {
          color: hsl(42 75% 58%);
        }
        .admin-page [data-slot="tabs-trigger"]:hover svg {
          color: hsl(42 75% 58%);
        }
        .admin-page [data-slot="tabs-trigger"][data-state="active"] {
          color: hsl(42 75% 58%);
        }
        .admin-page [data-slot="tabs-trigger"][data-state="active"] svg {
          color: hsl(42 75% 58%);
        }
        .admin-page [data-slot="tabs-trigger"][data-state="active"] {
          box-shadow: inset 0 -2px 0 hsl(42 75% 58%);
          background-color: hsl(42 75% 58% / 0.06);
        }
      `}</style>
    </>
  );
};

export default AdminPage;
