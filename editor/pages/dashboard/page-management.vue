<template>
  <section class="flex flex-col p-8 items-center overflow-x-hidden overflow-y-scroll">
    <div class="flex flex-row items-center justify-start mb-4 space-x-4 mb-4">
      <img alt="settings svg" class="w-8" src="/icons/Person.svg">
      <h1 class="text-black font-extrabold tracking-tight text-3xl w-full flex flex-row items-start lg:items-center">
        Page Management
      </h1>
    </div>
    <DataTable v-bind="parametersTable1"/>
  </section>
</template>

<script lang="ts">
import Vue from 'vue';
// @ts-ignore
import DataTable from '@andresouzaabreu/vue-data-table';
import ImageComponent from '@/components/page-management/ImageComponent.vue';
import '@andresouzaabreu/vue-data-table/dist/DataTable.css';
import VisibilityComponent from "~/components/page-management/VisibilityComponent.vue";
import StatusComponent from "~/components/page-management/StatusComponent.vue";
import ActionsComponent from "~/components/page-management/ActionsComponent.vue";

export default Vue.extend({
  name: 'PageManagement',
  components: {
    DataTable
  },
  layout: 'dashboard',
  middleware: 'authenticated',
  data: () => {
    return {
      profiles: [] as EditorProfile[]
    };
  },
  computed: {
    parametersTable1() {
      return {
        data: this.profiles,
        columns: [
          {
            key: "imageUrl",
            title: "Avatar Photo",
            component: ImageComponent,
          },
          {
            key: "handle",
          },
          {
            key: "visibility",
            component: VisibilityComponent,
          },
          {
            key: "status",
            component: StatusComponent,
          },
          {
            key: "pageViews",
            title: "Total Views"
          },
          {
            key: "actions",
            title: "Actions",
            component: ActionsComponent,
            sortable: false
          }
        ]
      };
    },
  },
  async mounted() {
    this.profiles = await this.$axios.$post('/profiles', {
      token: this.$store.getters['auth/getToken'],
      includePaymentInfoAndAnalytics: true
    });

  },
});
</script>

<style scoped>

</style>
