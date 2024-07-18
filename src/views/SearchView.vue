<script setup lang="ts">
import { ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRegistryStore } from '@/stores/registry';
import { useIndexStore } from '@/stores/index';
import RecipeItem from '@/components/RecipeItem.vue';
import {tokenize} from '@/helper/tokens';
import removeUndefined from '@/helper/removeUndefined';

const props = defineProps<{ query: string }>();
const results = ref<RecipeRegistryRecord[]>([]);

const indexStore = useIndexStore();
const registryStore = useRegistryStore();

const {index} = storeToRefs(indexStore);
const {registry} = storeToRefs(registryStore);

watch([registry, index, props], async([registry, index]) => {
    const paths: { [path: string]: number} = {};
    
    const tokens = tokenize(props.query);
    Object.keys(index)
        .filter(idxToken => tokens.find(t => idxToken.indexOf(t) >= 0))
        .forEach(idxToken => {
            index[idxToken].forEach(path => {
                if (paths[path]) {
                    paths[path]++;
                } else {
                    paths[path] = 1;
                }
            });
        });

    results.value = Object.keys(paths)
        .filter(p => paths[p] >= tokens.length)
        .map(p => registry.find(r => r.path === p))
        .filter(removeUndefined);
}, {immediate: true});


</script>

<template>
  <main>
    <RecipeItem v-for="r in results" :record="r" />
  </main>
</template>