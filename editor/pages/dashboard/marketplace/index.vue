<template>
  <section class="flex flex-col p-8 items-center overflow-x-hidden overflow-y-scroll">
    <!-- Start featured section -->
    <div
        v-if="addons.featured.length>0"
        class="mb-8 flex flex-row items-center space-x-8 w-full p-8 rounded-xl bg-opaqueIndigo"
    >
      <div class="relative rounded-xl" style="width: 201px; height: 217px; overflow: hidden;">
        <iframe
            :src="'/dashboard/marketplace/preview/' + addons.featured[0].id"
            scrolling="no"
            style="pointer-events: none; width: 375px; height: 406px; transform: scale(0.536) translate(-163px, -175px); top: 0px; left: 0px; position: absolute;"
        /> <!----> <!----></div>
      <div class="flex flex-col">
        <p class="text-blue-600 uppercase tracking-widest text-sm font-bold">
          Featured addon
        </p>
        <h2 class="text-2xl font-bold my-1">
          {{ addons.featured[0].displayName }}
        </h2>
        <span class="text-black opacity-80 font-medium mb-4">{{ addons.featured[0].description }}</span>
        <a
            :href="'/dashboard/marketplace/addon/' + addons.featured[0].id"
            class="bg-gdp rounded-xl px-6 py-3 text-sm font-semibold text-white hover:bg-blue-400"
            style="width:fit-content;"
        >See details</a>
      </div>
    </div>
    <!-- End featured section -->
    <theme-list
        v-if="addons.hot.length>0"
        :addon="true"
        :extended="false"
        :preview="false"
        :themes="addons.hot"
        class="mb-8"
        name="Trending themes"
    />
    <theme-list
        v-if="addons.new.length>0"
        :addon="true"
        :extended="false"
        :preview="false"
        :themes="addons.new"
        class="mb-8"
        name="Newest themes"
    />
    <theme-list
        v-if="addons.submissions.length>0"
        :addon="true"
        :extended="false"
        :preview="false"
        :themes="addons.submissions"
        class="mb-8"
        name="Your submissions"
    />
  </section>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: 'DashboardMarketplace',
  layout: 'dashboard',
  middleware: 'authenticated',

  data() {
    return {
      error: '',
      addons: {
        featured: new Array<Addon>(),
        hot: new Array<Addon>(),
        new: new Array<Addon>(),
        query: new Array<Addon>(),
        submissions: new Array<Addon>(),
      },
      top_feature: null,
      userId: '',
      isAdmin: false,
      query: null as any,
      user: {} as User & { "activeProfile": EditorProfile },
      originalHandle: ''
    };
  },

  mounted() {
    this.getUserData();
    this.loadAddons();
  },

  methods: {
    async loadAddons() {
      try {
        // Fetch featured addons from response
        this.addons.featured = (await this.$axios.$post <Addon[]>('/marketplace/addons', {
          sorting: "featured",
          token: this.$store.getters['auth/getToken'],
          detailed: true
        }));
        // Fetch hottest addons from response
        this.addons.hot = (await this.$axios.$post <Addon[]>('/marketplace/addons', {
          sorting: "currentInstalls",
          token: this.$store.getters['auth/getToken'],
          detailed: true,
          limit: 8
        }));
        // Grab newest addons from response
        this.addons.new = (await this.$axios.$post <Addon[]>('/marketplace/addons', {
          sorting: "new",
          token: this.$store.getters['auth/getToken'],
          detailed: true,
          limit: 8
        }));
      } catch (error) {
        console.log('Failed to get addons');
        console.log(error);
      }
    },

    async getUserData() {
      try {
        const token = this.$store.getters['auth/getToken'];

        const siteResponse = await this.$axios.$post('/profile/active-profile', {
          token
        });

        this.user.activeProfile = siteResponse;

        this.originalHandle = this.user.activeProfile.handle;
      } catch (err) {
        console.log('Error getting user data');
        console.log(err);
      }
    },
  }
});
</script>
