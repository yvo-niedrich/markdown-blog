import { ref } from 'vue';
import { defineStore } from 'pinia';

const basePath = import.meta.env.BASE_URL;
const indexPath = basePath + '/searchindex.json';

export const useIndexStore = defineStore('index', () => {
    const index = ref<SearchIndex>({});
    
    fetch(indexPath)
        .then(rsp => rsp.json())
        .then(json => {
            if (!basePath) return json;
            const obj: any = {};
            Object.keys(json).forEach(path => {
                obj[basePath + path] = json[path];
            })
            return obj;
        })
        .then(json => index.value = json);

    return { index };
})
