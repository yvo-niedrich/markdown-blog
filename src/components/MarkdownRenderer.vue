<script setup lang="ts">
import MarkdownIt from "markdown-it";
import type { RenderRule } from "markdown-it/lib/renderer.mjs";

const markdown = new MarkdownIt();

const basePath = import.meta.env.BASE_URL;
if (basePath) {
    const defaultImageRenderer = markdown.renderer.rules.image as RenderRule;
    markdown.renderer.rules.image = (tokens, idx, options, env, self) => {
        const src = tokens[idx].attrGet('src')
        if (src && src.startsWith('/')) {
            tokens[idx].attrSet('src', basePath + src)
        }
        
        return defaultImageRenderer(tokens, idx, options, env, self)
    };
}

defineProps({ source: { type: String, default: ""}});
</script>

<template>
    <div class="recipe" v-html="markdown.render(source)" />
</template>

<style lang="scss">
div.recipe {
    transition: padding .5s, margin .5s;
    
    margin: 1em;
    padding: 1em 4em;
    border: 1px solid var(--color-border);
    border-radius: 1em;
    
    font-size: .8rem;
    line-height: 1.25rem;
    
    @media (max-width: 1024px) {
        padding: 1em 2.5em;
    }
    
    @media (max-width: 800px) {
        padding: 1em 1.5em;
    }
    
    @media (max-width: 650px) {
        padding: 1em .5;
    }
    
    @media print {    
        border: 0;
        margin: 0;
        padding: 0;
    }
    
    h1 {
        color: hsla(160, 100%, 37%, 1);
        text-decoration: none;
        font-size: 2em;
        line-height: 2em;
    }
    
    h2 {
        font-size: 1.5em;
        line-height: 1.5em;
        margin: .4em 0;
    }
    
    img:first-of-type {
        transition: max-width .5s, max-height .5s;
        float: right;
        max-height: 20em;
        border: 1px solid var(--color-border-hover);
        border-radius: 2em;
        padding: .25em;
        
        &:first-of-type {
            float: right;
            max-width: 25em;
            
            @media (max-width: 1024px) {
                max-width: 24em;
            }
            
            @media (max-width: 800px) {
                max-width: 20em;
            }
            
            @media (max-width: 650px) {
                max-width: 18em;
            }
            
            @media (max-width: 450px) {
                float: none;
                max-width: none;
            }
        }
    }
    
    
    
    ul {
        list-style-type: disc;
    }
    
    ul, ol {
        margin: .5em 0;
        padding-left: 1.5em; 
    }
    
    li {
        padding-left: .2em;;
    }
    
    ol li {
        margin-bottom: 0.5em;
    }
    
    blockquote {
        margin: 1em 0;
        border: 1px solid var(--color-border);
        border-left-width: .6em;
        border-radius: .4em;
        padding: .2em 0 .2em .5em;
    }
    
    em {
        font-style: italic;
    }
    
    strong {
        font-weight: bold;
    }
    
    hr {
        margin: 1em 2em;
        border: 0;
        border-bottom: 1px solid var(--color-border-hover);
        box-shadow: 0 2px 3px var(--color-border);
    }
}


</style>