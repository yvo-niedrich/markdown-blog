import { ref } from 'vue';
import { defineStore } from 'pinia';

const indexPath = import.meta.env.BASE_URL.concat('/searchindex.json?hash=', BUILD_HASH);

export const useIndexStore = defineStore('index', () => {
    const index = ref<SearchIndex>({});
    
    fetch(indexPath)
        .then(rsp => rsp.json())
        .then(json => index.value = json);

    return { index };
})
