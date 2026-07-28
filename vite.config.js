import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      rollupTypes: true, // 型定義（.d.ts）を1つにまとめて出力
      include: ["src/core/**/*"]
    })

  ],
  build: {
    outDir: "dist",
    lib: {
      entry: resolve(__dirname, 'src/core/index.js'), // エントリーポイント
      name: 'suikyolog',                          // UMD用のグローバル変数名
      fileName: (format) => `suikyolog.${format}.js`,
      formats: ['es', 'cjs'],                     // ESMとCommonJSの両方を出力
    },
    rollupOptions: {
      // ライブラリに同梱したくない外部依存（reactなどがある場合）はここに追加
      external: [],
      output: {
        globals: {},
      },
    },
  },
});