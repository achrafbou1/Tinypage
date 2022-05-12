<template>
  <section class="flex flex-shrink-0 flex-col p-8 items-center overflow-x-hidden overflow-y-scroll">
    <div class="flex flex-row items-center justify-start mb-4 space-x-4">
      <img class="w-10" src="/icons/Rocket.svg">
      <h1 class="text-black font-extrabold tracking-tight text-3xl w-full flex flex-row items-start lg:items-center">
        Site analytics
      </h1>
    </div>

    <div
        v-if="user.activeProfile.metadata.privacyMode"
        class="flex flex-col items-center justify-center w-full p-6 rounded-2xl shadow bg-white"
    >
      <div
          class="w-full p-6 bg-red-200 border-red-600 border rounded-2xl text-red-500 flex flex-col xl:flex-row xl:items-center justify-start"
      >
        <span class="text-xl xl:text-base font-bold mb-1 xl:mb-0 xl:mr-2">Notice:</span>
        <span class="text-sm">Privacy mode is currently enabled. Disable privacy mode to collect analytics data!</span>
      </div>
    </div>

    <div class="flex flex-col justify-center items-center mb-2">
      <div>
        <label class="font-semibold mb-2">Days Range</label>
        <input
            v-model="dayRange"
            :disabled="!hasPerms"
            class="p-2 mt-2 text-sm border-solid border-gray-300 rounded-2xl border"
            style="max-width: 5rem"
            type="number"
            @blur="onDayRangeChange"
        >
      </div>
      <div v-if="!hasPerms">
        Pro tier or higher is required to view analytics beyond 30 days.
      </div>
    </div>

    <div v-if="!user.activeProfile.metadata.privacyMode" class="grid lg:grid-cols-3 gap-x-4 w-full">
      <div class="flex flex-col p-6 bg-white shadow items-center text-center rounded-2xl mb-8">
        <h2 class="font-bold text-black opacity-70 text-lg w-full mb-1">
          Total views
        </h2>
        <h4 class="text-blue-600 text-4xl leading-tight font-bold">
          {{ analytics.totalProfileViews.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') }}
        </h4>
      </div>
      <div class="flex flex-col p-6 bg-white shadow items-center text-center rounded-2xl mb-8">
        <h2 class="font-bold text-black opacity-70 text-lg w-full mb-1">
          Total clicks
        </h2>
        <h4 class="text-blue-600 text-4xl leading-tight font-bold">
          {{ visitSum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') }}
        </h4>
      </div>
      <div class="flex flex-col p-6 bg-white shadow items-center text-center rounded-2xl mb-8">
        <h2 class="font-bold text-black opacity-70 text-lg w-full mb-1">
          Click through rate
        </h2>
        <h4 class="text-blue-600 text-4xl leading-tight font-bold">
          {{ ((visitSum / (analytics.totalProfileViews === 0 ? 1 : analytics.totalProfileViews)) * 100).toFixed(2) }}%
        </h4>
      </div>
    </div>

    <div
        v-if="!user.activeProfile.metadata.privacyMode"
        class="flex flex-col p-6 bg-white shadow rounded-2xl w-full mb-8"
    >
      <h2 class="text-black font-bold opacity-70 text-lg mb-4">
        Link engagement
      </h2>

      <div
          v-for="link in analytics.linkVisits"
          :key="link.link.id"
          class="rounded-2xl shadow bg-white p-4 w-full font-medium mb-4 flex items-center justify-center lg:flex-row flex-col"
      >
        <div class="text-left mr-4 flex flex-col justify-start w-full lg:w-auto pt-1 px-2 lg:pt-0 lg:px-0">
          <span class="font-medium text-black font-bold text-lg mb-2">
            {{ link.link.label.length > 30 ? link.link.label.substring(0, 30) + '...' : link.link.label }}
          </span>
          <span
              v-if="link.link.url && link.link.url.length > 41"
              class="text-black opacity-70 font-bold overflow-x-hidden max-w-full"
          >{{ link.link.url.substring(0, 42) }}...</span>
          <span
              v-if="link.link.url && link.link.url.length < 42"
              class="text-black opacity-70 font-bold overflow-x-hidden max-w-full"
          >{{ link.link.url }}</span>
        </div>

        <span
            class="lg:ml-auto flex flex-row lg:flex-col justify-start lg:justify-end items-center mt-2 lg:mt-0 w-full lg:w-auto"
        >
            <div
                v-if="link.subLinkVisits && Object.keys(link.subLinkVisits).length > 0"
                class="flex flex-col lg:flex-row justify-start lg:justify-end items-center mt-2 lg:mt-0 w-full lg:w-auto"
            >
            <span v-for="[type, count] in Object.entries(link.subLinkVisits)" :key="type" class="ml-2 text-center">
            <span class="uppercase text-gray-800 font-bold mr-1 lg:mr-0 lg:mb-1">{{ type }} </span>
              <span><h4
                  class="mx-auto text-blue-600 text-2xl font-bold"
              >
              {{ count }}
            </h4></span>
            <span class="lg:hidden text-sm uppercase text-gray-700 font-semibold mr-2 lg:mr-0 lg:mb-1">:</span>
          </span>
            </div>
          </span>

        <div
            class="flex flex-row lg:flex-col justify-start lg:justify-end items-center mt-2 lg:mt-0 w-full lg:w-auto"
        >
          <span class="uppercase text-gray-800 font-bold mr-1 ml-2 lg:mr-0">Total clicks</span>
          <span class="lg:hidden text-sm uppercase text-gray-700 font-semibold mr-2 lg:mr-0 lg:mb-1">:</span>
          <h4 class="text-blue-600 text-2xl font-bold">
            {{ link.views.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') }}
          </h4>
        </div>
      </div>

    </div>
  </section>
</template>

<script lang="ts">
import Vue from "vue";
import {Permission} from "~/plugins/permission-utils";

export default Vue.extend({
  name: 'DashboardAnalytics',
  layout: 'dashboard',
  middleware: 'authenticated',
  data() {
    return {
      drawer: {},
      dayRange: 30,
      subLinkVisits: [],
      analytics: {
        totalProfileViews: 0,
        linkVisits: new Array<LinkVisit>(),
        clickThroughRate: 0,
      },

      visitSum: 0,
      originalHandle: '',

      user: {
        name: '',
        emailHash: '',
        activeProfile: {
          imageUrl: '',
          headline: '',
          subtitle: '',
          handle: '',
          customDomain: '',
          visibility: '',
          showWatermark: false,
          metadata: {
            privacyMode: false
          },
        }
      },

      hasPerms: true,
      subInfo: {} as (DbSubscription | DbProduct) & { product: unknown | null, price: unknown | null },
    };
  },

  head() {
    return {
      title: 'Site Analytics - ' + this.$customSettings.productName,
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'View your site analytics from your analytics dashboard.'
        },
        {
          hid: 'twitter:description',
          name: 'twitter:description',
          content: 'View your site analytics from your analytics dashboard.'
        },
        {
          hid: 'og:title',
          name: 'og:title',
          content: 'Site Analytics - ' + this.$customSettings.productName
        },
        {
          hid: 'twitter:title',
          name: 'twitter:title',
          content: 'Site Analytics - ' + this.$customSettings.productName
        },
        {
          hid: 'og:description',
          name: 'og:description',
          content: 'View your site analytics from your analytics dashboard.'
        },
      ],
    };
  },

  async mounted() {
    // @ts-ignore
    await this.getUserData();

    // @ts-ignore
    if (this.user.activeProfile.metadata.privacyMode) {
      return;
    }

    // @ts-ignore
    await this.getProfileAnalytics();
    // @ts-ignore
    for (let i = 0; i < this.analytics.linkVisits.length; i++) {
      // @ts-ignore
      this.visitSum += this.analytics.linkVisits[i].views;
    }

    const token = this.$store.getters['auth/getToken'];
    if (process.env.NODE_ENV === 'production') {
      // @ts-ignore
      this.subInfo = await this.$axios.$post('/payments/sub-info', {
        token
      });

      const permLevel = Permission.PRO.permLevel;
      // @ts-ignore
      this.hasPerms = permLevel <= Permission.parse(this.subInfo.tier).permLevel;
    }
  },
  methods: {
    onDayRangeChange(evt: Event) {
      const target = evt.target as HTMLInputElement;
      const value = target.value;
      // @ts-ignore
      this.dayRange = Number.parseInt(value);
      // @ts-ignore
      this.getProfileAnalytics().catch(() => {
      });
    },

    async getProfileAnalytics() {
      try {
        // @ts-ignore
        this.analytics = await this.$axios.$post('/analytics/profile', {
          token: this.$store.getters['auth/getToken'],
          // @ts-ignore
          dayRange: this.dayRange
        });
        // @ts-ignore
        const linkVisits = this.analytics.linkVisits;

        if (linkVisits.length > 0) {
          // @ts-ignore
          this.analytics.linkVisits = linkVisits.filter(value => {
            const type = value.link.type;
            return type !== 'image' &&
                type !== 'divider' &&
                type !== 'text' &&
                type !== 'html';
          });
        }
      } catch (err) {
        console.log('Error getting user data');
        console.log(err);
      }
    },

    async getUserData() {
      try {
        const token = this.$store.getters['auth/getToken'];

        const userResponse = await this.$axios.$post('/user', {
          token
        });

        const siteResponse = await this.$axios.$post('/profile/active-profile', {
          token
        });
        // @ts-ignore
        this.user.name = userResponse.name;
        // @ts-ignore
        this.user.emailHash = userResponse.emailHash;
        // @ts-ignore
        this.user.activeProfile = siteResponse;
        // @ts-ignore
        this.originalHandle = this.user.activeProfile.handle;
      } catch (err) {
        console.log('Error getting user data');
        console.log(err);
      }
    },
  },
});
</script>

<style lang="scss">
/**
  Animations
 */

.fade-enter-active, .fade-leave-active {
  transition: opacity .25s;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>
