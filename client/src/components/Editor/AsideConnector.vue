<i18n locale="zh-CN" lang="yaml">
Jump to...     : 跳转到...
Refresh        : 刷新列表
Add Connector  : 添加连接器
Simple Debug   : 简易调试
View           : 查看
Setup          : 配置
Example        : 示例
Copy example   : 复制示例
Copy {name} ID : 复制{name}ID

Connector pinned  : 连接器已置顶
Connector unpinned: 连接器已取消
</i18n>

<template>
  <div id="aside-connector-content">
    <el-select class="jump-to-select"
      :placeholder="$t('Jump to...')"
      :no-data-text="$t('No Data')"
      size="small"
      :filterable="true"
      :clearable="true"
      :filter-method="T.debounce(doFilter)"
      v-model="selectFilterText">
      <el-option
        v-for="item in selectShowOptions"
        :key="item.id"
        :label="item.label"
        :value="item.id">
        <span class="select-item-name">
          <el-tag class="aside-tree-node-tag"
            :type="C.CONNECTOR_MAP.get(item.connectorType).tagType"
            size="mini">{{ C.CONNECTOR_MAP.get(item.connectorType).name }}</el-tag>
          {{ item.label }}
        </span>
        <code class="select-item-id code-font">ID: {{ item.id }}</code>
      </el-option>
    </el-select>

    <el-tree class="aside-tree"
      v-loading="loading"
      :data="data"
      :highlight-current="true"
      :indent="10"
      node-key="id"
      ref="tree">

      <span
        slot-scope="{node, data}"
        class="aside-tree-node"
        :entry-id="data.id"
        @click="openEntity(node, data)">

        <!-- 菜单 -->
        <el-popover
          placement="right-start"
          trigger="hover"
          popper-class="aside-tip"
          :disabled="!!!data.id"
          :value="showPopoverId === data.id">

          <!-- 基本信息 -->
          <div class="aside-tree-node-description">
            <div>
              <el-tag class="aside-tree-node-tag-title"
                :type="C.CONNECTOR_MAP.get(data.connectorType).tagType"
                size="mini">{{ C.CONNECTOR_MAP.get(data.connectorType).name }}</el-tag>
            </div>

            <span class="text-info">ID</span>
            &nbsp;<code class="text-main">{{ data.id }}</code>
            <CopyButton :content="data.id"></CopyButton>

            <pre v-if="data.description">{{ data.description }}</pre>
          </div>

          <!-- 示例代码 -->
          <template v-if="data.sampleCode">
            <div class="aside-tree-node-sample-code">
              <span class="text-info">{{ $t('Example') }}</span>
              <CopyButton :content="data.sampleCode"></CopyButton>

              <pre>{{ data.sampleCode }}</pre>
            </div>
          </template>

          <!-- 操作 -->
          <br>
          <el-button-group>
            <!-- 简易调试 -->
            <el-button v-if="C.CONNECTOR_MAP.get(data.connectorType).debugSupported"
              size="small"
              @click="showSimpleDebugWindow(data.connector)">
              <i class="fa fa-fw fa-window-restore"></i>
              {{ $t('Simple Debug') }}
            </el-button>

            <!-- 置顶 -->
            <el-button
              size="small"
              v-prevent-re-click @click="pinData(data.type, data.id, !data.isPinned)">
              <i class="fa fa-fw" :class="[data.isPinned ? 'fa-thumb-tack fa-rotate-270' : 'fa-thumb-tack']"></i>
              {{ data.isPinned ? $t('Unpin') : $t('Pin') }}
            </el-button>

            <!-- 配置/查看 -->
            <el-button
              size="small"
              @click="openEntity(node, data, 'setup')">
              <i class="fa fa-fw" :class="[data.isBuiltin ? 'fa-search' : 'fa-wrench']"></i>
              {{ data.isBuiltin ? $t('View') : $t('Setup') }}
            </el-button>
          </el-button-group>

          <div slot="reference" class="aside-item">
            <!-- 项目内容 -->
            <span :class="{'text-watch': data.isBuiltin, 'text-bad': data.isPinned}">
              <el-link v-if="data.type === 'refresh'" type="primary">
                <i class="fa fa-fw fa-refresh"></i> {{ $t('Refresh') }}
              </el-link>
              <el-link v-else-if="data.type === 'addConnector'" type="primary">
                <i class="fa fa-fw fa-plus"></i> {{ $t('Add Connector') }}
              </el-link>
              <div v-else>
                <el-tag class="aside-tree-node-tag"
                  :type="C.CONNECTOR_MAP.get(data.connectorType).tagType"
                  size="mini">{{ C.CONNECTOR_MAP.get(data.connectorType).name }}</el-tag>
                <el-tag v-if="data.isBuiltin"
                  effect="dark"
                  type="warning"
                  size="mini">{{ $t('Builtin') }}</el-tag>
                <span>{{ node.label }}</span>
              </div>
            </span>

            <!-- 状态图标 -->
            <div>
              <el-tooltip effect="dark" :content="$t('Pinned')" placement="top" :enterable="false">
                <i class="fa fa-fw text-bad" :class="[ data.isPinned ? 'fa-thumb-tack':'' ]"></i>
              </el-tooltip>
            </div>
          </div>
        </el-popover>
      </span>
    </el-tree>

    <SimpleDebugWindow ref="simpleDebugWindow"></SimpleDebugWindow>
  </div>
</template>

<script>
import SimpleDebugWindow from '@/components/Editor/SimpleDebugWindow'

export default {
  name: 'AsideConnector',
  components: {
    SimpleDebugWindow,
  },
  watch: {
    $route() {
      this.showPopoverId = null;
    },
    selectFilterText(val) {
      if (!val) return;
      if (!this.$refs.tree) return;

      let node = this.$refs.tree.getNode(val);
      this.openEntity(node, node.data);
    },
    '$store.state.connectorListSyncTime': function() {
      this.loadData();
    },
  },
  methods: {
    doFilter(q) {
      q = (q || '').toLowerCase().trim();
      if (!q) {
        this.selectShowOptions = this.selectOptions;
      } else {
        this.selectShowOptions = this.T.searchKeywords(q, this.selectOptions);
      }
    },

    // 选中节点
    selectNode(nodeKey, options) {
      options = options || {};

      if (!this.$refs.tree) return;
      if (!nodeKey) return;

      setImmediate(() => {
        let node = this.$refs.tree.getNode(nodeKey);
        if (!node || !node.data) return;

        // 选中
        this.$refs.tree.setCurrentKey(node.data.id);

        setTimeout(() => {
          // 滚动到目标位置
          let $asideContent = document.getElementById('aside-connector-content');
          let $target = document.querySelector(`[entry-id="${node.data.id}"]`);
          if (!$target) return;

          let scrollTop = 0;
          let topPadding = 35;
          if ($asideContent.scrollTop + topPadding > $target.offsetTop) {
            scrollTop = $target.offsetTop - topPadding;
          } else if ($asideContent.scrollTop + $asideContent.offsetHeight < $target.offsetTop) {
            scrollTop = $target.offsetTop - $asideContent.offsetHeight + $target.offsetHeight;
          } else {
            return;
          }
          $asideContent.scrollTo({ top: scrollTop, behavior: 'smooth' });
        }, 300);
      });
    },

    async loadData() {
      this.loading = true;

      let apiRes = await this.T.callAPI_getAll('/api/v1/connectors/do/list', {
        query: { fields: ['id', 'title', 'description', 'type', 'configJSON', 'isBuiltin', 'isPinned', 'pinTime'] },
      });
      if (!apiRes || !apiRes.ok) return;

      let treeData = [];
      window._DFF_connectorIds = [];
      apiRes.data.forEach(d => {
        window._DFF_connectorIds.push(d.id);

        // 缩减描述行数
        d.description = this.T.limitLines(d.description, 10);

        // 示例代码
        let sampleCode = this.T.strf(this.C.CONNECTOR_MAP.get(d.type).sampleCode, d.id);

        // 创建节点数据
        let treeNode = {
          id            : d.id,
          label         : d.title || d.id,
          type          : 'connector',
          connectorType : d.type,
          isBuiltin     : d.isBuiltin,
          isPinned      : d.isPinned,
          pinTime       : d.pinTime,

          title      : d.title,
          description: d.description,
          sampleCode : sampleCode,

          connector: d,
        };
        this.T.appendSearchFields(treeNode, ['id', 'title'])

        treeData.push(treeNode);
      });
      treeData.sort(this.T.asideItemSorter);
      treeData.unshift({type: 'addConnector'});
      treeData.unshift({type: 'refresh'});

      // 生成选择器选项
      let selectOptions = treeData.filter(x => x.type === 'connector');

      // 加载数据
      this.loading           = false;
      this.data              = treeData;
      this.selectOptions     = selectOptions;
      this.selectShowOptions = selectOptions;

      // 自动选择
      this.selectNode(this.$route.params.id);
    },
    async pinData(dataType, dataId, isPinned) {
      let apiPath   = null;
      let okMessage = null;
      switch(dataType) {
        case 'connector':
          apiPath   = '/api/v1/connectors/:id/do/modify';
          okMessage = isPinned
                    ? this.$t('Connector pinned')
                    : this.$t('Connector unpinned');
          break;

        default:
          return;
      }
      let apiRes = await this.T.callAPI('post', apiPath, {
        params: { id: dataId },
        body  : { data: { isPinned: isPinned } },
        alert : { okMessage: okMessage },
      });
      if (!apiRes || !apiRes.ok) return;

      this.$store.commit('updateConnectorListSyncTime');
    },
    showSimpleDebugWindow(connector) {
      this.$refs.simpleDebugWindow.showWindow(connector);
    },
    openEntity(node, data, target) {
      switch(data.type) {
        // 刷新
        case 'refresh':
          this.loadData();
          break;

        // 「添加连接器」节点
        case 'addConnector':
          this.$router.push({
            name: 'connector-add',
          });
          break;

        // 连接器节点
        case 'connector':
          this.selectNode(data.id);

          this.$router.push({
            name  : 'connector-setup',
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
      loading: false,
      data   : [],

      selectFilterText : '',
      selectOptions    : [],
      selectShowOptions: [],

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
.jump-to-select {
  position: absolute;
  left: 5px;
  right: 9px;
  z-index: 9;
}
.select-item-name {
  float: left;
}
.select-item-id {
  float: right;
  padding-left: 30px;
  font-size: 12px;
}

.aside-tree {
  padding-top: 35px;
}
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

.aside-tree-node > span {
  display: block;
  width: 100%;
}
.aside-item {
  height: 31px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
