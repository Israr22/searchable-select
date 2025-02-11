Nova.booting((Vue, router, store) => {
  Vue.component('searchable-select', require('./components/Filter').default)
})
