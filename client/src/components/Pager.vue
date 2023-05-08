<template>
  <el-footer v-if="T.notNothing(pageInfo)" class="paging-area">
    <el-pagination
      background
      @size-change="T.changePageSize"
      @current-change="T.goToPageNumber"
      layout="total, sizes, prev, pager, next, jumper"
      :page-sizes="[3, 10, 20, 50, 100]"
      :current-page="pageInfo.pageNumber"
      :page-size="pageInfo.pageSize"
      :page-count="pageCount"
      :total="pageInfo.totalCount">
    </el-pagination>
  </el-footer>
</template>

<script>
export default {
  name: 'Pager',
  components: {
  },
  watch: {
  },
  methods: {
  },
  props: {
    pageInfo: Object,
  },
  computed: {
    pageCount() {
      if (this.pageInfo.pageCount) {
        return this.pageInfo.pageCount;
      } else if (this.pageInfo.count < this.pageInfo.pageSize) {
        return this.pageInfo.pageNumber;
      } else {
        return this.pageInfo.pageNumber + 1;
      }
    }
  },
  data() {
    return {}
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.paging-area {
  height: 50px !important;
  text-align: right;
  padding: 10px 20px !important;
}
</style>
