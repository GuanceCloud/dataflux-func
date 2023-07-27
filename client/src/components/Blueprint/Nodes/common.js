import app from '@/main';

const $t = function(s) {
  return app ? app.$t(s) : s;
}
