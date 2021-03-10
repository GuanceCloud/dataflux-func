<i18n locale="zh-CN" lang="yaml">
File Tool    : PIP工具
Go Top       : 返回顶层
Go Up        : 向上
Folder       : 文件夹
File         : 文件
Symbol Link  : 符号链接
Enter        : 进入
Download     : 下载
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>{{ $t('File Tool') }}</h1>
      </el-header>

      <!-- 列表区 -->
      <el-main>
        <div>
          <el-button @click="enterFolder()" :disabled="folder === '/'">
            {{ $t('Go Top') }}
          </el-button>
          <el-button @click="enterFolder('..')" :disabled="folder === '/'">
            {{ $t('Go Up') }}
          </el-button>
        </div>

        <el-table class="common-table" :data="files">
          <el-table-column :label="$t('Name')" sortable sort-by="name">
            <template slot-scope="scope">
              <el-button v-if="scope.row.type === 'folder'"
                @click="enterFolder(scope.row.name)" type="text">
                <code>{{ scope.row.name }}/</code>
              </el-button>

              <code v-else>{{ scope.row.name }}</code>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Type')" sortable sort-by="type">
            <template slot-scope="scope">
              <span v-if="scope.row.type === 'folder'">{{ $t('Folder') }}</span>
              <span v-else-if="scope.row.type === 'file'">{{ $t('File') }}</span>
              <span v-else-if="scope.row.type === 'slink'">{{ $t('Symbol Link') }}</span>
            </template>
          </el-table-column>

          <el-table-column align="right" width="260">
            <template slot-scope="scope">
              <template v-if="scope.row.type === 'folder'">
                <el-button @click="enterFolder(scope.row.name)" type="text" size="small">{{ $t('Enter') }}</el-button>
              </template>
            </template>
          </el-table-column>
        </el-table>
      </el-main>
    </el-container>
  </transition>
</template>

<script>
import * as path from '@/path'

export default {
  name: 'FileTool',
  components: {
  },
  watch: {
    $route: {
      immediate: true,
      async handler(to, from) {
        await this.loadData();
      }
    },
    async folder() {
      await this.loadData();
    },
  },
  methods: {
    async loadData() {
      let apiRes = await this.T.callAPI('/api/v1/resources/dir', {
        query: {folder: this.folder},
        alert: {showError: true},
      });
      if (!apiRes.ok) return;

      this.files = apiRes.data;

      this.$store.commit('updateLoadStatus', true);
    },
    enterFolder(name) {
      if (!name) {
        this.folder = '/';
      } else {
        this.folder = path.join(this.folder, name);
      }
    },
  },
  computed: {
  },
  props: {
  },
  data() {
    return {
      folder: '/',

      files: [],
    }
  },
}
</script>

<style scoped>
</style>

<style>
</style>
