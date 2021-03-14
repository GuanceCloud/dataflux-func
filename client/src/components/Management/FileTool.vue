<i18n locale="zh-CN" lang="yaml">
File Tool  : 文件工具
Go Top     : 返回顶层
Go Up      : 向上
'Path:'    : 路径：
Folder     : 文件夹
File       : 文件
Name       : 名称
Size       : 大小
Create time: 创建时间
Update time: 更新时间
Enter      : 进入
Download   : 下载
More       : 更多
Zip        : 压缩
Unzip      : 解压
Delete     : 删除

Are you sure you want to delete the following file?: 是否确定删除此文件？
Delete file                                        : 删除文件
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          {{ $t('File Tool') }}
          &#12288;
          <el-button @click="enterFolder('..')" :disabled="folder === '/'" size="mini">
            <i class="fa fa-fw fa-arrow-up"></i>
            {{ $t('Go Up') }}
          </el-button>
          &#12288;
          <code class="resource-navi" v-if="folder !== '/'">
            <small>{{ $t('Path:') }}</small>
            <el-button size="small" @click="enterFolder()">
              <i class="fa fa-fw fa-home"></i>
            </el-button><template v-for="(layer, index) in folder.slice(1).split('/')">
              <div class="path-sep"><i class="fa fa-angle-right"></i></div><el-button
                :key="index"
                size="small"
                @click="enterFolder(folder.split('/').slice(0, index + 2).join('/'), true)">
                {{ layer }}
              </el-button>
            </template>
          </code>
          <div class="header-control">

          </div>
        </h1>
      </el-header>

      <!-- 列表区 -->
      <el-main>
        <el-table class="common-table" :data="files">
          <el-table-column :label="$t('Name')" sortable sort-by="name">
            <template slot-scope="scope">
              <el-button v-if="scope.row.type === 'folder'"
                @click="enterFolder(scope.row.name)" type="text">
                <i :class="`fa fa-fw fa-${scope.row.icon}`"></i>
                <code>{{ scope.row.name }}/</code>
              </el-button>

              <template v-else>
                <i :class="`fa fa-fw fa-${scope.row.icon}`"></i>
                <code>{{ scope.row.name }}</code>
              </template>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Create time')" sortable sort-by="createTime" width="200">
            <template slot-scope="scope">
              <span>{{ scope.row.createTime | datetime }}</span>
              <br>
              <span class="text-info">（{{ scope.row.createTime | fromNow }}）</span>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Update time')" sortable sort-by="updateTime" width="200">
            <template slot-scope="scope">
              <span>{{ scope.row.updateTime | datetime }}</span>
              <br>
              <span class="text-info">（{{ scope.row.updateTime | fromNow }}）</span>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Size')" sortable sort-by="size" align="right" width="120">
            <template slot-scope="scope">
              <code v-if="scope.row.size === null">-</code>
              <code v-else-if="scope.row.size < 1024">{{ scope.row.size }} B</code>
              <code v-else-if="scope.row.size < 1024 * 1024">{{ parseInt(scope.row.size / 1024) }} KB</code>
              <code v-else-if="scope.row.size < 1024 * 1024 * 1024">{{ parseInt(scope.row.size / 1024 / 1024) }} MB</code>
            </template>
          </el-table-column>

          <el-table-column align="right" width="260">
            <template slot-scope="scope">
              <el-button v-if="scope.row.type === 'folder'" @click="enterFolder(scope.row.name)" type="text" size="small">{{ $t('Enter') }}</el-button>
              <template v-else-if="scope.row.type === 'file'">
                <el-link
                  class="list-button"
                  type="primary"
                  :href="T.authedLink(`/api/v1/resources?filePath=${getPath(scope.row.name)}`)"
                  :download="scope.row.name"
                  :underline="false"
                  target="_blank">{{ $t('Download') }}</el-link>
              </template>

              <el-dropdown @command="resourceOperation" class="list-button">
                <el-button type="text" size="small">
                  {{ $t('More') }}<i class="el-icon-arrow-down el-icon--right"></i>
                </el-button>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item v-if="scope.row.ext === 'zip'" :command="{ data: scope.row, operation: 'unzip' }">{{ $t('Unzip') }}</el-dropdown-item>
                  <el-dropdown-item v-else :command="{ data: scope.row, operation: 'zip' }">{{ $t('Zip') }}</el-dropdown-item>
                  <el-dropdown-item :command="{ data: scope.row, operation: 'delete' }">{{ $t('Delete') }}</el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
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

      let files = apiRes.data;
      files.forEach(f => {
        switch (f.type) {
          case 'folder':
            f.icon = 'folder-o';
            break;
          case 'file':
            f.icon = 'file-o';
            f.ext  = f.name.split('.').pop();
            break;
        }

        switch (f.ext) {
          case 'zip':
          case 'rar':
          case '7z':
          case 'tar':
          case 'gz':
            f.icon = 'file-archive-o';
            break;
          case 'htm':
          case 'html':
          case 'js':
          case 'css':
          case 'yaml':
          case 'json':
          case 'py':
            f.icon = 'file-code-o';
            break;
          case 'jpg':
          case 'jpeg':
          case 'png':
          case 'gif':
          case 'bmp':
            f.icon = 'file-image-o';
            break;
          case 'pdf':
            f.icon = 'file-pdf-o';
            break;
          case 'txt':
          case 'csv':
          case 'md':
          case 'markdown':
            f.icon = 'file-text-o';
            break;
          case 'avi':
          case 'mp4':
          case 'mkv':
            f.icon = 'file-video-o';
            break;
          case 'doc':
          case 'docx':
            f.icon = 'file-word-o';
            break;
          case 'xls':
          case 'xlsx':
            f.icon = 'file-excel-o';
            break;
          case 'ppt':
          case 'pptx':
            f.icon = 'file-powerpoint-o';
            break;
        }
      });

      this.files = files;

      this.$store.commit('updateLoadStatus', true);
    },
    getPath(name) {
      return path.join(this.folder, name);
    },
    enterFolder(name, isAbs) {
      if (!name) {
        this.folder = '/';
      } else {
        if (isAbs) {
          this.folder = name;
        } else {
          this.folder = this.getPath(name);
        }
      }
    },
    async resourceOperation(options) {
      let name              = options.data.name;
      let operation         = options.operation;
      let operationArgument = options.operationArgument;

      // 处理前操作
      try {
        switch(operation) {
          case 'delete':
            await this.$confirm(`${this.$t('Are you sure you want to delete the following file?')}
                <br><code>${name}</code>`, this.$t('Delete file'),  {
              dangerouslyUseHTMLString: true,
              confirmButtonText: this.$t('Delete file'),
              cancelButtonText: this.$t('Cancel'),
              type: 'warning',
            });
            break;
        }

      } catch(err) {
        return; // 取消操作
      }

      // 执行操作
      var filePath  = this.getPath(name);
      let apiRes = await this.T.callAPI('post', '/api/v1/resources/operate', {
        body : { filePath: filePath, operation: operation },
        alert: { showError: true },
      });
      if (!apiRes.ok) return;

      // 处理后操作
      switch(operation) {
        case 'newFolder':
          await this.enterFolder(operationArgument);
          break;

        case 'zip':
        case 'unzip':
        case 'copy':
        case 'rename':
        case 'move':
        case 'delete':
          await this.loadData();
          break;
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
.resource-navi .el-button {
  margin-left: 0 !important;
  padding: 5px 5px !important;
}
</style>

<style>
.path-sep {
  width: 20px;
  text-align: center;
  display: inline-block;
  font-size: 14px;
}
.resource-navi .el-button span {
  font-family: monospace !important;
}
</style>
