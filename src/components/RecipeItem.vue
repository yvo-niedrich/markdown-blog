<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
defineProps<{
  record: RecipeRegistryRecord
}>()
</script>

<template>
  <div class="item">
    <div class="thumb">
      <img :src="record.preview || 'https://cataas.com/cat/cute'" />
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
  
  img {
    max-width: 100%;
    max-height: 100%;
    border-radius: 1rem;
  }
}


h3 {
  font-size: larger;
  font-weight: bold;
  color: var(--color-heading);
  border-bottom: 1px solid var(--color-heading);

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
