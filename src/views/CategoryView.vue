<script setup lang="ts">
import { watch } from 'vue';
import RecipeItem from '../components/RecipeItem.vue';
import {useRegistryStore} from '../stores/registry';
import title from '@/helper/title';

const props = defineProps<{ category: string }>();
const store = useRegistryStore();
watch(props, (c) => title(c.category), {immediate: true});
</script>

<template>
  <main>
    <RecipeItem v-for="r in store.findByCategory(category).slice(0, 15)" :record="r" />
  </main>
</template>