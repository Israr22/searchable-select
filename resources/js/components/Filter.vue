<template>
  <div v-show="loading || !filter.hideWhenEmpty || availableOptions.length > 0">
    <h3 class="text-sm uppercase tracking-wide text-80 bg-30 p-3">
      {{ filter.name }}
    </h3>

    <div class="p-2">
      <search-input
        :dusk="`${filter.name}-searchable-filter-select`"
        :value="value"
        :data="availableOptions"
        :track-by="trackBy"
        ref="searchInput"
        @input="handleInput"
        @clear="handleClear"
        @selected="handleSelected"
      >
        <template name="default">
          <div class="text-80" v-if="filter.currentValue">{{ selectedLabel }}</div>
          <div class="text-70" v-else>{{ __('Select '+filter.name) }}</div>
        </template>
        <template slot="option" slot-scope="{ option }">
          {{ option[trackBy] }}
        </template>
      </search-input>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
  export default {
      props: {
          resourceName: {
              type: String,
              required: true,
          },
          lens: String,
          filterKey: {
              type: String,
              required: true,
          },
      },

      data: () => ({
          options: [],
          loading: false,
          trackBy: 'label',
          search: null
      }),

      created() {
          this.options = this.filter.options

          this.$watch(() => {
              this.loading = true;
              this.fetchOptions(this.filter.dependentOf.reduce((r, filter) => {
                  r[filter] = this.$store.getters[`${this.resourceName}/getFilter`](filter).currentValue;
                  return r;
              }, {}));
          });
      },

      methods: {
          handleChange(value) {
              this.$store.commit(`${this.resourceName}/updateFilterState`, {
                  filterClass: this.filterKey,
                  value: value,
              })

              this.$emit('change')
          },

          async fetchOptions(filters) {
              const lens = this.lens ? `/lens/${this.lens}` : ''
              const {data: options} = await Nova.request().get(`/nova-api/${this.resourceName}${lens}/filters/options`, {
                  params: {
                      filters: btoa(JSON.stringify(filters)),
                      filter: this.filterKey,
                  },
              })

              this.options = options

              this.loading = false
          },

          handleInput(search) {
            this.search = search
          },
          handleClear() {
            this.search = null
            this.handleChange('')
          },
          handleSelected(selected) {
            this.handleChange(selected.value)
          },
      },

      computed: {
          filter() {
              return this.$store.getters[`${this.resourceName}/getFilter`](this.filterKey)
          },

          value() {
            return this.filter.currentValue
          },

          selectedLabel(){
            const current = _.find(this.options, ['value', this.filter.currentValue]);
            return current[this.trackBy];
              },

          availableOptions() {
              let options = _.filter(this.options, option => {
                  return !option.hasOwnProperty('depends') || _.every(option.depends, (values, filterName) => {
                      const filter = this.$store.getters[`${this.resourceName}/getFilter`](filterName)
                      if (!filter) return true
                      return _.intersection(
                          _.castArray(filter.currentValue).map(String),
                          _.castArray(values).map(String)
                      ).length > 0;
                  })
              })
              
          if (!this.loading && this.value !== '' && options.filter(option => option.value == this.value).length === 0 ) {
              this.handleChange('')
          }

          if (!this.search) {
            return options
          }
          return _.filter(options, option => option[this.trackBy].toLowerCase().includes(this.search.toLowerCase()));
          },
      },
  }
</script>