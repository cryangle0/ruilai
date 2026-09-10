import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import uni from '@dcloudio/vite-plugin-uni'
import { defineConfig } from 'vite'

const rootDir = dirname(fileURLToPath(import.meta.url))

function emitWeixinCustomTabBar() {
  const write = (outDir: string) => {
    const dir = resolve(outDir, 'custom-tab-bar')
    mkdirSync(dir, { recursive: true })
    const leftoverVue = resolve(dir, 'index.vue')
    if (existsSync(leftoverVue)) rmSync(leftoverVue)
    writeFileSync(resolve(dir, 'index.json'), '{"component":true,"usingComponents":{}}\n')
    writeFileSync(resolve(dir, 'index.wxml'), '<view class="stub"></view>\n')
    writeFileSync(resolve(dir, 'index.wxss'), '.stub{height:0;overflow:hidden}\n')
    writeFileSync(resolve(dir, 'index.js'), 'Component({});\n')
  }
  return {
    name: 'emit-weixin-custom-tab-bar',
    closeBundle() {
      write(resolve(rootDir, 'dist/dev/mp-weixin'))
      write(resolve(rootDir, 'dist/build/mp-weixin'))
    },
  }
}

export default defineConfig({
  plugins: [uni(), emitWeixinCustomTabBar()],
  build: { minify: false },
})
