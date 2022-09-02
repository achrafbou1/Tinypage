<template>
  <img
      :src="data.imageUrl ? data.imageUrl : 'https://www.gravatar.com/avatar/'"
      alt="no-image"
      class="rounded-full h-8 w-8"
>
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
