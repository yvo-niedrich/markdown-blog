<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router'
import RecipeIcon from './components/icons/IconRecipe.vue'
import SearchbarComponent from '@/components/Searchbar.vue'
import {useRegistryStore} from './stores/registry';

const router = useRouter();
const store = useRegistryStore();

console.log(import.meta.env)
</script>

<template>
    <header class="no-print">
        
        <div class="top">
            <div class="logo" @click="() => router.push('/')">
                <RecipeIcon class="app-icon" />
                <h1 class="green">Rezepte</h1>
            </div>
            <div class="searchbar">
                 <SearchbarComponent />
            </div>
            
        </div>
        
        <nav>
            <RouterLink to="/">Home</RouterLink>
            
            <template v-for="category in store.categories">
                <RouterLink :to="`/category/${category}`">{{category}}</RouterLink>
            </template>
        </nav>
    </header>
    
    <RouterView />
</template>

<style lang="scss" scoped>
header {
    line-height: 1.5;
    max-height: 100vh;
    max-width: 60rem;
    margin: 0 auto;
}

.top {
    display: grid;
    grid-template-columns: 14rem auto;
    margin-bottom: 0 auto 1em;
    transition: grid-template-columns .5s;

    @media (max-width: 800px) {
        grid-template-columns: 9rem auto;
    }

    @media (max-width: 650px) {
        grid-template-columns: 8rem auto;
    }

    .logo {
        cursor: pointer;
        display: block;
        position: relative;
        margin: 0 2rem;
        text-align: center;

        .app-icon {
            transition: max-width .5s, max-height .5s;
            max-width: 75px;
            max-height: 75px;

            @media (max-width: 650px) {
                max-width: 60px;
                max-height: 60px;
            }
        }
         
        &:active h1,
        &:hover h1 {
            transform: rotate(-35deg);
        }
        
        h1 {
            position: absolute;
            top: 0.6em;
            left: 0.4em;
            font-weight: bold;
            text-shadow: 1px 1px 2px black, 1px 1px 3px black, 0 0 5px var(--color-text), 0 0 1em var(--color-text), 0 0 0.2em var(--color-text);

            margin: 0;
            padding: 0;
            line-height: 1rem;
            font-size: 2.4em;
            transform: rotate(-25deg);
            
            transition: left .5s, transform 2.5s, font-size .5s;

            @media (max-width: 800px) {
                left: -.9em;
            }

            @media (max-width: 650px) {
                font-size: 1.75em;
                left: -.85em;
            }
        }
    }

    .searchbar {
        transition: width .5s;
        width: 55%;
        margin-left: auto;

        @media (max-width: 1200px) {
            width: 65%;
        }

        @media (max-width: 1024px) {
            width: 80%;
        }

        @media (max-width: 800px) {
            width: 90%;
        }

        @media (max-width: 650px) {
            width: 100%;
        }
    }
}

nav {
    width: 100%;
    font-size: .9em;
    text-align: center;
    margin: 0.5rem 0;

    @media (max-width: 650px) {
        font-size: 0.85em;
    }

    a.router-link-exact-active {
        color: var(--color-text);
    }

    a.router-link-exact-active:hover {
        background-color: transparent;
    }

    a {
        display: inline-block;
        padding: 0 1rem;
        border-left: 1px solid var(--color-border);
    }

    a:first-of-type {
        border-left: 0;
    }
}
</style>
