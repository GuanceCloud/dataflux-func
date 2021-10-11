<!--
 * User: CHT
 * Date: 2020/5/25
 * Time: 9:12
-->
<template>
  <div class="super-flow__menu-container">
    <div
      v-show="visible"
      class="flow__menu-mask"
      @mousemove.stop.prevent
      @mousedown="close">
    </div>
    <ul
      v-show="visible"
      tabindex="-1"
      class="super-flow__menu"
      @mousemove.stop.prevent
      @contextmenu.prevent.stop
      @blur="close"
      :style="style">
      <template v-for="subList in list">
        <li
          class="super-flow__menu-item"
          v-for="subItem in subList"
          v-if="!subItem.hidden || !isHidden(subItem)"
          :class="{'is-disabled': subItem.disable}"
          @click="select(subItem)">
          <slot :item="subItem">
            <span class="super-flow__menu-item-icon">
              <i v-if="subItem.icon" class="fa fa-fw" :class="subItem.icon"></i>
            </span>
            <span class="super-flow__menu-item-content">
              {{subItem.label}}
            </span>
          </slot>
        </li>
        <li class="super-flow__menu-line"></li>
      </template>
    </ul>
  </div>

</template>

<script>
  import {vector} from './utils'

  export default {
    props: {
      graph: Object,
      visible: {
        type: Boolean,
        default: false
      },
      list: {
        type: Array,
        default: () => []
      },
      position: {
        type: Array,
        default: () => [0, 0]
      },
      source: {
        type: Object,
        default: () => ({})
      }
    },
    computed: {
      style() {
        return {
          left: this.position[0] + 'px',
          top: this.position[1] + 'px'
        }
      }
    },
    methods: {
      isHidden(subItem) {
        if (subItem.hidden === true) return true;

        return subItem.hidden(this.source);
      },
      select(subItem) {
        if (subItem.disable) return
        this.$emit('update:visible', false)

        subItem.selected(
          this.source,
          vector(this.position)
            .minus(this.graph.origin)
            .end
        )
      },
      close(evt) {
        this.$emit('update:visible', false)
      }
    },
    watch: {
      visible() {
        if (this.visible) {
          this.$nextTick(() => this.$el.focus())
        }
      }
    }
  }
</script>

<style>
.super-flow__menu-container .super-flow__menu {
  position: absolute;
  outline: none;
  width: 180px;
  padding: 4px 0;
  border: 2px solid #ebeef5;
  box-shadow: 3px 3px 5px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border-radius: 3px;
  z-index: 10;
  background-color: #ffffff;
  margin: 0;
}
.super-flow__menu-container .super-flow__menu-item {
  user-select: none;
  box-sizing: content-box;
  /*width: 170px;*/
  min-height: 26px;
  line-height: 26px;
  cursor: pointer;
  position: relative;
  padding: 0 4px;
}
.super-flow__menu-container .super-flow__menu-item:last-child {
  margin: 0;
}
.super-flow__menu-container .super-flow__menu-item:last-child:after {
  display: none;
}
.super-flow__menu-container .super-flow__menu-item:hover {
  background-color: #eeeeee;
}
.super-flow__menu-container .super-flow__menu-item-icon {
  float: left;
  width: 26px;
  height: 26px;
}
.super-flow__menu-container .super-flow__menu-item-content {
  float: left;
  display: inline-block;
  color: #333333;
  font-size: 14px;
  line-height: 26px;
  width: 144px;
  font-weight: normal;
}
.super-flow__menu-container .super-flow__menu-item > div {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
.super-flow__menu-container .super-flow__menu-item.is-disabled {
  cursor: no-drop;
}
.super-flow__menu-container .super-flow__menu-item.is-disabled > span {
  color: #ccc;
}
.super-flow__menu-container .super-flow__menu-item.is-disabled:hover {
  background-color: transparent;
}
.super-flow__menu-container .super-flow__menu-line {
  width: 100%;
  margin: 4px 0;
  border-bottom: 1px solid #ebeef5;
  height: 0;
}
.super-flow__menu-container .super-flow__menu-line:last-child {
  display: none;
}
.super-flow__menu-container .flow__menu-mask {
  content: '';
  position: fixed;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
  z-index: 10;
  background-color: transparent;
}
</style>
