<i18n locale="zh-CN" lang="yaml">
File Tool         : 文件管理器
Go Top            : 返回顶层
Go Up             : 向上
'File size limit:': '文件大小限制：'
'Path:'           : 路径：
Create time       : 创建时间
Update time       : 更新时间

File uploaded: 文件已上传

Please input destination path                                                        : 请输入目标路径
'File <code class="text-main">{name}</code> already existed, please input a new name': '文件 <code class="text-main">{name}</code> 已经存在，请输入新文件名'
Are you sure you want to delete the following content?                               : 是否确定删除此内容？
Delete file                                                                          : 删除文件
File already existed                                                                 : 文件已经存在

'File too large (size limit: {size})': '文件过大（大小限制：{size}）'
'Uploading {filename}'               : '正在上传 {filename}'
'Processing...'                      : '正在处理...'
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded"
      v-loading.fullscreen.lock="fullScreenLoading"
      element-loading-spinner="el-icon-loading"
      :element-loading-text="progressTip || $t('Processing...')">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          {{ $t('File Tool') }}

          &#12288;
          <el-tooltip :content="$t('Go Up')">
            <el-button @click="enterFolder('..')" :disabled="currentFolder === '/'" size="small">
              <i class="fa fa-fw fa-arrow-up"></i>
            </el-button>
          </el-tooltip>
          <el-tooltip :content="$t('Refresh')">
            <el-button @click="loadData({ isRefresh: true })" size="small" class="compact-button">
              <i class="fa fa-fw fa-refresh"></i>
            </el-button>
          </el-tooltip>

          &#12288;
          <el-popover placement="bottom" width="240" v-model="showMkdirPopover">
            <div class="popover-input">
              <el-input ref="mkdirName" size="small" v-model="mkdirName" @keyup.enter.native="resourceOperation(mkdirName, 'mkdir')"></el-input>
              <el-button type="text" @click="resourceOperation(mkdirName, 'mkdir')">{{ $t('Add') }}</el-button>
            </div>
            <el-button slot="reference" size="small">
              <i class="fa fa-fw fa-plus"></i>
              {{ $t('Folder') }}
            </el-button>
          </el-popover>

          <el-tooltip :content="`${$t('File size limit:')} ${T.byteSizeHuman($store.getters.CONFIG('_EX_UPLOAD_RESOURCE_FILE_SIZE_LIMIT'))}`" placement="bottom">
            <el-upload ref="upload"
              class="upload-button"
              :limit="2"
              :multiple="false"
              :auto-upload="true"
              :show-file-list="false"
              :http-request="handleUpload"
              :on-change="onUploadFileChange"
              action="">
              <el-button size="small">
                <i class="fa fa-fw fa-cloud-upload"></i>
                {{ $t('Upload') }}
              </el-button>
            </el-upload>
          </el-tooltip>

          &#12288;
          <code class="resource-navi" v-if="currentFolder !== '/'">
            <small>{{ $t('Path:') }}</small>
            <el-button size="small" @click="enterFolder()">
              <i class="fa fa-fw fa-home"></i>
            </el-button><template v-for="(layer, index) in currentFolder.slice(1).split('/')">
              <div class="path-sep"><i class="fa fa-angle-right"></i></div><el-button
                :key="index"
                size="small"
                @click="enterFolder(currentFolder.split('/').slice(0, index + 2).join('/'), true)">
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
              <span class="text-info">{{ scope.row.createTime | fromNow }}</span>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Update time')" sortable sort-by="updateTime" width="200">
            <template slot-scope="scope">
              <span>{{ scope.row.updateTime | datetime }}</span>
              <br>
              <span class="text-info">{{ scope.row.updateTime | fromNow }}</span>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Size')" sortable sort-by="size" align="right" width="120">
            <template slot-scope="scope">
              <code v-if="scope.row.size">{{ scope.row.sizeHuman }}</code>
            </template>
          </el-table-column>

          <el-table-column align="right" width="260" class-name="fix-list-button">
            <template slot-scope="scope">
              <el-button v-if="scope.row.type === 'folder'" @click="enterFolder(scope.row.name)" type="text">{{ $t('Enter') }}</el-button>
              <template v-else-if="scope.row.type === 'file'">
                <el-link
                  v-if="previewExtMap[scope.row.ext]"
                  type="primary"
                  :href="scope.row.previewURL"
                  :underline="false"
                  target="_blank">{{ $t('Preview') }}</el-link>
                <el-link
                  type="primary"
                  :href="scope.row.downloadURL"
                  :download="scope.row.name"
                  :underline="false"
                  target="_blank">{{ $t('Download') }}</el-link>
              </template>

              <el-dropdown @command="resourceOperationCmd">
                <el-button type="text">
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
import * as pathTool from '@/pathTool'

export default {
  name: 'FileManager',
  components: {
  },
  watch: {
    $route: {
      immediate: true,
      async handler(to, from) {
        await this.loadData();
      }
    },
    showMkdirPopover(val) {
      if (val) {
        this.$nextTick(() => {
          this.$refs.mkdirName.focus();
        });
      } else {
        this.mkdirName = '';
      }
    },
  },
  methods: {
    async loadData(options) {
      options = options || {};
      if (options.isRefresh) {
        this.$store.commit('updateLoadStatus', false);
      };

      let _listQuery = this.T.createListQuery();
      let apiRes = await this.T.callAPI_get('/api/v1/resources/dir', {
        query: _listQuery,
      });
      if (!apiRes.ok) return;

      let files = apiRes.data;
      let fileNameMap = {};
      files.forEach(f => {
        fileNameMap[f.name] = true;

        switch (f.type) {
          case 'folder':
            f.icon = 'folder-o';
            break;

          case 'file':
            f.icon = 'file-o';
            f.ext  = f.name.split('.').pop();

            if (f.size) {
              f.sizeHuman = this.T.byteSizeHuman(f.size);
            }

            f.previewURL = this.T.formatURL(`/api/v1/resources`, {
              baseURL: true,
              auth   : true,
              query  : { preview: true, filePath: this.getPath(f.name) },
            });
            f.downloadURL = this.T.formatURL(`/api/v1/resources`, {
              baseURL: true,
              auth   : true,
              query  : { filePath: this.getPath(f.name) },
            });
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

      // 默认排序
      files.sort(function(a, b) {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        if (a.name !== b.name) return a.name < b.name ? -1 : 1;
        return 0;
      });

      this.files       = files;
      this.fileNameMap = fileNameMap;

      this.$store.commit('updateLoadStatus', true);
    },
    getPath(name) {
      return pathTool.join(this.currentFolder, name);
    },
    enterFolder(name, isAbs) {
      if (!name) {
        this.dataFilter.folder = '/';
      } else {
        if (isAbs) {
          this.dataFilter.folder = name;
        } else {
          this.dataFilter.folder = this.getPath(name);
        }
      }

      this.T.changePageFilter(this.dataFilter);
    },
    async resourceOperationCmd(options){
      if (!options) return;

      let name      = options.data.name;
      let operation = options.operation;

      return await this.resourceOperation(name, operation)
    },
    async resourceOperation(name, operation) {
      // 处理前操作
      let operationArgument = null;
      switch(operation) {
        case 'cp':
          operationArgument = await this.T.prompt(this.$t('Please input destination path'), name);
          if (!operationArgument) return;
          break;

        case 'mv':
          operationArgument = await this.T.prompt(this.$t('Please input destination path'), `./${name}`);
          if (!operationArgument) return;
          break;

        case 'rm':
          if (!await this.T.confirm(this.$t('Are you sure you want to delete the following content?'))) return;
          break;
      }

      // 操作处理中
      let delayedLoadingT = setTimeout(() => {
        this.fullScreenLoading = true;
      }, 200);

      // 执行操作
      let apiRes = await this.T.callAPI('post', '/api/v1/resources/operate', {
        body : {
          targetPath       : this.getPath(name),
          operation        : operation,
          operationArgument: operationArgument,
        },
      });

      // 操作处理结束
      clearTimeout(delayedLoadingT);
      this.fullScreenLoading = false;

      if (!apiRes.ok) return this.loadData();

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
      // 检查文件大小
      let fileSizeLimit = this.$store.getters.CONFIG('_EX_UPLOAD_RESOURCE_FILE_SIZE_LIMIT');
      if (req.file.size > fileSizeLimit) {
        let sizeStr = this.T.byteSizeHuman(fileSizeLimit);
        return this.T.alert(this.$t('File too large (size limit: {size})', { size: sizeStr }));
      }

      var filename = req.file.name;
      var rename   = null;

      if (this.fileNameMap[filename]) {
        // 文件已存在
        let promptRes = null;
        try {
          // 自动重命名为`xxx-2.ext`
          let _defaultRename = filename;
          let _m = filename.match(/-(\d+)\.[^.]+$/);
          let _dateStr = this.T.getDateTimeString(null, 'YYYYMMDD_HHmmss');
          if (!_m) {
            _defaultRename = filename.replace(/(\.[^.]+)$/, `-${_dateStr}$1`);
          } else {
            _defaultRename = filename.replace(/-\d+(\.[^.]+)$/, `-${_dateStr}$1`);
          }

          // 【特殊处理】此处输入框需要检查文件重复
          promptRes = await this.$prompt(this.$t('File <code class="text-main">{name}</code> already existed, please input a new name', { name: filename }), this.$t('Upload'), {
            customClass             : 'uploadRename',
            inputValue              : _defaultRename,
            dangerouslyUseHTMLString: true,
            closeOnClickModal       : false,
            confirmButtonText       : this.$t('Upload'),
            cancelButtonText        : this.$t('Cancel'),
            inputValidator: value => {
              if (this.fileNameMap[value]) {
                return this.$t('File already existed');
              }
            }
          });
        } catch(err) {
          this.$refs.upload.clearFiles();
          return; // 取消操作
        }

        rename = promptRes.value;
      }

      let bodyData = new FormData();
      bodyData.append('files', req.file);
      bodyData.append('folder', this.dataFilter.folder);
      if (rename) {
        bodyData.append('rename', rename);
      }

      // 操作处理中
      let delayedLoadingT = setTimeout(() => {
        this.fullScreenLoading = true;
      }, 200);

      // 执行上传
      let prevProgressTimestamp = null;
      let prevProgressLoaded    = null;
      let _updateProgressTipFunc = this.T.throttle((progressTip) => {
        this.progressTip = progressTip;
      }, 500);
      let apiRes = await this.T.callAPI('post', '/api/v1/resources', {
        body : bodyData,
        alert: { okMessage: this.$t('File uploaded') },
        onUploadProgress: (event) => {
          let progressTip = `${this.$t('Uploading {filename}', { filename: rename || filename })}`;
          if (prevProgressTimestamp && prevProgressLoaded) {
            let percent = (event.loaded / event.total * 100).toFixed(2);
            let speed = (event.loaded - prevProgressLoaded) / (event.timeStamp - prevProgressTimestamp) * 1000;
            progressTip += ` (${percent}%, ${this.T.byteSizeHuman(event.loaded)}/${this.T.byteSizeHuman(event.total)}, ${this.T.byteSizeHuman(speed)}/s)`;
          }

          prevProgressTimestamp = event.timeStamp;
          prevProgressLoaded    = event.loaded;

          _updateProgressTipFunc(progressTip);
        }
      });

      // 操作处理结束
      clearTimeout(delayedLoadingT);
      this.fullScreenLoading = false;
      this.progressTip       = '';

      await this.loadData();

      this.$refs.upload.clearFiles();
    },
    onUploadFileChange(file, fileList) {
      if (fileList.length > 1) fileList.splice(0, 1);
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
    },
    currentFolder() {
      return this.dataFilter.folder || '/';
    },
  },
  props: {
  },
  data() {
    let _dataFilter = this.T.createListQuery();

    return {
      // folder: '/',

      files      : [],
      fileNameMap: {},

      showMkdirPopover: false,
      mkdirName       : '',

      fullScreenLoading: false,
      progressTip      : '',

      dataFilter: {
        folder: _dataFilter.folder,
      }
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
  display: flex;
  align-items: center;
  justify-content: space-around;
}
.upload-button {
  display: inline-block;
}
.compact-button {
  margin-left: 0 !important;
}
.path-sep {
  width: 20px;
  text-align: center;
  display: inline-block;
  font-size: 14px;
}
</style>

<style>
.resource-navi .el-button span {
  font-family: monospace !important;
}
.popover-input .el-input {
  width: 180px;
  display: block;
}
</style>
