<template>
  <div class="buttons">
    <button
        v-if="(!data.status || data.status === 'free') && $store.state.auth.currentPermission?.name !== 'godmode'"
        class="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded text-sm"
        @click="$modal.show('upgrade')"
    >
      <font-awesome-icon icon="fa-solid fa-cloud-arrow-up"/>
      Upgrade
    </button>
    <modal name="upgrade" height="550px" width="880px">
      <!-- Upgrade modal -->
      <div
          class="flex items-center justify-center"
          style="backdrop-filter: saturate(180%) blur(5px);"
          @click="$modal.hide('upgrade')"
      >
        <div class="flex flex-col p-6 mt-8 bg-white shadow rounded-2xl w-full max-w-3xl" @click.stop>
          <h2 class="text-black font-semibold text-xl">
            Please select your plan:
          </h2>
          <PricingComponent :data="data" />
          <button
              class="mt-4 w-full p-4 text-center text-md text-black bg-gray-400 hover:bg-gray-700 text-white rounded-2xl font-semibold"
              type="button"
              @click="$modal.hide('upgrade')"
          >
            Cancel
          </button>
        </div>
      </div>
    </modal>
    <button
        v-if="data.status === 'pro' && !$store.currentPermission?.name !== 'godmode'"
        class="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
        @click="$modal.show('downgrade')"
    >
      <font-awesome-icon icon="fa-solid fa-cloud-arrow-down"/>
      Downgrade
    </button>
    <modal name="downgrade">
      <!-- Confirm downgrade modal -->
      <div
          class="flex items-center justify-center"
          style="backdrop-filter: saturate(180%) blur(5px);"
          @click="$modal.hide('downgrade')"
      >
        <div class="flex flex-col p-6 mt-8 bg-white shadow rounded-2xl w-full max-w-lg" @click.stop>
          <h2 class="text-black font-semibold text-xl">
            Are you sure ?
          </h2>
          <button
              class="mt-4 w-full p-4 text-center text-md text-black bg-red-600 hover:bg-red-700 text-white rounded-2xl font-semibold"
              type="button"
              @click="downgrade"
          >
            Yes, downgrade
          </button>
          <button
              class="mt-4 w-full p-4 text-center text-md text-black bg-gray-400 hover:bg-gray-700 text-white rounded-2xl font-semibold"
              type="button"
              @click="$modal.hide('downgrade')"
          >
            Cancel
          </button>
        </div>
      </div>
    </modal>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import PricingComponent from "~/components/page-management/PricingComponent.vue";

export default Vue.extend({
  name: 'ActionsComponent',
  components: {PricingComponent},
  props: {
    data: {
      type: Object,
      required: true
    }
  },
  methods: {
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
