<script setup lang="ts">
import {useRouter} from 'vue-router'
import { debounce } from '@/helper/events';
import { ref, watch } from 'vue';

const router = useRouter();
const query = ref('');

const search = debounce(function(...args) {
    console.log(args);
    if (query.value.length > 2) router.push('/search/' + encodeURIComponent(query.value));
    if (query.value.length === 0) router.push('/');
}, 300);

const keydownFn = function(event: KeyboardEvent) {
    if (event.key === 'Escape') query.value = '';
}

watch(query, search);


</script>

<template>
    <div class="search-btn">
        <div class="search-btn-icon">
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
            </svg>
        </div>
        <input type="search" v-model="query" @focus="search" @keydown="keydownFn" placeholder="Search..." />
    </div>
    
</template>

<style lang="scss" scoped>

.search-btn {
    position: relative;
    
    .search-btn-icon {
        position: absolute;
        top: 0.75em;
        left: 0;
        flex: auto;
        align-items: center;
        pointer-events: none;
        padding-inline-start: 0.75rem; 
        
        svg {
            width: 1.1em;
            height: 1.1em;
        }
        
        @media (max-width: 800px) {
            padding-inline-start: 0.7rem; 
            top: 0.6em;
            svg {
                width: .95em;
                height: .95em;
            }
        }
        
        @media (max-width: 650px) {
            padding-inline-start: 0.6rem;
            top: 0.55em;
            svg {
                width: .85em;
                height:.85em;
            }
        }
    }
    
    input {
        background-color: var(--background-muted);
        display: block;
        font-size: .9em;
        width: 100%;
        margin: 0.6em 0;
        padding: 0.8em 0.8em 0.8em 2.8em;
        border-radius: .8em;
        border: 1px solid var(--vt-c-divider-dark-2);
        outline: none;
        
        color: var(--color-text);
        
        &:hover, &:active, &:focus {
            background-color: var(--color-background-soft);
            border: 1px solid var(--vt-c-divider-dark-1);
        }
        
        &::placeholder {
            color: gray;
        }
        
        @media (max-width: 800px) {
            padding: 0.75em 0.75em 0.75em 2.4em;
        }
        
        @media (max-width: 800px) {
            padding: 0.75em 0.75em 0.75em 2em;
        }
    }
}

</style>
