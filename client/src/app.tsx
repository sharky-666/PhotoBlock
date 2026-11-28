/* eslint-disable @lark-apaas/require-app-container -- Standalone Aliyun deployment owns its QueryClient and router shell. */
import React, { lazy, useEffect } from 'react';
import {
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';

import Layout from './components/Layout';
import HomePage from './pages/HomePage/HomePage';
import AdminGuard from './components/AdminGuard';

const SeriesDetailPage = lazy(
  () => import('./pages/SeriesDetailPage/SeriesDetailPage'),
);
const CategoryPage = lazy(
  () => import('./pages/CategoryPage/CategoryPage'),
);
const PhotosPage = lazy(
  () => import('./pages/PhotosPage/PhotosPage'),
);
const VideosPage = lazy(
  () => import('./pages/VideosPage/VideosPage'),
);
const AboutPage = lazy(
  () => import('./pages/AboutPage/AboutPage'),
);
const CooperationPage = lazy(
  () => import('./pages/CooperationPage/CooperationPage'),
);
const JourneyPage = lazy(
  () => import('./pages/JourneyPage/JourneyPage'),
);
const NotFound = lazy(() => import('./pages/NotFound/NotFound'));

const AdminPage = lazy(
  () => import('./pages/AdminPage/AdminPage'),
);
const AdminLoginPage = lazy(
  () => import('./pages/AdminLoginPage/AdminLoginPage'),
);

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
    正在加载页面…
  </div>
);

const RoutesComponent = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const meta = path.startsWith('/series/')
      ? {
          title: '影像系列 | Demo Studio',
          description: '浏览演示摄影系列与示例内容。',
        }
      : path.startsWith('/category/')
        ? {
            title: '作品分类 | Demo Studio',
            description: '按主题浏览演示作品分类。',
          }
        : path.startsWith('/works/photos')
          ? {
              title: '图片作品 | Demo Studio',
              description: '浏览作品集模板的图片展示页面。',
            }
          : path.startsWith('/works/videos')
            ? {
                title: '视频作品 | Demo Studio',
                description: '浏览作品集模板的视频展示页面。',
              }
            : path === '/about'
              ? {
                  title: '关于摄影师 | Demo Studio',
                  description: '查看个人档案页面的演示布局与示例内容。',
                }
              : path === '/cooperation'
                ? {
                    title: '商业合作 | Demo Studio',
                    description: '查看商业合作页面的演示布局。',
                  }
              : path === '/journey'
                ? {
                    title: '时间历程 | Demo Studio',
                    description: '查看项目时间线页面的演示布局。',
                  }
                : path.startsWith('/admin')
                  ? {
                      title: '作品管理 | Demo Studio',
                      description: 'PhotoBlock 作品管理后台。',
                    }
                  : {
                      title: 'Demo Studio | Photography Portfolio',
                      description: '可替换内容的摄影作品集网站演示模板。',
                    };
    document.title = meta.title;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', meta.description);
  }, [location.pathname]);

  return (
    <React.Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="series/:id" element={<SeriesDetailPage />} />
          <Route path="category/:id" element={<CategoryPage />} />
          <Route path="works/photos" element={<PhotosPage />} />
          <Route path="works/videos" element={<VideosPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="journey" element={<JourneyPage />} />
          <Route path="cooperation" element={<CooperationPage />} />
          <Route path="admin/login" element={<AdminLoginPage />} />
          <Route
            path="admin/*"
            element={
              <AdminGuard>
                <AdminPage />
              </AdminGuard>
            }
          />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </React.Suspense>
  );
};

export default RoutesComponent;
