<script setup lang="ts">
import { ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import MarkdownRenderer from '@/components/MarkdownRenderer.vue';
import {useRegistryStore} from '@/stores/registry';

const props = defineProps<{ slug: string }>();
const content = ref('## Loading...');
const { registry } = storeToRefs(useRegistryStore());

watch(registry, async(registry) => {
    const recipe = registry.find(r => r?.slug == props?.slug);
    if (!recipe?.path) return;
    content.value = await fetch(recipe?.path).then(response => response.text());
}, {immediate: true});

</script>

<template>
    <div class="record">
        <MarkdownRenderer :source="content" />
    </div>
</template>


