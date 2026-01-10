<script setup lang="ts">
import RecipeItem from '../components/RecipeItem.vue';
import {useRegistryStore} from '../stores/registry';
import title from '@/helper/title';

const store = useRegistryStore();
title('Home');
</script>

<template>
  <main>
    <RecipeItem v-for="r in store.recent().slice(0, 15)" :record="r" />
  </main>
</template>