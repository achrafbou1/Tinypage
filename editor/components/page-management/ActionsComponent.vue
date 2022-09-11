<template>
  <div class="buttons">
    <button
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-sm"
        @click="selectProfile"
    >
      <font-awesome-icon icon="fa-solid fa-check"/>
      Select
    </button>
    <button
        v-if="!data.status || data.status === 'free'"
        class="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded text-sm"
        @click="initCheckout"
    >
      <font-awesome-icon icon="fa-solid fa-cloud-arrow-up"/>
      Upgrade
    </button>
    <button
        v-if="data.status === 'pro'"
        class="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
        @click="downgrade"
    >
      <font-awesome-icon icon="fa-solid fa-cloud-arrow-down"/>
      Downgrade
    </button>
    <button
        v-if="data.status === 'pro'"
        class="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
        @click="downgrade"
    >
      <font-awesome-icon icon="fa-solid fa-cloud-arrow-down"/>
      Downgrade
    </button>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import EventBus from "~/plugins/eventbus";

export default Vue.extend({
  name: 'ActionsComponent',
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
    async initCheckout() {
      try {
        const token = this.$store.getters['auth/getToken'];

        const response = await this.$axios.post('/stripe/create-checkout-session', {
          token,
          profileId: this.data.id
        });

        window.location.replace(response.data);
      } catch (err) {
        console.error(err);
      }
    },

    async downgrade() {
      try {
        const token = this.$store.getters['auth/getToken'];

        await this.$axios.post('/stripe/delete-subscription', {
          token,
          profileId: this.data.id
        });
        window.location.reload();

      } catch (err) {
        console.error(err);
      }
    }
  }
});
</script>
