import Vue from 'vue'
import Router from 'vue-router'
import TinymceEditor from '@/pages/tinymcs-editor'

Vue.use(Router)

export default new Router({
  routes: [{
    path: '/',
    name: 'TinymceEditor',
    component: TinymceEditor
  }]
})
