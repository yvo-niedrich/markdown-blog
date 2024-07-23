<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
defineProps<{
    record: RecipeRegistryRecord
}>();

const router = useRouter();
function placeholderImage(index: number) {
    return import.meta.env.BASE_URL + 'placeholder/placeholder' + (index % 4 + 1) + ".png"
}
</script>

<template>
    <div class="item">
        <div :class="{ 'thumb': true, 'placeholder': !record.preview }">
                <img :src="record.preview || placeholderImage(record.index)" @click="() => router.push(`/recipe/${record.slug}`)" />
        </div>
        
        <header>
            <h3>
                <RouterLink :to="`/recipe/${record.slug}`">{{ record.name }}</RouterLink>
            </h3>
            <div class="category">
                <span class="label">{{$t('category')}}:</span> <span>{{ record.category }}</span>
            </div>
        </header>
    </div>
</template>

<style lang="scss" scoped>
.item {
    border: 1px solid var(--color-border);
    border-radius: 1em;
    padding: 1em;
    margin: 1em auto;
    max-width: 50rem;
    
    display: grid;
    grid-template-columns: 10rem auto 6rem;
    
    &:hover {
        border: 1px solid var(--color-border-hover);
        background-color: var(--color-background-soft);
    }
}

.thumb {
    height: 6rem;
    width: 9rem;
    text-align: center;
    user-select: none;
    
    &.placeholder img {
        opacity: .75;
        border: 1px solid var(--color-border);
        mask-image: linear-gradient(to right, rgba(0, 0, 0, 1.0) 50%, transparent 100%);
    }
    
    img {
        max-width: 100%;
        max-height: 100%;
        border-radius: 1rem;
        
        border: 1px solid var(--color-border-hover);
    }
}


h3 {
    font-size: larger;
    font-weight: bold;
    color: var(--color-heading);
    border-bottom: 1px solid var(--color-border-hover);
    
    &:hover {
        border-bottom: 1px solid var(--color-border);
    }
    
    a {
        display:block;
        border-top-left-radius: 0.5em;
        
        &:hover {
            background: linear-gradient(to right, rgba(0,189,126,0.2) 40%, rgba(0,189,126,0) 100%); 
        }
    }
}

div.category {
    margin-top: 1em;
    
    .label {
        
        font-style: italic;
        text-decoration: underline;
    }
}

</style>
