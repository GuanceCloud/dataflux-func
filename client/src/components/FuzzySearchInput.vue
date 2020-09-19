<template>
  <div class="search-input">
    <el-input
      placeholder="输入搜索内容"
      size="mini"
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
.search-input .el-icon-search,
.search-input .el-icon-close {
  cursor: pointer;
  font-weight: bold;
}
</style>
