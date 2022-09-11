<template>
  <div class="buttons">
    <button
        class="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
        @click="removeTeamMember"
    >
      <font-awesome-icon icon="fa-solid fa-trash"/>
      Remove
    </button>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import EventBus from '~/plugins/eventbus';

export default Vue.extend({
  name: 'ActionsComponentTeamMembers',
  props: {
    data: {
      type: Object,
      required: true
    }
  },
  methods: {
    async removeTeamMember() {
      const token = this.$store.getters['auth/getToken'];

      await this.$axios.post('/team/remove', {
        token,
        email: this.data.email,
        profileId: this.data.profileId
      });
      EventBus.$emit('getTeamMembers');
    },
  }
});
</script>
