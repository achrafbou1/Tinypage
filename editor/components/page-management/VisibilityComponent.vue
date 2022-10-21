
<template>
  <div
      v-if="data.visibility !== 'unpublished'"
      class="py-1 px-2 mb-1 rounded-full text-green-500 bg-green-200 text-sm font-extrabold leading-tight"
      style="width: fit-content"
  >{{ data.visibility?.replace(/^./, str => str.toUpperCase()) }}
  </div>
</template>
<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
    name: 'VisibilityComponent',
    props: {
      data: {
        type: Object,
        required: true
      }
    }
  });
</script>
