<i18n locale="zh-CN" lang="yaml">
Input search content: 输入搜索内容
</i18n>

<template>
  <el-tooltip
    class="item"
    effect="dark"
    :content="searchTip"
    :disabled="T.isNothing(searchTip)"
    placement="bottom">
    <div class="search-input">
      <el-input
        :placeholder="$t('Input search content')"
        size="small"
        v-model="dataFilter._fuzzySearch"
        @change="T.changePageFilter(dataFilter)">
        <i slot="prefix"
          class="el-input__icon el-icon-close text-main"
          v-if="dataFilter._fuzzySearch"
          @click="T.changePageFilter(dataFilter, {_fuzzySearch: null})"></i>
        <i slot="suffix"
          class="el-input__icon el-icon-search text-main"
          v-if="dataFilter._fuzzySearch"
          @click="T.changePageFilter(dataFilter)"></i>
      </el-input>
    </div>
  </el-tooltip>
</template>

<script>
export default {
  name: 'FuzzySearchInput',
  components: {
  },
  watch: {
  },
  methods: {
  },
  computed: {
  },
  props: {
    dataFilter: Object,
    searchTip : String,
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
.search-input input {
  font-size: 14px;
}
.search-input .el-icon-search,
.search-input .el-icon-close {
  cursor: pointer;
  font-weight: bold;
}
</style>
