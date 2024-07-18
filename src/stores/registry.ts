import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useRegistryStore = defineStore('registry', () => {
    const registry = ref<RecipeRegistryRecord[]>([]);
    
    fetch('/registry.json')
        .then(rsp => rsp.json())
        .then(rsp => {
            registry.value = rsp.map((record: any) => {
                record.modified = new Date(record.modified);
                return record;
            })
            console.log('fetch done', rsp);
        });

    const categories = computed(() => {
        const c = registry.value.map(r => r.category);
        return c.filter((value, index) => c.indexOf(value) === index).sort()
    });

    function recent(): RecipeRegistryRecord[] {
        return registry.value.sort((a, b) => b.modified.getTime() - a.modified.getTime());
    }

    function findBySlug(slug: string): RecipeRegistryRecord[] {
        return registry.value.filter(r => r.slug === slug);
    }

    function findByPath(slug: string): RecipeRegistryRecord[] {
        return registry.value.filter(r => r.slug === slug);
    }

    function findByCategory(category: string): RecipeRegistryRecord[] {
        return registry.value.filter(r => r.category === category);
    }


    return { registry, categories, recent, findBySlug, findByPath, findByCategory }
})
