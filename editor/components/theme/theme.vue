<template>
  <div :class="'w-full flex flex-col items-center justify-center ' + activeStyles">
    <div class="relative rounded" style="width: 201px;height:217px;overflow:hidden;">
      <iframe
          v-if="theme"
          scrolling="no"
          style="pointer-events: none;width: 375px;height: 406px;transform: scale(.536) translate(-163px, -175px);top:0;left:0;position:absolute;"
          :src="'/dashboard/appearance/preview/' + id"
          loading="lazy"
      />
    </div>
    <!--<span class="text-sm text-gray-500">Author: {{ userId }}</span>-->
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import UserProfileView from "~/components/profile/UserProfileView.vue";

export default Vue.extend({
  name: 'Theme',

  components: {
    UserProfileView
  },

  props: {
    id: String,
    colors: Object,
    label: String,
    icon: String,
    active: Boolean,
  },

  data() {
    return {
      theme: null as EditorTheme | null
    };
  },

  async beforeMount() {
    this.theme = await this.$axios.$post('/theme/' + this.id, {
      token: this.$store.getters['auth/getToken']
    }) as EditorTheme;
  },

  computed: {
    activeStyles() {
      if (!this.active) {
        return '';
      }
      return ' bg-blue-200 border-blue-600 border hover:bg-blue-300';
    }
  },

  methods: {
    profile() {
      return {
        customHtml: this.theme?.customHtml,
        customCss: this.theme?.customCss,
        imageUrl: null,
        headline: 'Lorem ipsum',
        subtitle: 'Example subtitle',
        showWatermark: true,
        metadata: {
          privacyMode: false
        }
      };
    }
  }
});
</script>
