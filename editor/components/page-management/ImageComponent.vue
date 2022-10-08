<template>
  <button>
    <img
        :src="data.imageUrl ? data.imageUrl : 'https://www.gravatar.com/avatar/'"
        alt="no-image"
        class="rounded-full h-8 w-8"
        @click="selectProfile"
    >
  </button>
</template>
<script lang="ts">
import Vue from 'vue';
import EventBus from "~/plugins/eventbus";

export default Vue.extend({
  name: 'ImageComponent',
  props: {
    data: {
      type: Object,
      required: true
    }
  },
  methods: {
    selectProfile() {
      EventBus.$emit('selectProfile', {profileId: this.data.id});
    },
  }
});
</script>
