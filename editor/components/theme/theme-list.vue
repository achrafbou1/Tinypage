<template>
  <div
      :id="name.replace(/([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g, '').split(' ').join('-').toLowerCase()"
      class="flex flex-col w-full justify-center"
  >
    <h2 class="font-bold text-xl py-2 border border-t-0 border-r-0 border-l-0 border-gray-200 w-full mb-2">{{
        name
      }}</h2>
    <div v-if="!addon" :class="'grid grid-cols-' + cols + ' mb-2 justify-start w-full'">
      <!-- Show active theme first -->
      <!-- :href="'/dashboard/marketplace/addon/'+theme.id+query_string" -->
      <a
          v-for="theme in themes"
          v-if="!icon && getActiveThemeId === theme.id"
          :key="theme.id"
          class="flex flex-col p-3 flex-1 hover:bg-blue-200 bg-blue-200 border border-blue-600 rounded-xl"
      >
        <theme :id="theme.id" :label="theme.label" :theme="true"/>
      </a>

      <div
          v-for="theme in themes"
          v-if="icon && getActiveThemeId === theme.id"
          :key="theme.id"
          class="flex flex-col p-3 flex-1 hover:bg-blue-200 bg-blue-200 border border-blue-600 rounded-xl"
      >
        <theme
            :id="theme.id"
            :label="theme.label"
            :theme="true"
            icon="icon"
            @click.native="selectTheme(theme.id)"
        />

        <div class="font-bold text-black mb-1 mt-2 flex flex-col items-center justify-center">
          {{ theme.label }}

          <a
              v-if="theme && icon"
              :href="'/dashboard/appearance/theme/' + theme.id"
          >
            <div
                class="bg-gray-700 hover:bg-blue-300"
                style="color: #FFF; text-shadow: 0 1px 2px #000; border-radius: 5px; height: 30px; width: 30px;"
            >
              <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M364.13 125.25L87 403l-23 45 44.99-23 277.76-277.13-22.62-22.62zM420.69 68.69l-22.62 22.62 22.62 22.63 22.62-22.63a16 16 0 000-22.62h0a16 16 0 00-22.62 0z"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="32"
                />
              </svg>
            </div>
          </a>
        </div>
      </div>
      <!-- List active themes -->
      <!-- :href="'/dashboard/marketplace/addon/'+theme.id+query_string"  -->
      <a
          v-for="theme in themes"
          v-if="!icon && getActiveThemeId !== theme.id"
          :key="theme.id"
          class="flex flex-col p-3 flex-1 hover:bg-opaqueIndigo rounded-xl"
      >
        <theme :id="theme.id" :label="theme.label" :theme="true"/>
      </a>

      <div
          v-for="theme in themes"
          v-if="icon && getActiveThemeId !== theme.id"
          :key="theme.id"
          class="cursor-pointer flex flex-col p-3 flex-1 hover:bg-opaqueIndigo rounded-xl"
      >
        <theme
            :id="theme.id"
            :icon="icon"
            :label="theme.label"
            :theme="true"
            @click.native="selectTheme(theme.id)"
        />

        <div class="font-bold text-black mb-1 mt-2 flex flex-col items-center justify-center">
          {{ theme.label }}

          <a
              v-if="theme && icon"
              :href="'/dashboard/appearance/theme/' + theme.id"
          >
            <div
                class="bg-gray-700 hover:bg-blue-300"
                style="color: #FFF; text-shadow: 0 1px 2px #000; border-radius: 5px; height: 30px; width: 30px;"
            >
              <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M364.13 125.25L87 403l-23 45 44.99-23 277.76-277.13-22.62-22.62zM420.69 68.69l-22.62 22.62 22.62 22.63 22.62-22.63a16 16 0 000-22.62h0a16 16 0 00-22.62 0z"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="32"
                />
              </svg>
            </div>
          </a>
        </div>
      </div>
    </div>

    <div v-if="addon" :class="'grid grid-cols-' + cols + ' mb-2 justify-start w-full'">
      <!-- Show active theme first -->
      <!-- :href="'/dashboard/marketplace/addon/'+theme.id+query_string"-->
      <a
          v-for="theme in themes"
          v-if="!icon && getActiveThemeId === theme.id"
          :key="theme.id"
          class="flex flex-col p-3 flex-1 hover:bg-blue-200 bg-blue-200 border border-blue-600 rounded-xl"
      >
        <theme
            :id="theme.id"
            :colors="theme.resource.colors"
            :label="theme.displayName"
        />
      </a>
      <div
          v-for="theme in themes"
          v-if="icon && active === theme.id"
          :key="theme.id"
          class="flex flex-col p-3 flex-1 hover:bg-blue-200 bg-blue-200 border border-blue-600 rounded-xl"
          @click="selectTheme(theme.id)"
      >
        <theme
            :id="theme.id"
            :colors="theme.resource.colors"
            :icon="icon"
            :label="theme.displayName"
        />

        <div class="font-bold text-black mb-1 mt-2 flex flex-col items-center justify-center">
          {{ theme.label }}

          <a
              v-if="theme && icon"
              :href="'/dashboard/appearance/theme/' + theme.id"
          >
            <div
                class="bg-gray-700 hover:bg-blue-300"
                style="color: #FFF; text-shadow: 0 1px 2px #000; border-radius: 5px; height: 30px; width: 30px;"
            >
              <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M364.13 125.25L87 403l-23 45 44.99-23 277.76-277.13-22.62-22.62zM420.69 68.69l-22.62 22.62 22.62 22.63 22.62-22.63a16 16 0 000-22.62h0a16 16 0 00-22.62 0z"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="32"
                />
              </svg>
            </div>
          </a>
        </div>
      </div>
      <!-- List active themes -->
      <!-- :href="'/dashboard/marketplace/addon/'+theme.id+query_string"-->
      <a
          v-for="theme in themes"
          v-if="!icon && active !== theme.id"
          :key="theme.id"
          class="flex flex-col p-3 flex-1 hover:bg-opaqueIndigo rounded-xl"
      >
        <theme
            :id="theme.id"
            :colors="theme.resource.colors"
            :label="theme.displayName"
        />
      </a>

      <div
          v-for="theme in themes"
          v-if="icon && active !== theme.id"
          :key="theme.id"
          class="cursor-pointer flex flex-col p-3 flex-1 hover:bg-opaqueIndigo rounded-xl"
          @click="selectTheme(theme.id)"
      >
        <theme
            :id="theme.id"
            :colors="theme.resource.colors"
            :icon="icon"
            :label="theme.displayName"
        />

        <div class="font-bold text-black mb-1 mt-2 flex flex-col items-center justify-center">
          {{ theme.label }}

          <a
              v-if="theme && icon"
              :href="'/dashboard/appearance/theme/' + theme.id"
          >
            <div
                class="bg-gray-700 hover:bg-blue-300"
                style="color: #FFF; text-shadow: 0 1px 2px #000; border-radius: 5px; height: 30px; width: 30px;"
            >
              <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M364.13 125.25L87 403l-23 45 44.99-23 277.76-277.13-22.62-22.62zM420.69 68.69l-22.62 22.62 22.62 22.63 22.62-22.63a16 16 0 000-22.62h0a16 16 0 00-22.62 0z"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="32"
                />
              </svg>
            </div>
          </a>
        </div>

      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: 'ThemeList',
  props: {
    name: String,
    themes: Array,
    cols: {
      type: Number,
      default: 3
    },
    extended: Boolean,
    icon: String,
    iconClick: String,
    itemClick: String,
    active: String,
    addon: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      query_string: '',
      activeThemeId: ''
    };
  },

  computed: {
    getActiveThemeId(): string {
      return this.activeThemeId;
    }
  },

  beforeMount() {
    if (window.location.href.split('?').length > 1) {
      this.query_string = '?' + window.location.href.split('?')[1];
    }

    this.activeThemeId = this.active;
  },

  methods: {
    async selectTheme(id: string) {
      try {
        const response = await this.$axios.$post('/profile/activate-theme', {
          token: this.$store.getters['auth/getToken'],
          id,
        });

        this.activeThemeId = response.themeId;
        // window.location.reload();
        this.$root.$emit('refreshUserProfileView');
      } catch (error) {
        console.log('Failed to activate theme');
        console.log(error);
      }
    },
  }
});
</script>
