<template>
  <el-dialog
    :visible.sync="show"
    :title="title"
    width="80%">
    <span>
      <img class="image" :src="imageSrc">
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: 'ImageDialog',
  components: {
  },
  watch: {
  },
  methods: {
    update(imageSrc) {
      this.imageSrc = imageSrc;

      this.show = true;
    },
  },
  computed: {
  },
  props: {
    title: String,
  },
  data() {
    return {
      show: false,

      imageSrc: null,
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.image {
  width: 95%;
  margin: 20px auto;
  box-shadow: 5px 5px 5px lightgrey;
  border: solid 1px lightgrey;
  display: block;
}
</style>
<style>
</style>
