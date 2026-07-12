import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node', // ブラウザ環境のシミュレーションが不要ならこれでOK
  },
});