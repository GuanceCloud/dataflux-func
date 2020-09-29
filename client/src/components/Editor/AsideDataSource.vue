<template>
  <div>
    <el-input placeholder="过滤内容" size="small" :clearable="true" v-model="filterText">
      <el-button slot="prefix" type="text" size="small"></el-button>
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
          <el-link v-if="data.type === 'addDataSource'" type="primary" :underline="false">
            <i class="fa fa-fw fa-plus"></i>（添加数据源）
          </el-link>
          <div v-else>
            <el-tag class="aside-tree-node-tag" :type="C.DATE_SOURCE_MAP[data.dataSourceType].tagType" size="mini"><span>{{ C.DATE_SOURCE_MAP[data.dataSourceType].name }}</span></el-tag>
            <span :class="{builtin: data.isBuiltin}">{{ node.label }}</span>
          </div>
        </span>

        <div v-if="data.type === 'dataSource'">
          <el-tooltip effect="dark" content="简易调试面板" placement="left" :enterable="false">
            <span>
              <el-button v-if="C.DATE_SOURCE_MAP[data.dataSourceType].debugSupported"
                type="text"
                size="small"
                @click.stop="showSimpleDebugWindow(data.dataSource)">
                <i class="fa fa-fw fa-window-restore text-info"></i>
              </el-button>
            </span>
          </el-tooltip>

          <el-tooltip effect="dark" :content="data.isBuiltin ? '查看' : '配置'" placement="top" :enterable="false">
            <span>
              <el-button v-if="data.type !== 'addDataSource'"
                type="text"
                size="small"
                @click.stop="openEntity(node, data, 'setup')">
                <i v-if="data.isBuiltin" class="fa fa-fw fa-search text-info"></i>
                <i v-else class="fa fa-fw fa-wrench text-info"></i>
              </el-button>
            </span>
          </el-tooltip>

          <el-popover v-if="data.tip"
            placement="right-start"
            trigger="hover"
            transition="el-fade-in"
            popper-class="aside-tip"
            :close-delay="500">
            <pre class="aside-tree-node-description">{{ data.tip.description }}</pre>

            <div v-if="data.tip.sampleCode" class="aside-tree-node-sample-code">
              示例代码：
              <pre>{{ data.tip.sampleCode }}</pre>
              <CopyButton title="复制示例代码" size="mini" :content="data.tip.sampleCode"></CopyButton>
            </div>

            <div class="aside-tree-node-simple-debug" v-if="C.DATE_SOURCE_MAP[data.dataSourceType].debugSupported">
              <el-button
                size="mini"
                type="primary" plain
                @click.stop="showSimpleDebugWindow(data.dataSource)">
                <i class="fa fa-fw fa-window-restore"></i> 打开简易调试面板
              </el-button>
            </div>

            <el-button slot="reference"
              type="text"
              size="small"
              @click.stop>
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
    filterText(val) {
      this.$refs.tree.filter(val);
    },
    dataSourceListSyncTime() {
      this.loadData();
    },
  },
  methods: {
    filterNode(value, data) {
      if (!value) return true;

      let targetValue = ('' + value).toLowerCase();
      let searchTEXT  = ('' + data.searchTEXT).toLowerCase();

      return searchTEXT.indexOf(targetValue) >= 0;
    },
    async loadData() {
      this.loading = true;

      let apiRes = await this.T.callAPI_allPage('/api/v1/data-sources/do/list', {
        query: {fieldPicking: ['id', 'title', 'description', 'type', 'configJSON', 'isBuiltin']},
        alert: {entity: '数据源', showError: true},
      });
      if (!apiRes.ok) return;

      let treeData = [];
      window._DFF_dataSourceIds = [];
      apiRes.data.forEach(d => {
        window._DFF_dataSourceIds.push(d.id);

        // 缩减描述行数
        d.description = this.T.limitLines(d.description);

        // 示例代码
        let sampleCode = this.T.strf(this.C.DATE_SOURCE_MAP[d.type].sampleCode, d.id);

        // 创建节点数据
        treeData.push({
          id            : d.id,
          label         : d.title || d.id,
          type          : 'dataSource',
          dataSourceType: d.type,
          isBuiltin     : d.isBuiltin,
          searchTEXT    : `${d.title} ${d.type} ${d.id}`,
          tip: {
            description: d.description,
            sampleCode : sampleCode,
          },

          dataSource: d,
        });
      });

      treeData.push({type: 'addDataSource'});

      this.loading = false;
      this.data = treeData;
    },
    showSimpleDebugWindow(dataSource) {
      this.$refs.simpleDebugWindow.showWindow(dataSource);
    },
    openEntity(node, data, target) {
      if (target === 'setup') {
        this.$refs.tree.setCurrentKey(data.id);
      }

      switch(data.type) {
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
  computed: {
    dataSourceListSyncTime() {
      return this.$store.state.dataSourceListSyncTime;
    },
  },
  props: {
  },
  data() {
    return {
      loading   : false,
      filterText: '',
      data      : [],
    };
  },
  created() {
    this.loadData();
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
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
.aside-tree-node-tag {
  width: 75px;
  text-align: center;
}
pre.aside-tree-node-description {
  padding: 0;
  margin: 0;
  font-size: 14px;
}
.aside-tree-node-sample-code {
  padding-top: 10px;
  color: grey;
  text-align: left;
}
.aside-tree-node-sample-code pre {
  padding: 10px 0 0 15px;
  margin: 0;
  font-size: 12px;
  color: black;
}
.aside-tree-node-sample-code .copy-button {
  padding-left: 10px
}
.aside-tree-node-simple-debug {
  padding-top: 10px;
  color: grey;
  text-align: left;
}
.builtin {
  color: orangered;
  text-shadow: #ffa5004d 0 0 10px;
}
</style>
