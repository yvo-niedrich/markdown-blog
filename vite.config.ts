import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

const hash = (Math.random() + 1).toString(36).substring(2);

// https://vitejs.dev/config/
export default defineConfig({
    base: '/markdown-blog/',
    plugins: [
        vue(),
        vueJsx(),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    define: {
        'BUILD_HASH': '\"' + hash + '\"',
    }
})
