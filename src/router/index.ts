import { createRouter, createWebHistory } from 'vue-router'
import OverviewView from '@/views/OverviewView.vue'
import RecipeRecord from '@/views/RecipeRecord.vue'
import CategoryView from '@/views/CategoryView.vue'
import SearchView from '@/views/SearchView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: OverviewView
    },
    {
      path: '/recipe/:slug',
      name: 'recipe',
      component: RecipeRecord,
      props: true,
    },
    {
      path: '/category/:category',
      name: 'category',
      component: CategoryView,
      props: true,
    },
    {
      path: '/search/:query',
      name: 'search',
      component: SearchView,
      props: true,
    }
  ]
})

export default router
