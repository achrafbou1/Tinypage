
<template>
  <div
      :class="{'py-1 px-2 mb-1 rounded-full text-sm leading-tight': true, 'bg-green-200 text-green-500': data.status === 'pro'}"
      style="width: fit-content"
  >{{ data.status ? data.status : 'free' }}</div>
</template>
<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'StatusComponent',
  props: {
    data: {
      type: Object,
      required: true
    }
  }
});
</script>
