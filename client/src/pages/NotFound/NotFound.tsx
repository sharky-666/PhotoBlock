import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';

const NotFound = () => {
  const handleHomeClick = () => {
    logger.info('404 page: navigating back to home');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-foreground">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="flex flex-col items-center text-center"
      >
        <h1 className="font-display text-[120px] font-light leading-none tracking-tight text-foreground md:text-[180px]">
          404
        </h1>
        <p className="mt-4 text-sm tracking-[0.3em] text-muted-foreground">
          PAGE NOT FOUND
        </p>
        <p className="mt-2 max-w-md text-sm text-muted-foreground/70">
          您访问的页面不存在，或已被移除。
        </p>

        <Link
          to="/"
          onClick={handleHomeClick}
          className="group mt-10 inline-flex items-center gap-2 border-b border-primary/40 pb-1 text-sm font-medium tracking-widest text-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft
            size={14}
            className="transition-transform group-hover:-translate-x-1"
          />
          返回首页
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
