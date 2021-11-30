<i18n locale="zh-CN" lang="yaml">
filter content : 过滤内容
Refresh        : 刷新列表
Add Data Source: 添加数据源
Simple Debug   : 简易调试
View           : 查看
Setup          : 配置
Example        : 示例
Copy example   : 复制示例
Copy {name} ID : 复制{name}ID

Data Source pinned  : 数据源已置顶
Data Source unpinned: 数据源已取消
</i18n>

<template>
  <div>
    <el-input :placeholder="$t('filter content')" size="small" :clearable="true" v-model="filterText">
      <el-button slot="prefix" type="text"></el-button>
    </el-input>

    <el-tree
      v-loading="loading"
      :data="data"
      :filter-node-method="filterNode"
      :highlight-current="true"
      :indent="10"
      node-key="id"
      ref="tree">

      <span
        slot-scope="{node, data}"
        class="aside-tree-node"
        @click="openEntity(node, data)">

        <span :class="{'text-watch': data.isBuiltin, 'text-bad': data.isPinned}">
          <el-link v-if="data.type === 'refresh'" type="primary" :underline="false">
            <i class="fa fa-fw fa-refresh"></i> {{ $t('Refresh') }}
          </el-link>
          <el-link v-else-if="data.type === 'addDataSource'" type="primary" :underline="false">
            <i class="fa fa-fw fa-plus"></i> {{ $t('Add Data Source') }}
          </el-link>
          <div v-else>
            <el-tag class="aside-tree-node-tag"
              :type="C.DATA_SOURCE_MAP.get(data.dataSourceType).tagType"
              size="mini">{{ C.DATA_SOURCE_MAP.get(data.dataSourceType).name }}</el-tag>
            <el-tag v-if="data.isBuiltin"
              effect="dark"
              type="warning"
              size="mini">{{ $t('Builtin') }}</el-tag>
            <span>{{ node.label }}</span>
          </div>
        </span>

        <div v-if="data.type === 'dataSource'">
          <!-- 状态图标 -->
          <el-tooltip effect="dark" :content="$t('Pinned')" placement="top" :enterable="false">
            <i v-if="data.isPinned" class="fa fa-fw fa-thumb-tack text-bad"></i>
          </el-tooltip>

          <!-- 菜单 -->
          <el-popover v-if="data.id"
            placement="right-start"
            trigger="hover"
            popper-class="aside-tip"
            :value="showPopoverId === data.id">

            <!-- 基本信息 -->
            <div class="aside-tree-node-description">
              <div>
                <el-tag class="aside-tree-node-tag-title"
                  :type="C.DATA_SOURCE_MAP.get(data.dataSourceType).tagType"
                  size="mini">{{ C.DATA_SOURCE_MAP.get(data.dataSourceType).name }}</el-tag>
              </div>

              <CopyButton :content="data.id" tip-placement="left"></CopyButton>
              ID{{ $t(':') }}<code class="text-code">{{ data.id }}</code>

              <pre v-if="data.description">{{ data.description }}</pre>
            </div>

            <!-- 示例代码 -->
            <template v-if="data.sampleCode">
              <div class="aside-tree-node-sample-code">
                <CopyButton v-if="data.sampleCode" :content="data.sampleCode" tip-placement="left"></CopyButton>
                {{ $t('Example') }}{{ $t(':') }}

                <pre>{{ data.sampleCode }}</pre>
              </div>
            </template>

            <!-- 操作 -->
            <br>
            <el-button-group>
              <!-- 简易调试 -->
              <el-button v-if="C.DATA_SOURCE_MAP.get(data.dataSourceType).debugSupported"
                size="small"
                @click.stop="showSimpleDebugWindow(data.dataSource)">
                <i class="fa fa-fw fa-window-restore"></i>
                {{ $t('Simple Debug') }}
              </el-button>

              <!-- 置顶 -->
              <el-button
                size="small"
                @click.stop="pinData(data.type, data.id, !data.isPinned)">
                <i class="fa fa-fw" :class="[data.isPinned ? 'fa-thumb-tack fa-rotate-270' : 'fa-thumb-tack']"></i>
                {{ data.isPinned ? $t('Unpin') : $t('Pin') }}
              </el-button>

              <!-- 配置/查看 -->
              <el-button
                size="small"
                @click.stop="openEntity(node, data, 'setup')">
                <i class="fa fa-fw" :class="[data.isBuiltin ? 'fa-search' : 'fa-wrench']"></i>
                {{ data.isBuiltin ? $t('View') : $t('Setup') }}
              </el-button>
            </el-button-group>

            <el-button slot="reference"
              type="text"
              class="text-info"
              @click.stop="showPopover(data.id)">
              <i class="fa fa-fw fa-bars"></i>
            </el-button>
          </el-popover>
        </div>
      </span>
    </el-tree>

    <SimpleDebugWindow ref="simpleDebugWindow"></SimpleDebugWindow>
  </div>
</template>

<script>
import SimpleDebugWindow from '@/components/Editor/SimpleDebugWindow'

export default {
  name: 'AsideDataSource',
  components: {
    SimpleDebugWindow,
  },
  watch: {
    $route() {
      this.showPopoverId = null;
    },
    filterText(val) {
      this.$refs.tree.filter(val);
    },
    '$store.state.dataSourceListSyncTime': function() {
      this.loadData();
    },
  },
  methods: {
    filterNode(value, data) {
      if (!value) return true;
      if (['addDataSource', 'refresh'].indexOf(data.type) >= 0) return true;

      let targetValue = ('' + value).toLowerCase();
      let searchTEXT  = ('' + data.searchTEXT).toLowerCase();

      return searchTEXT.indexOf(targetValue) >= 0;
    },
    async loadData() {
      this.loading = true;

      let apiRes = await this.T.callAPI_getAll('/api/v1/data-sources/do/list', {
        query: { fields: ['id', 'title', 'description', 'type', 'configJSON', 'isBuiltin', 'isPinned', 'pinTime'] },
      });
      if (!apiRes.ok) return;

      let treeData = [];
      window._DFF_dataSourceIds = [];
      apiRes.data.forEach(d => {
        window._DFF_dataSourceIds.push(d.id);

        // 缩减描述行数
        d.description = this.T.limitLines(d.description, 10);

        // 示例代码
        let sampleCode = this.T.strf(this.C.DATA_SOURCE_MAP.get(d.type).sampleCode, d.id);

        // 创建节点数据
        treeData.push({
          id            : d.id,
          label         : d.title || d.id,
          type          : 'dataSource',
          dataSourceType: d.type,
          isBuiltin     : d.isBuiltin,
          isPinned      : d.isPinned,
          pinTime       : d.pinTime,
          searchTEXT    : `${d.title} ${d.type} ${d.id}`,

          title      : d.title,
          description: d.description,
          sampleCode : sampleCode,

          dataSource: d,
        });
      });
      treeData.sort(this.T.asideItemSorter);
      treeData.unshift({type: 'addDataSource'});
      treeData.unshift({type: 'refresh'});

      this.loading = false;
      this.data = treeData;
    },
    async pinData(dataType, dataId, isPinned) {
      let apiPath   = null;
      let okMessage = null;
      switch(dataType) {
        case 'dataSource':
          apiPath   = '/api/v1/data-sources/:id/do/modify';
          okMessage = isPinned
                    ? this.$t('Data Source pinned')
                    : this.$t('Data Source unpinned');
          break;

        default:
          return;
      }
      let apiRes = await this.T.callAPI('post', apiPath, {
        params: { id: dataId },
        body  : { data: { isPinned: isPinned } },
        alert : { okMessage: okMessage },
      });
      if (!apiRes.ok) return;

      this.$store.commit('updateDataSourceListSyncTime');
    },
    showSimpleDebugWindow(dataSource) {
      this.$refs.simpleDebugWindow.showWindow(dataSource);
    },
    showPopover(id) {
      setImmediate(() => {
        this.showPopoverId = id;
      })
    },
    openEntity(node, data, target) {
      if (target === 'setup') {
        this.$refs.tree.setCurrentKey(data.id);
      }

      switch(data.type) {
        // 刷新
        case 'refresh':
          this.loadData();
          break;

        // 「添加数据源」节点
        case 'addDataSource':
          this.$router.push({
            name: 'data-source-add',
          });
          break;

        // 数据源节点
        case 'dataSource':
          this.$router.push({
            name  : 'data-source-setup',
            params: {id: data.id},
          });
          break;

        default:
          console.error(`Unexcepted data type: ${data.type}`);
          break;
      }
    },
  },
  props: {
  },
  data() {
    return {
      loading   : false,
      filterText: '',
      data      : [],

      showPopoverId: null,
    };
  },
  created() {
    this.loadData();
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.aside-tree-node-tag {
  width: 75px;
  text-align: center;
}
.aside-tree-node-tag-title {
  width: 100%;
  text-align: center;
  margin-bottom: 10px;
}
.aside-tree-node-tag * {
  font-family: Arial;
}
.aside-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
  height: 31px;
}
.aside-tree-node i.fa {
  font-size: 14px;
}
.aside-tip pre {
  padding: 0 0 0 10px;
  margin: 0;
  font-size: 14px;
}
.aside-tree-node-description {

}
.aside-tree-node-sample-code {
  padding-top: 10px;
  text-align: left;
}
.aside-tree-node-simple-debug {
  margin-left: 5px;
}
.builtin {
  color: orangered;
  text-shadow: #ffa5004d 0 0 10px;
}
</style>
