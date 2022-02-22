<i18n locale="zh-CN" lang="yaml">
Input search content: 输入搜索内容
</i18n>

<template>
  <div class="search-input">
    <el-autocomplete
      :placeholder="$t('Input search content')"
      size="small"
      v-model.trim="dataFilter._fuzzySearch"
      :fetch-suggestions="getSearchHistory"
      :debounce="100"
      @change="doSearch()"
      @select="doSearch()">
      <i slot="prefix"
        class="el-input__icon el-icon-close text-main"
        v-if="dataFilter._fuzzySearch"
        @click="doSearch({_fuzzySearch: null})"></i>
      <i slot="suffix"
        class="el-input__icon el-icon-search text-main"
        v-if="dataFilter._fuzzySearch"
        @click="doSearch()"></i>

      <template slot-scope="{ item }">
        <span class="text-main">{{ item.value }}</span>
        <span class="text-info search-time">{{ $t('(') }}{{ item.timestamp | fromNow }}{{ $t(')') }}</span>
      </template>
    </el-autocomplete>
  </div>
</template>

<script>
export default {
  name: 'FuzzySearchInput',
  components: {
  },
  watch: {
    $route: {
      immediate: true,
      async handler(to, from) {

      }
    },
  },
  methods: {
    doSearch(nextListQuery) {
      this.T.changePageFilter(this.dataFilter, nextListQuery);
      this.$store.commit('addFuzzySearchHistory', this.dataFilter._fuzzySearch);
    },
    getSearchHistory(queryString, callback) {
      if (!this.$store.state.fuzzySearchHistoryMap) return callback([]);

      let key   = this.$route.name;
      let items = this.$store.state.fuzzySearchHistoryMap[key] || [];
      items.sort((a, b) => {
        return b.timestamp - a.timestamp;
      })
      return callback(items);
    },
  },
  computed: {
  },
  props: {
    dataFilter: Object,
  },
  data() {
    return {
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.search-input {
  width: 260px;
  display: inline-block;
}
.search-input .el-autocomplete {
  width: 100%;
}
.search-input input {
  font-size: 14px;
}
.search-input .el-icon-search,
.search-input .el-icon-close {
  cursor: pointer;
  font-weight: bold;
}
.search-time {
  font-size: 12px;
  float: right;
}
</style>
