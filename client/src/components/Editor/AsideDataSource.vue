<i18n locale="zh-CN" lang="yaml">
filter content         : 过滤内容
Refresh                : 刷新列表
Add Data Source        : 添加数据源
Simple Debug Panel     : 简易调试面板
View                   : 查看
Setup                  : 配置
Example                : 示例
Copy example           : 复制示例
Copy {name} ID         : 复制{name}ID
Open Simple Debug Panel: 打开简易调试面板
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

        <span>
          <el-link v-if="data.type === 'refresh'" type="primary" :underline="false">
            <i class="fa fa-fw fa-refresh"></i> {{ $t('Refresh') }}
          </el-link>
          <el-link v-else-if="data.type === 'addDataSource'" type="primary" :underline="false">
            <i class="fa fa-fw fa-plus"></i> {{ $t('Add Data Source') }}
          </el-link>
          <div v-else>
            <el-tag class="aside-tree-node-tag" :type="C.DATE_SOURCE_MAP.get(data.dataSourceType).tagType" size="mini"><span>{{ C.DATE_SOURCE_MAP.get(data.dataSourceType).name }}</span></el-tag>
            <span :class="{builtin: data.isBuiltin}">{{ node.label }}</span>
          </div>
        </span>

        <div v-if="data.type === 'dataSource'">
          <el-tooltip effect="dark" :content="$t('Simple Debug Panel')" placement="left" :enterable="false">
            <span>
              <el-button v-if="C.DATE_SOURCE_MAP.get(data.dataSourceType).debugSupported"
                type="text"
                @click.stop="showSimpleDebugWindow(data.dataSource)">
                <i class="fa fa-fw fa-window-restore text-info"></i>
              </el-button>
            </span>
          </el-tooltip>

          <el-tooltip effect="dark" :content="data.isBuiltin ? $t('View') : $t('Setup')" placement="top" :enterable="false">
            <span>
              <el-button v-if="data.type !== 'addDataSource'"
                type="text"
                @click.stop="openEntity(node, data, 'setup')">
                <i v-if="data.isBuiltin" class="fa fa-fw fa-search text-info"></i>
                <i v-else class="fa fa-fw fa-wrench text-info"></i>
              </el-button>
            </span>
          </el-tooltip>

          <el-popover v-if="data.id"
            placement="right-start"
            trigger="click"
            popper-class="aside-tip"
            :value="showPopoverId === data.id">
            <div class="aside-tree-node-description">
              <code>{{ data.title || data.id }}</code>
              <pre v-if="data.description">{{ data.description }}</pre>
            </div>

            <template v-if="data.sampleCode">
              <div class="aside-tree-node-sample-code">
                {{ $t('Example') }}{{ $t(':') }}
                <pre>{{ data.sampleCode }}</pre>
              </div>
            </template>

            <br><CopyButton
              :title="$t('Copy {name} ID', { name: C.ASIDE_ITEM_TYPE_MAP.get(data.type).name })"
              :content="data.id"></CopyButton>
            <br><CopyButton v-if="data.sampleCode"
              :title="$t('Copy example')"
              :content="data.sampleCode"></CopyButton>
            <br><el-button v-if="C.DATE_SOURCE_MAP.get(data.dataSourceType).debugSupported"
              class="aside-tree-node-simple-debug"
              type="text"
              @click.stop="showSimpleDebugWindow(data.dataSource)">
              <i class="fa fa-fw fa-window-restore"></i> {{ $t('Open Simple Debug Panel') }}
            </el-button>

            <el-button slot="reference"
              type="text"
              @click.stop="showPopover(data.id)">
              <i class="fa fa-fw fa-question-circle"></i>
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
        query: { fields: ['id', 'title', 'description', 'type', 'configJSON', 'isBuiltin'] },
      });
      if (!apiRes.ok) return;

      let treeData = [];
      window._DFF_dataSourceIds = [];
      apiRes.data.forEach(d => {
        window._DFF_dataSourceIds.push(d.id);

        // 缩减描述行数
        d.description = this.T.limitLines(d.description, 10);

        // 示例代码
        let sampleCode = this.T.strf(this.C.DATE_SOURCE_MAP.get(d.type).sampleCode, d.id);

        // 创建节点数据
        treeData.push({
          id            : d.id,
          label         : d.title || d.id,
          type          : 'dataSource',
          dataSourceType: d.type,
          isBuiltin     : d.isBuiltin,
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
  padding-top: 5px;
  padding-bottom: 5px;
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
  color: grey;
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
