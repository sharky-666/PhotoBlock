import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Compass, Film, Layers, Mountain, X } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { getArtworks, getLocationMarkers } from '@client/src/api/portfolio';
import type { Artwork, LocationMarker } from '@shared/api.interface';
import Image from '@client/src/components/ui/image';
import Lightbox from '@client/src/components/Lightbox';

export const AMAP_KEY = '7890399e162ed7158e1ef1d8f7c86160';

interface Props {
  className?: string;
}

declare global {
  interface Window {
    AMap: any;
  }
}

const loadAMap = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (window.AMap) {
      resolve(window.AMap);
      return;
    }
    if (!AMAP_KEY) {
      reject(new Error('缺少高德地图 Key'));
      return;
    }
    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_KEY}&plugin=AMap.Scale,AMap.ControlBar`;
    script.async = true;
    script.onload = () => resolve(window.AMap);
    script.onerror = () => reject(new Error('高德地图加载失败'));
    document.head.appendChild(script);
  });
};

const TravelMap: React.FC<Props> = ({ className }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const satelliteLayerRef = useRef<any>(null);
  const roadNetLayerRef = useRef<any>(null);
  const [markers, setMarkers] = useState<LocationMarker[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [is3D, setIs3D] = useState(false);

  const [activeLocation, setActiveLocation] = useState<LocationMarker | null>(null);
  const [locationArtworks, setLocationArtworks] = useState<Artwork[]>([]);
  const [panelLoading, setPanelLoading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    getLocationMarkers()
      .then((data) => setMarkers(data))
      .catch((err) => logger.error('加载地点标记失败', err));
  }, []);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    loadAMap()
      .then((AMap) => {
        const map = new AMap.Map(mapRef.current!, {
          zoom: 3,
          center: [104, 35],
          mapStyle: 'amap://styles/light',
          viewMode: '2D',
          pitch: 0,
          features: ['bg', 'road', 'building'],
          showLabel: true,
        });

        mapInstance.current = map;

        const satelliteLayer = new AMap.TileLayer.Satellite({ zIndex: 10 });
        const roadNetLayer = new AMap.TileLayer.RoadNet({ zIndex: 20 });
        satelliteLayerRef.current = satelliteLayer;
        roadNetLayerRef.current = roadNetLayer;

        setMapReady(true);
      })
      .catch((err) => {
        logger.error('高德地图初始化失败', err);
        setLoadError(err.message);
      });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.destroy();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapInstance.current || markers.length === 0) return;

    const AMap = window.AMap;
    const map = mapInstance.current;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    markers.forEach((marker) => {
      const content = document.createElement('div');
      content.style.cssText = 'position: relative; width: 14px; height: 14px; cursor: pointer;';

      const pulse = document.createElement('div');
      pulse.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        width: 24px;
        height: 24px;
        margin-left: -12px;
        margin-top: -12px;
        border-radius: 50%;
        background-color: hsl(28, 45%, 40%);
        opacity: 0.35;
        animation: amap-marker-pulse 2.4s ease-out infinite;
      `;

      const dot = document.createElement('div');
      dot.style.cssText = `
        position: relative;
        width: 12px;
        height: 12px;
        margin: 1px;
        border-radius: 50%;
        background-color: hsl(28, 45%, 40%);
        box-shadow: 0 0 0 2px hsla(30, 8%, 97%, 0.92), 0 1px 3px rgba(0,0,0,0.2);
        transition: transform 0.25s ease, box-shadow 0.25s ease;
      `;

      content.appendChild(pulse);
      content.appendChild(dot);

      content.addEventListener('mouseenter', () => {
        dot.style.transform = 'scale(1.5)';
      });
      content.addEventListener('mouseleave', () => {
        dot.style.transform = 'scale(1)';
      });

      const amapMarker = new AMap.Marker({
        position: [marker.longitude, marker.latitude],
        content,
        offset: new AMap.Pixel(-7, -7),
        anchor: 'center',
      });

      amapMarker.on('click', () => {
        handleMarkerClick(marker);
      });

      amapMarker.setMap(map);
      markersRef.current.push(amapMarker);
    });

    if (markersRef.current.length > 0) {
      map.setFitView(markersRef.current, false, [80, 80, 80, 80]);
    }
  }, [mapReady, markers]);

  const handleToggle3D = () => {
    if (!mapInstance.current || !window.AMap) return;
    const map = mapInstance.current;
    const AMap = window.AMap;
    const next3D = !is3D;
    setIs3D(next3D);

    if (next3D) {
      map.setStatus({
        viewMode: '3D',
        pitch: 50,
        rotateEnable: true,
        pitchEnable: true,
        dragRotate: true,
      });
      if (satelliteLayerRef.current) {
        satelliteLayerRef.current.setMap(map);
      }
      if (roadNetLayerRef.current) {
        roadNetLayerRef.current.setMap(map);
      }
    } else {
      map.setStatus({
        viewMode: '2D',
        pitch: 0,
        rotateEnable: false,
        pitchEnable: false,
        dragRotate: false,
      });
      if (satelliteLayerRef.current) {
        satelliteLayerRef.current.setMap(null);
      }
      if (roadNetLayerRef.current) {
        roadNetLayerRef.current.setMap(null);
      }
      map.setMapStyle('amap://styles/light');
      map.setRotation(0);
    }
  };

  const handleMarkerClick = async (marker: LocationMarker) => {
    setActiveLocation(marker);
    setPanelLoading(true);
    setLocationArtworks([]);

    try {
      const resp = await getArtworks({ location: marker.name, limit: 50 });
      setLocationArtworks(resp.items || []);
    } catch (err: unknown) {
      logger.error('加载地点作品失败', err);
    } finally {
      setPanelLoading(false);
    }
  };

  const handleClosePanel = () => {
    setActiveLocation(null);
    setLocationArtworks([]);
  };

  const handleThumbClick = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const hasCameraInfo = locationArtworks.some(
    (a) =>
      a.shotDirection != null ||
      a.shotAltitude != null ||
      a.shotAngle != null ||
      (a.cameraPositionDesc && a.cameraPositionDesc.trim()),
  );

  return (
    <div className={`relative w-full ${className || ''}`}>
      <div
        className="relative w-full overflow-hidden rounded-sm border border-[color:var(--border)]"
        style={{ height: 480 }}
      >
        <div ref={mapRef} className="w-full h-full" />
        {loadError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[color:var(--bg)] text-sm text-[color:var(--text)] opacity-70">
            地图加载失败：{loadError}
          </div>
        )}
        {!mapReady && !loadError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[color:var(--bg)] text-xs text-[color:var(--text)] opacity-50">
            加载地图中...
          </div>
        )}

        {mapReady && !loadError && (
          <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleToggle3D}
              className="flex items-center gap-1.5 rounded-sm bg-neutral-900 px-3 py-1.5 text-xs text-white shadow-sm transition-colors hover:bg-neutral-700"
              aria-label={is3D ? '切换到2D平面地图' : '切换到3D山河地形'}
            >
              {is3D ? (
                <>
                  <Layers size={14} strokeWidth={1.5} />
                  <span>2D 平面</span>
                </>
              ) : (
                <>
                  <Mountain size={14} strokeWidth={1.5} />
                  <span>3D 山河</span>
                </>
              )}
            </button>
          </div>
        )}

        <AnimatePresence>
          {activeLocation && (
            <motion.div
              className="absolute right-0 top-0 bottom-0 z-20 w-[340px] border-l border-[color:var(--border)] bg-[color:var(--bg)]/95 backdrop-blur-sm"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-[color:var(--border)]">
                <div>
                  <div className="font-display text-lg tracking-wide text-[color:var(--text)]">
                    {activeLocation.name}
                  </div>
                  <div className="text-xs text-[color:var(--text)] opacity-50 mt-0.5 tnum">
                    {panelLoading
                      ? '加载中...'
                      : `${locationArtworks.length} 幅作品 · ${activeLocation.latitude.toFixed(4)}, ${activeLocation.longitude.toFixed(4)}`}
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="关闭"
                  onClick={handleClosePanel}
                  className="flex h-7 w-7 items-center justify-center rounded-sm text-[color:var(--text)] opacity-50 transition-opacity hover:opacity-100"
                >
                  <X size={16} strokeWidth={1.5} />
                </button>
              </div>

              <div className="overflow-y-auto" style={{ height: 'calc(100% - 65px)' }}>
                {panelLoading ? (
                  <div className="text-xs text-[color:var(--text)] opacity-40 text-center py-8">
                    加载作品中...
                  </div>
                ) : locationArtworks.length === 0 ? (
                  <div className="text-xs text-[color:var(--text)] opacity-40 text-center py-8">
                    暂无作品
                  </div>
                ) : (
                  <div className="px-4 py-4">
                    {hasCameraInfo && (
                      <div className="mb-4 rounded-sm border border-[color:var(--border)] bg-[color:var(--bg)] p-3">
                        <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[color:var(--text)]">
                          <Camera size={12} strokeWidth={1.5} className="text-primary" />
                          <span>拍摄机位</span>
                        </div>
                        <div className="space-y-1.5 text-xs text-[color:var(--text)] opacity-80">
                          {locationArtworks[0].shotDirection != null && (
                            <div className="flex items-center gap-2">
                              <Compass size={11} strokeWidth={1.5} className="shrink-0 opacity-60" />
                              <span className="tnum">朝向 {locationArtworks[0].shotDirection.toFixed(1)}°</span>
                            </div>
                          )}
                          {locationArtworks[0].shotAltitude != null && (
                            <div className="flex items-center gap-2">
                              <Mountain size={11} strokeWidth={1.5} className="shrink-0 opacity-60" />
                              <span className="tnum">海拔 {locationArtworks[0].shotAltitude.toFixed(0)} m</span>
                            </div>
                          )}
                          {locationArtworks[0].shotAngle != null && (
                            <div className="flex items-center gap-2">
                              <Camera size={11} strokeWidth={1.5} className="shrink-0 opacity-60" />
                              <span className="tnum">
                                俯仰 {locationArtworks[0].shotAngle > 0 ? '+' : ''}
                                {locationArtworks[0].shotAngle.toFixed(1)}°
                              </span>
                            </div>
                          )}
                          {locationArtworks[0].cameraPositionDesc &&
                            locationArtworks[0].cameraPositionDesc.trim() && (
                              <div className="pt-1 mt-1.5 border-t border-[color:var(--border)] leading-relaxed">
                                {locationArtworks[0].cameraPositionDesc}
                              </div>
                            )}
                        </div>
                      </div>
                    )}

                    <div className="mb-2 text-xs text-[color:var(--text)] opacity-60 font-medium">
                      作品
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {locationArtworks.map((artwork, idx) => (
                        <button
                          key={artwork.id}
                          type="button"
                          onClick={() => handleThumbClick(idx)}
                          className="group relative aspect-square overflow-hidden rounded-sm border border-[color:var(--border)] bg-[color:var(--bg)] transition-all hover:border-primary/40"
                          aria-label={`查看 ${artwork.title}`}
                        >
                          {artwork.mediaType === 'video' && (
                            <div className="absolute left-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white">
                              <Film size={12} strokeWidth={1.5} />
                            </div>
                          )}
                          {artwork.mediaType === 'video' ? (
                            <video
                              src={artwork.imageUrl}
                              muted
                              playsInline
                              preload="metadata"
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              onLoadedMetadata={(e) => {
                                const v = e.currentTarget;
                                v.currentTime = 1;
                              }}
                            />
                          ) : (
                            <Image
                              src={artwork.imageUrl}
                              alt={artwork.title}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          )}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                            <div className="px-2 py-1.5 text-[10px] text-white truncate">
                              {artwork.title}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between mt-4 text-xs text-[color:var(--text)] opacity-50">
        <span className="font-display tracking-wide">旅行轨迹 · Travel Map</span>
        <span className="tnum">
          {!mapReady
            ? '加载中...'
            : markers.length === 0
            ? '暂无地点数据'
            : `${markers.length} 个地点 · ${is3D ? '3D 山河地形' : '2D 平面地图'}`}
        </span>
      </div>

      <Lightbox
        images={locationArtworks}
        index={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={setLightboxIndex}
      />

      <style>{`
        @keyframes amap-marker-pulse {
          0% { transform: scale(0.6); opacity: 0.6; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .amap-logo,
        .amap-copyright {
          opacity: 0.5 !important;
          transform: scale(0.8);
          transform-origin: right bottom;
        }
        .amap-logo {
          display: none !important;
        }
      `}</style>
    </div>
  );
};

export default TravelMap;
