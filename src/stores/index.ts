import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useIndexStore = defineStore('index', () => {
    const index = ref<SearchIndex>({});
    
    fetch('/searchindex.json')
        .then(rsp => rsp.json())
        .then(json => index.value = json);

    return { index };
})
