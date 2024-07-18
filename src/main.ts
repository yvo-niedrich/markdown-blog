import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import { createI18n } from 'vue-i18n';
import en from '@/translation/en';
import de from '@/translation/de';

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)


app.use(
    createI18n({
        locale: 'de', // set locale
        fallbackLocale: 'en', // set fallback locale
        messages: { en, de },
    }),
);

app.mount('#app')
