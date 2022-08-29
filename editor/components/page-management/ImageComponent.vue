<template>
  <img v-if="data.imageUrl" :src="data.imageUrl" alt="no-image" width="75" height="75">
  <img v-else src="https://www.gravatar.com/avatar/" alt="no-image" width="75" height="75">
</template>
<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'ImageComponent',
  props: {
    data: {
      type: Object,
      required: true
    }
  }
});
</script>
