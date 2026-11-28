import exifr from 'exifr';

export const RAW_EXTENSIONS = ['arw', 'cr2', 'cr3', 'nef', 'dng', 'rw2', 'orf', 'raf', 'pef', 'srw'];

export function isRawFile(file: File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  return RAW_EXTENSIONS.includes(ext);
}

export async function extractRawPreview(file: File): Promise<Blob | null> {
  try {
    const thumbnail = await exifr.thumbnailUrl(file);
    if (!thumbnail) return null;
    const res = await fetch(thumbnail);
    return await res.blob();
  } catch {
    return null;
  }
}

export type MediaQuality = '8K' | '4K' | 'FHD' | 'HD';

export interface MediaMetadata {
  width: number;
  height: number;
  durationSeconds?: number;
  fps?: number;
  quality: MediaQuality;
  fileSize?: number;
  cameraModel?: string;
  lensModel?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: number;
  focalLength?: string;
  exposureCompensation?: string;
  whiteBalance?: string;
  takenAt?: string;
  location?: string;
}

function getImageQuality(width: number): MediaQuality {
  if (width >= 7680) return '8K';
  if (width >= 3840) return '4K';
  if (width >= 1920) return 'FHD';
  return 'HD';
}

function getVideoQuality(width: number): MediaQuality {
  if (width >= 3840) return '4K';
  if (width >= 1920) return 'FHD';
  return 'HD';
}

function formatAperture(value: number | undefined): string | undefined {
  if (value === undefined || value === null) return undefined;
  return `f/${value}`;
}

function formatShutterSpeed(value: number | undefined): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (value >= 1) {
    return `${value}s`;
  }
  const denom = Math.round(1 / value);
  return `1/${denom}s`;
}

function formatFocalLength(value: number | undefined): string | undefined {
  if (value === undefined || value === null) return undefined;
  return `${Math.round(value)}mm`;
}

function formatExposureComp(value: number | undefined): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (value === 0) return '0 EV';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value} EV`;
}

function formatWhiteBalance(
  wb: number | undefined,
  mode: string | undefined,
): string | undefined {
  if (mode) {
    const modeStr = String(mode);
    if (modeStr === 'Auto' || modeStr === '0') return '自动';
    if (modeStr === 'Daylight' || modeStr === '1') return '日光';
    if (modeStr === 'Cloudy' || modeStr === '2') return '阴天';
    if (modeStr === 'Tungsten' || modeStr === '3') return '钨丝灯';
    if (modeStr === 'Fluorescent' || modeStr === '4') return '荧光灯';
    if (modeStr === 'Flash' || modeStr === '5') return '闪光灯';
    if (modeStr === 'Manual' || modeStr === '7') return '手动';
  }
  if (wb !== undefined && wb !== null) {
    return `${Math.round(wb)}K`;
  }
  return undefined;
}

function formatTakenAt(value: Date | string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const d = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(d.getTime())) return undefined;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch {
    return undefined;
  }
}

export async function readImageMetadata(file: File): Promise<MediaMetadata> {
  const raw = isRawFile(file);

  const getSizeFromExif = async (): Promise<{ width: number; height: number } | null> => {
    try {
      const exif = await exifr.parse(file, ['ImageWidth', 'ImageHeight', 'ExifImageWidth', 'ExifImageHeight']);
      const w = exif?.ExifImageWidth ?? exif?.ImageWidth;
      const h = exif?.ExifImageHeight ?? exif?.ImageHeight;
      if (w && h) return { width: w, height: h };
    } catch {
      // ignore
    }
    return null;
  };

  const base: MediaMetadata = raw
    ? await getSizeFromExif().then((size) => ({
        width: size?.width ?? 0,
        height: size?.height ?? 0,
        quality: size ? getImageQuality(size.width) : 'HD',
        fileSize: file.size,
      }))
    : await new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve({
            width: img.naturalWidth,
            height: img.naturalHeight,
            quality: getImageQuality(img.naturalWidth),
            fileSize: file.size,
          });
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('无法读取图片尺寸'));
        };
        img.src = url;
      });

  try {
    const exif = await exifr.parse(file);
    if (exif) {
      if (exif.Make || exif.Model) {
        base.cameraModel = [exif.Make, exif.Model].filter(Boolean).join(' ').trim();
      }
      if (exif.LensModel || exif.LensMake) {
        base.lensModel = [exif.LensMake, exif.LensModel].filter(Boolean).join(' ').trim() || undefined;
      }
      base.aperture = formatAperture(exif.FNumber ?? exif.ApertureValue);
      base.shutterSpeed = formatShutterSpeed(
        exif.ExposureTime ?? exif.ShutterSpeedValue,
      );
      base.iso = exif.ISO ?? undefined;
      base.focalLength = formatFocalLength(exif.FocalLength);
      base.exposureCompensation = formatExposureComp(exif.ExposureCompensation);
      base.whiteBalance = formatWhiteBalance(
        exif.ColorTemperature,
        exif.WhiteBalance !== undefined ? String(exif.WhiteBalance) : undefined,
      );
      const takenDate = exif.DateTimeOriginal ?? exif.DateTime ?? exif.CreateDate;
      base.takenAt = formatTakenAt(takenDate);
      if (exif.latitude && exif.longitude) {
        base.location = `${exif.latitude.toFixed(4)}, ${exif.longitude.toFixed(4)}`;
      }
    }
  } catch {
    // EXIF 读取失败不影响基础元数据
  }

  return base;
}

export function readVideoMetadata(file: File): Promise<MediaMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    const url = URL.createObjectURL(file);

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.removeAttribute('src');
      video.load();
    };

    let resolved = false;
    const done = (result: MediaMetadata) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      resolve(result);
    };

    video.onloadedmetadata = () => {
      const width = video.videoWidth;
      const height = video.videoHeight;
      const duration = isFinite(video.duration) ? video.duration : undefined;
      done({
        width,
        height,
        durationSeconds: duration,
        quality: getVideoQuality(width),
        fileSize: file.size,
      });
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('无法读取视频元数据'));
    };

    video.src = url;
  });
}

export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0 || !isFinite(seconds)) return '';
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (hours > 0) return `${hours}:${pad(mins)}:${pad(secs)}`;
  return `${pad(mins)}:${pad(secs)}`;
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${bytes} B`;
}
