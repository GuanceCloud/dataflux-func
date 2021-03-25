<i18n locale="zh-CN" lang="yaml">
File Tool  : 文件工具
Go Top     : 返回顶层
Go Up      : 向上
New Folder : 新建文件夹
'Path:'    : 路径：
Folder     : 文件夹
File       : 文件
Name       : 名称
Size       : 大小
Create time: 创建时间
Update time: 更新时间
Enter      : 进入
Download   : 下载
Preview    : 预览
Upload     : 上传
More       : 更多
Zip        : 压缩
Unzip      : 解压
Move       : 移动
Copy       : 复制
Delete     : 删除

Please input destination path                         : 请输入目标路径
Are you sure you want to delete the following content?: 是否确定删除此内容？
Delete file                                           : 删除文件
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

          <el-popover placement="top" width="240" v-model="showMkdirPopover">
            <div class="popover-input">
              <el-row>
                <el-col :span="20">
                  <el-input size="mini" v-model="mkdirName" @keyup.enter.native="resourceOperation(mkdirName, 'mkdir')"></el-input>
                </el-col>
                <el-col :span="4">
                  <el-button size="mini" type="text" @click="resourceOperation(mkdirName, 'mkdir')">{{ $t('Add') }}</el-button>
                </el-col>
              </el-row>
            </div>
            <el-button slot="reference" size="mini">
              <i class="fa fa-fw fa-plus"></i>
              {{ $t('New Folder') }}
            </el-button>
          </el-popover>

<el-upload ref="upload"
  class="upload-button"
  :limit="2"
  :multiple="false"
  :auto-upload="true"
  :show-file-list="false"
  :http-request="handleUpload"
  action="">
  <el-button size="mini">
    <i class="fa fa-fw fa-cloud-upload"></i>
    {{ $t('Upload') }}
  </el-button>
</el-upload>

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
      <el-main class="common-table-container">
        <el-table
          class="common-table" height="100%"
          :data="files">
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
                  v-if="previewExtMap[scope.row.ext]"
                  class="list-button"
                  type="primary"
                  :href="T.authedLink(`/api/v1/resources?preview=true&filePath=${getPath(scope.row.name)}`)"
                  :underline="false"
                  target="_blank">{{ $t('Preview') }}</el-link>
                <el-link
                  class="list-button"
                  type="primary"
                  :href="T.authedLink(`/api/v1/resources?filePath=${getPath(scope.row.name)}`)"
                  :download="scope.row.name"
                  :underline="false"
                  target="_blank">{{ $t('Download') }}</el-link>
              </template>

              <el-dropdown @command="resourceOperationCmd" class="list-button">
                <el-button type="text" size="small">
                  {{ $t('More') }}<i class="el-icon-arrow-down el-icon--right"></i>
                </el-button>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item v-if="scope.row.ext === 'zip'" :command="{ data: scope.row, operation: 'unzip' }">{{ $t('Unzip') }}</el-dropdown-item>
                  <el-dropdown-item v-else :command="{ data: scope.row, operation: 'zip' }">{{ $t('Zip') }}</el-dropdown-item>
                  <el-dropdown-item :command="{ data: scope.row, operation: 'cp' }">{{ $t('Copy') }}</el-dropdown-item>
                  <el-dropdown-item :command="{ data: scope.row, operation: 'mv' }">{{ $t('Move') }}</el-dropdown-item>
                  <el-dropdown-item :command="{ data: scope.row, operation: 'rm' }">{{ $t('Delete') }}</el-dropdown-item>
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
    async resourceOperationCmd(options){
      if (!options) return;

      let name      = options.data.name;
      let operation = options.operation;

      return await this.resourceOperation(name, operation)
    },
    async resourceOperation(name, operation) {
      // 处理前操作
      let promptRes = null;
      try {
        switch(operation) {
          case 'cp':
            promptRes = await this.$prompt(this.$t('Please input destination path'), this.$t('Copy'), {
              inputValue: `${name} copy`,
              dangerouslyUseHTMLString: true,
              confirmButtonText: this.$t('Copy'),
              cancelButtonText: this.$t('Cancel'),
            });
            break;

          case 'mv':
            promptRes = await this.$prompt(this.$t('Please input destination path'), this.$t('Move'), {
              inputValue: name,
              dangerouslyUseHTMLString: true,
              confirmButtonText: this.$t('Move'),
              cancelButtonText: this.$t('Cancel'),
            });
            break;

          case 'rm':
            await this.$confirm(`${this.$t('Are you sure you want to delete the following content?')}
                <br><code>${name}</code>`, this.$t('Delete'),  {
              dangerouslyUseHTMLString: true,
              confirmButtonText: this.$t('Delete'),
              cancelButtonText: this.$t('Cancel'),
              type: 'warning',
            });
            break;
        }

      } catch(err) {
        return; // 取消操作
      }

      // 执行操作
      let apiRes = await this.T.callAPI('post', '/api/v1/resources/operate', {
        body : {
          targetPath       : this.getPath(name),
          operation        : operation,
          operationArgument: promptRes ? promptRes.value : undefined,
        },
        alert: { showError: true },
      });
      if (!apiRes.ok) return;

      // 处理后操作
      switch(operation) {
        case 'mkdir':
          this.showMkdirPopover = false;
          this.mkdirName        = '';

          await this.enterFolder(name);
          break;

        default:
          await this.loadData();
          break;
      }
    },
    async handleUpload(req) {
      let bodyData = new FormData();
      bodyData.append('folder', this.folder);
      bodyData.append('files', req.file);

      let opt = {
        body: bodyData,
      };
      let apiRes = await this.T.callAPI('post', '/api/v1/resources', {
        body : bodyData,
        alert: {title: this.$t('Upload'), showError: true},
      });

      await this.loadData();
    },
  },
  computed: {
    previewExtMap() {
      return {
        jpg : true,
        jpeg: true,
        png : true,
        bmp : true,
        gif : true,
        mp4 : true,
        pdf : true,
        txt : true,
        md  : true,
      }
    }
  },
  props: {
  },
  data() {
    return {
      folder: '/',

      files: [],

      showMkdirPopover: false,
      mkdirName       : '',
    }
  },
}
</script>

<style scoped>
.resource-navi .el-button {
  margin-left: 0 !important;
  padding: 5px 5px !important;
}
.popover-input {
  text-align: center;
}
.upload-button {
  display: inline-block;
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
