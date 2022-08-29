<template>
  <div class="buttons">
    <button
        v-if="!data.status || data.status === 'free'"
        class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        @click="initCheckout"
    >
      <font-awesome-icon icon="fa-solid fa-cloud-arrow-up"/>
      Upgrade
    </button>
    <button
        v-if="data.status === 'pro'"
        class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        @click="downgrade"
    >
      <font-awesome-icon icon="fa-solid fa-cloud-arrow-down"/>
      Downgrade
    </button>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'ActionsComponent',
  props: {
    data: {
      type: Object,
      required: true
    }
  },
  methods: {
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
