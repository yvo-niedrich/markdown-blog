<script setup lang="ts">
import resolvePath from "@/helper/resolvePath";
import MarkdownIt from "markdown-it";
import type { RenderRule } from "markdown-it/lib/renderer.mjs";

const props = defineProps({
    source: { type: String, default: "" },
    thumb: { type: String, default: "" },
    content: { type: String, default: "" },
    ignoreFrontmatter: { type: Boolean, default: true },
});

function stripFrontmatter(content: string) {
    if (!content || !props.ignoreFrontmatter) return content;
    return content.replace(/^\s*(?:---|\+\+\+)[\s\S]*?(?:---|\+\+\+|\.\.\.)\s*/, '');
}

function renderFile(file: string, content: string) {

    console.log(props.thumb);

    let mdContent = stripFrontmatter(content);

    const markdown = new MarkdownIt();
    const defaultImageRenderer = markdown.renderer.rules.image as RenderRule;
    markdown.renderer.rules.image = (tokens, idx, options, env, self) => {
        const src = tokens[idx].attrGet('src')
        if (src && !src.startsWith('/')) {
            const newPath = resolvePath(src, file.replace(/\/([^\/)]+)\.md/i, ''));
            tokens[idx].attrSet('src', newPath)
        }
        
        return defaultImageRenderer(tokens, idx, options, env, self)
    };
    return markdown.render(mdContent, {  });
}

</script>

<template>
    <div class="recipe">
        <div v-if="thumb" class="recipe-thumb">
            <img :src="thumb" />
        </div>
        <div class="recipe-content" v-html="renderFile(source, content)" />
    </div>
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

    div.recipe-thumb {
        margin-top: 1em;
        float: right;

        @media (max-width: 480px) {
            float: none;
        }

        img {
            box-shadow: 0 0 1em var(--color-border);
            border: 1px solid transparent;
            border-radius: 2em;

            transition: max-width .5s, max-height .5s;
            max-width: 25em;
            max-height: 20em;

            @media (max-width: 1024px) {
                max-width: 24em;
            }
            
            @media (max-width: 800px) {
                max-width: 20em;
                max-height: 18em;
            }
            
            @media (max-width: 650px) {
                max-width: 18em;
                max-height: 16em;
            }
            
            @media (max-width: 480px) {
                max-width: 95%;
            }
            
        }
    }

    @media (max-width: 1024px) {
        padding: 1em 2.5em;
    }
    
    @media (max-width: 800px) {
        padding: 1em 1.5em;
        margin: 1em 0.75em;
    }
    
    @media (max-width: 650px) {
        padding: 1em .5;
        margin: 1em 0.5em;
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
        font-weight: bold;
    }
    
    h2 {
        text-shadow:  hsla(160, 100%, 37%, .5) 0px 0px 1em;
        font-size: 1.5em;
        font-weight: bold;
        line-height: 1.5em;
        margin: .4em 0;

        border-bottom: 1px solid var(--color-border);
    }
    
    h3 {
        margin: .4em 0;
        font-weight: bold;
    }
    
    p {
        padding: 0.35em 0;
    }
    
    ul {
        list-style-type: disc;
    }
    
    ul, ol {
        margin: 1em 0;
        padding-left: 1.5em; 
    }
    
    li {
        padding: 0 0 .15em .1em ;
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