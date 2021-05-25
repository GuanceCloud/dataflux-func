<template>
  <el-footer v-if="pageInfo && pageInfo.pageCount > 0" class="paging-area">
    <el-pagination
      background
      @size-change="T.changePageSize"
      @current-change="T.goToPageNumber"
      layout="total, sizes, prev, pager, next, jumper"
      :page-sizes="[10, 20, 50, 100]"
      :current-page="pageInfo.pageNumber"
      :page-size="pageInfo.pageSize"
      :page-count="pageInfo.pageCount"
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
  computed: {
  },
  props: {
    pageInfo: Object,
  },
  computed: {
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
