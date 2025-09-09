import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [
    react({
      // Enable Fast Refresh for better HMR
      fastRefresh: true,
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@api': fileURLToPath(new URL('./src/api', import.meta.url)),
      '@auth': fileURLToPath(new URL('./src/auth', import.meta.url)),
      '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@layouts': fileURLToPath(new URL('./src/layouts', import.meta.url)),
      '@pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
      '@styles': fileURLToPath(new URL('./src/styles', import.meta.url)),
      '@schemas': fileURLToPath(new URL('./src/schemas', import.meta.url)),
      '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    open: false,
    hmr: {
      overlay: true,
    },
  },
  build: {
    // Optimize chunks for better loading performance
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks
          'mui-core': ['@mui/material', '@emotion/react', '@emotion/styled'],
          'mui-datagrid': ['@mui/x-data-grid'],
          'mui-icons': ['@mui/icons-material'],
          'react-vendor': ['react', 'react-dom'],
          'forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'router': ['@tanstack/react-router'],
          'query': ['@tanstack/react-query', '@tanstack/react-query-devtools'],
          'utils': ['date-fns'],
        },
      },
    },
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Enable source maps for better debugging
    sourcemap: true,
  },
  optimizeDeps: {
    // Pre-bundle large dependencies
    include: [
      'react',
      'react-dom',
      '@mui/material',
      '@mui/icons-material',
      '@mui/x-data-grid',
      '@emotion/react',
      '@emotion/styled',
    ],
  },
});
