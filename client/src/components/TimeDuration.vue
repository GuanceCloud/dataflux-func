<template>
  <span>
    <template v-if="T.notNothing(duration)">
      <template v-if="dataMS > 3000">
        <span v-if="years">
          <strong>{{ years }}</strong> {{ $t('y') }}
        </span>
        <span v-if="days">
          <strong>{{ days }}</strong> {{ $t('d') }}
        </span>
        <span v-if="hours">
          <strong>{{ hours }}</strong> {{ $t('h') }}
        </span>
        <span v-if="minutes">
          <strong>{{ minutes }}</strong> {{ $t('m') }}
        </span>
        <span v-if="seconds">
          <strong>{{ seconds }}</strong> {{ $t('s') }}
        </span>
      </template>
      <span v-else>
        <strong>{{ dataMS }}</strong> {{ $t('ms') }}
      </span>
    </template>
    <template v-else>-</template>
  </span>
  </el-tooltip>

</template>

<script>
export default {
  name: 'TimeDuration',
  components: {
  },
  watch: {
  },
  methods: {
  },
  computed: {
    YEAR_SECONDS() {
      return 3600 * 24 * 365;
    },
    DAY_SECONDS() {
      return 3600 * 24;
    },
    HOUR_SECONDS() {
      return 3600;
    },
    MINUTE_SECONDS() {
      return 60;
    },
    dataS() {
      if (this.T.isNothing(this.duration)) return null;

      switch (this.unit) {
        case 's':
          return parseInt(this.duration);

        case 'ms':
          return parseInt(this.duration / 1000);
      }
    },
    dataMS() {
      if (this.T.isNothing(this.duration)) return null;

      switch (this.unit) {
        case 's':
          return parseInt(this.duration * 1000);

        case 'ms':
          return parseInt(this.duration);
      }
    },
    years() {
      if (this.T.isNothing(this.duration)) return null;
      if (this.dataS < this.YEAR_SECONDS) return 0;
      return parseInt(this.dataS / this.YEAR_SECONDS);
    },
    days() {
      if (this.T.isNothing(this.duration)) return null;
      if (this.dataS < this.DAY_SECONDS) return 0;
      return parseInt((this.dataS % this.YEAR_SECONDS) / this.DAY_SECONDS);
    },
    hours() {
      if (this.T.isNothing(this.duration)) return null;
      if (this.dataS < this.HOUR_SECONDS) return 0;
      return parseInt((this.dataS % this.DAY_SECONDS) / this.HOUR_SECONDS);
    },
    minutes() {
      if (this.T.isNothing(this.duration)) return null;
      if (this.dataS < this.MINUTE_SECONDS) return 0;
      return parseInt((this.dataS % this.HOUR_SECONDS) / this.MINUTE_SECONDS);
    },
    seconds() {
      if (this.T.isNothing(this.duration)) return null;
      if (this.dataMS % 1000 === 0) return 0;
      return ((this.dataMS / 1000) % this.MINUTE_SECONDS).toFixed(1);
    },
  },
  props: {
    duration: Number,

    unit: {
      type: String,
      default: 's',
    },
  },
  data() {
    return {}
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
