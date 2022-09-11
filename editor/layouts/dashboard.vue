<template>
  <div class="white-gradient flex flex-col items-center justify-center">
    <component :is="'style'" v-if="$customSettings.customCss">
      {{ $customSettings.customCss }}
    </component>

    <div
        class="flex flex-row w-full justify-between relative"
        style="z-index:2;background:linear-gradient(180deg, rgba(255,255,255) 60%, rgba(255,255,255,.65) 80%, rgba(255,255,255,0) 100%);max-width:1520px;"
    >
      <!--      <div class="flex flex-row items-center justify-start bg-opaqueBlack px-4 py-1 rounded-full w-full max-w-md"-->
      <!--           style="border: solid 2px rgba(0,0,0,.15);">-->
      <!--        <img src="/icons/Compass.svg" style="width: 16px;height:auto;"/>-->
      <!--        <input type="text" class="font-bold flex-grow flex-1 text-sm ml-2" style="background:transparent;"-->
      <!--               placeholder="Search pages, guides, and documentation..."/>-->
      <!--      </div>-->
      <!--<n-link to="/dashboard/referrals" class="py-1 px-4 rounded-full text-gdp bg-opaqueIndigo text-sm font-bold leading-tight mx-8 cursor-pointer flex items-center justify-center hover:border-gdp border-2 border-opaqueIndigo">Refer a friend and get $10!</n-link>-->
    </div>

    <div class="usability-warning p-2 m-3 bg-red-300 rounded-xl" style="width: 80%">
      <img alt="caution" class="inline float-left ml-3 mr-3" src="/icons/caution.svg">
      <strong>WARNING:</strong>
      The editor is meant to be used on Desktop resolutions. Mobile is not guaranteed to work correctly.
    </div>

    <div class="flex flex-row items-center justify-center w-full" style="max-width:1440px;">
      <div class="flex flex-col items-center justify-center flex-shrink flex-grow">
        <div class="flex flex-col lg:flex-row w-full h-screen oveflow-x-hidden">
          <div class="flex flex-col text-black font-semibold nav justify-start">

            <div class="profile-bay p-4 flex flex-col items-start relative">
              <div
                  v-if="user.activeProfile.imageUrl || user.emailHash"
                  :style="'background-image:url(' + (user.activeProfile.imageUrl || 'https://www.gravatar.com/avatar/' + user.emailHash) + ');background-size:cover;background-position:center;'"
                  class="rounded-full"
                  style="width:70px;height:70px;box-shadow:inset 0 0 0 4px rgba(0,0,0,.25),0 5px 25px rgba(81,173,255,.25);"
              />
              <div
                  v-if="!user.activeProfile.imageUrl && !user.emailHash"
                  class="rounded-full"
                  style="background:linear-gradient(146deg, rgba(0,255,240,1) 00%, rgba(173,255,0,1) 100%);width:70px;height:70px;box-shadow:inset 0 0 0 4px rgba(0,0,0,.25),0 5px 25px rgba(81,173,255,.25);"
              />

              <div class="flex flex-col justify-start">
                <span
                    class="font-extrabold text-2xl leading-tight mt-4 mb-1"
                    style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
                >
                  {{ user.activeProfile.headline }}
                </span>
                <div class="flex flex-row items-center justify-start flex-wrap" style="max-width:300px;">
                  <div class="mb-1">
                    <span
                        v-if="user.activeProfile.customDomain"
                        class="font-bold text-lg opacity-60"
                    >{{ user.activeProfile.customDomain }}</span>
                    <span
                        v-if="!user.activeProfile.customDomain && user.activeProfile.handle"
                        class="font-bold text-lg opacity-60"
                    >
                      {{ rendererDomain }}/{{ user.activeProfile.handle }}
                    </span>
                  </div>

                  <div class="flex flex-row items-center justify-start flex-wrap">
                    <div
                        v-if="user.activeProfile.handle"
                        class="py-1 px-2 mb-1 mr-2 rounded-full text-gdp bg-opaqueIndigo text-sm font-extrabold leading-tight cursor-pointer grow"
                        @click="copyUrl"
                    >copy
                    </div>
                    <div
                        v-if="user.activeProfile.handle"
                        class="py-1 px-2 mb-1 mr-2 rounded-full text-gdp bg-opaqueIndigo text-sm font-extrabold leading-tight cursor-pointer grow"
                        @click="openUrl"
                    >open in new tab
                    </div>
                    <div
                        class="py-1 px-2 mb-1 rounded-full text-sm font-extrabold leading-tight cursor-pointer grow"
                        style="color:rgb(108,108,108);background:rgba(108,108,108,.1);"
                        @click="toggleProfileSelect"
                    >manage pages
                    </div>
                  </div>

                  <div v-if="error" class="error">
                    {{ error }}
                  </div>

                </div>
              </div>

              <div
                  @focusout="onSelectingProfilesFocusOut($event)"
              >
                <ul
                    v-if="selectingProfile"
                    id="profileSelection"
                    class="absolute bottom-0 rounded-2xl shadow bg-whiteish border border-gray-200 profile-list z-30"
                    style="left:0;right:0; top: 170px; width:100%;height:fit-content;max-height:450px;"
                    tabindex="0"
                >
                  <li class="flex flex-row items-center justify-left profile-search text-black">
                    <!-- Create new profile-->
                    <input
                        id="filterProfilesInput"
                        aria-label="Filter profiles"
                        class="text-sm p-2 mr-auto font-bold"
                        placeholder="Filter profiles..."
                        style="outline:none !important;background:transparent;"
                        type="text"
                        @input="onFilterProfilesInput"
                    >
                    <i class="search-icon fas fa-search text-sm p-2 opacity-50"/>
                  </li>

                  <li
                      v-for="profile in filteredProfiles"
                      :key="profile.handle"
                      :style="!profile.handle ? 'max-height: 51px;' : ''"
                      class="p-2 pl-4 pr-4 hover:bg-opaqueIndigo cursor-pointer flex flex-row items-center justify-start"
                      @click="selectProfile(profile.id)"
                  >
                    <div
                        v-if="profile.handle"
                        :style="'width: 35px;height:35px;background:linear-gradient(146deg, rgba(0,255,240,1) 00%, rgba(173,255,0,1) 100%);margin-right:.75rem;background-size:cover;background-repeat:no-repeat;background-position:center;background-image:url(' + (profile.imageUrl || 'https://www.gravatar.com/avatar/' + user.emailHash) + ');'"
                        alt="avatar"
                        class="w-8 h-8 rounded-full"
                        style="z-index: -1"
                    />
                    <div class="flex flex-col">
                      <span class="text-base text-black font-bold">{{ profile.handle }}</span>
                      <span class="text-sm text-black opacity-70 font-bold">{{ profile.headline }}</span>

                      <div
                          v-if="profile.visibility !== 'unpublished'"
                          class="py-1 px-2 mb-1 rounded-full text-green-500 bg-green-200 text-sm font-extrabold leading-tight"
                          style="width: fit-content"
                      >{{ profile.visibility }}
                      </div>

                      <div
                          v-if="profile.userId !== user.id"
                          class="py-1 px-2 mb-1 rounded-full text-gray-700 bg-gray-200 text-sm font-extrabold leading-tight"
                          style="width: fit-content"
                      >shared with you
                      </div>

                    </div>
                  </li>

                  <li class="flex flex-row items-center justify-center button-controls">
                    <!-- Create new profile-->
                    <span
                        class="text-center w-1/2 hover:bg-opaqueIndigo p-2 pl-4 text-xs font-bold text-gray-700"
                        @click="createNewProfile"
                    >Create new</span>

                    <!-- Logout-->
                    <a
                        class="text-center w-1/2 hover:bg-opaqueIndigo p-2 pr-4 text-xs font-bold text-gray-700"
                        href="/logout"
                    >Logout</a>
                  </li>

                </ul>
              </div>

            </div>

            <div class="flex flex-col">
              <n-link :class="getActiveStyles('dashboard')" to="/dashboard/">
                <img :src="`${$customSettings.icons.mainIcon}`" style="width:32px;height:32px;">
                <span class="ml-4 font-extrabold">Tinypage</span>
              </n-link>

              <n-link :class="getActiveStyles('dashboard-appearance')" to="/dashboard/appearance">
                <img src="/icons/Rainbow.svg" style="width:24px;height:24px;">
                <span class="ml-4 font-extrabold">Appearance</span>
              </n-link>

              <n-link :class="getActiveStyles('dashboard-analytics')" to="/dashboard/analytics">
                <img src="/icons/Rocket.svg" style="width:24px;height:24px;">
                <span class="ml-4 font-extrabold">Analytics</span>
              </n-link>

              <!--              <n-link :class="getActiveStyles('dashboard-marketplace')" to="/dashboard/marketplace">-->
              <!--                <img src="/icons/High voltage.svg" style="width:24px;height:24px;">-->
              <!--                <span class="ml-4 font-extrabold">Marketplace</span>-->
              <!--              </n-link>-->

              <!--              <n-link :class="getActiveStyles('dashboard-referrals')" to="/dashboard/referrals">-->
              <!--                <img src="/Heart.svg" style="width:24px;height:24px;">-->
              <!--                <span class="ml-4 font-extrabold">Referrals</span>-->
              <!--              </n-link>-->

              <!--              <n-link v-if="isAdmin" :class="getActiveStyles('dashboard-enterprise')" to="/dashboard/enterprise">-->
              <!--                <img src="/Person.svg" style="width:24px;height:24px;"/>-->
              <!--                <span class="ml-4 font-extrabold">Enterprise Settings</span>-->
              <!--              </n-link>-->

              <n-link :class="getActiveStyles('dashboard-settings')" to="/dashboard/settings">
                <img src="/icons/Settings.svg" style="width:24px;height:24px;">
                <span class="ml-4 font-extrabold">Page Settings</span>
              </n-link>

              <n-link :class="getActiveStyles('dashboard-account')" to="/dashboard/account">
                <img src="/icons/Person.svg" style="width:24px;height:24px;">
                <span class="ml-4 font-extrabold">Account Settings</span>
              </n-link>

              <n-link v-if="isAdmin" :class="getActiveStyles('dashboard-admin')" to="/dashboard/admin">
                <img src="/icons/High%20voltage.svg" style="width:24px;height:24px;">
                <span class="ml-4 font-extrabold">Admin Settings</span>
              </n-link>

              <a v-if="community" :class="getActiveStyles('dashboard-community')" :href="community" target="_blank">
                <div style="color:#0000ff">
                  <svg height="24px" viewBox="0 0 512 512" width="24px" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M480 257.35c0-123.7-100.3-224-224-224s-224 100.3-224 224c0 111.8 81.9 204.47 189 221.29V322.12h-56.89v-64.77H221V208c0-56.13 33.45-87.16 84.61-87.16 24.51 0 50.15 4.38 50.15 4.38v55.13H327.5c-27.81 0-36.51 17.26-36.51 35v42h62.12l-9.92 64.77H291v156.54c107.1-16.81 189-109.48 189-221.31z"
                        fill="currentColor"
                        fill-rule="evenodd"
                    />
                  </svg>
                </div>
                <span class="ml-4 font-extrabold">Community</span>
              </a>

              <a v-if="support" :class="getActiveStyles('dashboard-support')" :href="support" target="_blank">
                <div style="color:#5865F2">
                  <svg height="24px" viewBox="0 0 24 24" width="24px" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
                        fill="currentColor"
                    />
                  </svg>
                </div>
                <span class="ml-4 font-extrabold">Support</span>
              </a>
              <a
                  class="nav-link"
                  href="https://feedback.tnypg.com/boards/feature-requests"
                  target="_blank"
              >
                <img src="/icons/icons8-chat-bubble-96.png" style="width:24px;height:24px;">
                <span class="ml-4 font-extrabold">Feature requests</span>
              </a>
              <n-link :class="getActiveStyles('logout')" to="/logout">
                <img src="/icons/Waving hand.svg" style="width:24px;height:24px;">
                <span class="ml-4 font-extrabold">Logout</span>
              </n-link>
            </div>
          </div>
          <NuxtChild
              id="child"
              class="relative p-16 flex-grow flex-1 w-auto lg:overflow-y-scroll lg:h-screen"
          />
        </div>
      </div>

      <div v-if="preview" class="relative ml-8 hidden lg:flex xl:mb-20" style="width:286px;height:592px;">

        <div class="preview-menu">
          <div
              class="sbutton"
              style="display: flex; align-items: center; justify-content: center;"
              @click="onClickDownloadPreviewImage()"
          >
            <svg style="width: 32px; height: 32px;" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
              <title>
                Download Preview Image
              </title>
              <path
                  d="M336 176h40a40 40 0 0140 40v208a40 40 0 01-40 40H136a40 40 0 01-40-40V216a40 40 0 0140-40h40"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="32"
              />
              <path
                  d="M176 272l80 80 80-80M256 48v288"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="32"
              />
            </svg>
          </div>
        </div>

        <div
            class="p-3 bg-white absolute my-auto"
            style="top:0;left:0;border-radius: 50px; overflow:hidden;box-shadow:0 10px 15px -3px rgb(0 0 0), 0 4px 6px -2px rgb(0 0 0), inset 0 0 5px 0 rgba(0,0,0,.1);"
        >
          <div
              class="relative text-center rounded flex items-center justify-center p-6"
              style="border-radius: 40px;width: 262px;height:568px;overflow:hidden;"
          >
            <iframe
                v-if="user.activeProfile.handle"
                id="preview-frame"
                :src="getProfilePreviewUrl()"
                title="Profile Preview"
            />
          </div>
        </div>
      </div>

      <GDPRConsentPopup/>
    </div>

    <div id="custom-global-html" v-html="$customSettings.customHtml"/>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import {StatusCodes} from "http-status-codes";
import GDPRConsentPopup from "~/components/utilities/GDPRConsentPopup.vue";

export default Vue.extend({
  components: {
    GDPRConsentPopup,
  },

  data() {
    return {
      active: "dashboard",
      originalHandle: '',

      user: {
        id: '',
        emailHash: '',
        activeProfile: {
          handle: '',
          visibility: '',
          customDomain: '',
        },
      },
      rendererUrl: process.env.RENDERER_URL,
      rendererDomain: '' as string | undefined,
      preview: false,
      share_modal: false,
      qr_src: null,
      profiles: [] as EditorProfile[],
      filteredProfiles: [] as EditorProfile[],
      selectingProfile: false,
      profileUrl: "",
      version: "Version loading...",
      previewMode: 'mobile',
      profile_visibility: '' as String,
      isAdmin: false,
      leaderboard: process.env.LEADERBOARD,
      support: process.env.SUPPORT,
      community: process.env.COMMUNITY_GROUP,
      mobile_menu: false,
      mobile_preview: false,
      previewVisible: true,

      error: '',
      errorIntervalHandler: undefined as any,
    };
  },

  head() {
    return {
      title: this.$customSettings.metaTitle,
      meta: [
        {charset: 'utf-8'},
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1, user-scalable=no'
        },
        {
          hid: 'description',
          name: 'description',
          content: this.$customSettings.metaDescription
        },
        {
          hid: 'twitter:description',
          name: 'twitter:description',
          content: this.$customSettings.metaDescription
        },
        {
          hid: 'og:image',
          name: 'og:image',
          content: this.$customSettings.metaImageUrl
        },
        {
          hid: 'twitter:image',
          name: 'twitter:image',
          content: this.$customSettings.metaImageUrl
        },
        {
          hid: 'og:title',
          name: 'og:title',
          content: this.$customSettings.metaTitle
        },
        {
          hid: 'twitter:title',
          name: 'twitter:title',
          content: this.$customSettings.metaTitle
        },
        {
          hid: 'og:description',
          name: 'og:description',
          content: this.$customSettings.metaDescription
        },
        {
          hid: 'twitter:url',
          name: 'twitter:url',
          content: ('https://' + process.env.HOSTNAME) ?? 'https://tinypage.app'
        },
        {
          hid: 'twitter:card',
          name: 'twitter:card',
          content: 'summary_large_image'
        }
      ],
      link: [
        {
          rel: 'icon',
          type: 'image/x-icon',
          href: this.$customSettings.icons.favicon
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com'
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap'
        }
      ],
      bodyAttrs: {
        style: 'overflow: hidden; height: 100vh; max-height: 100vh;'
      }
    };
  },

  watch: {
    $route() {
      this.setActive();
    }
  },
  async mounted() {
    this.profiles = await this.$axios.$post('/profiles', {
      token: this.$store.getters['auth/getToken'],
      includePaymentInfoAndAnalytics: true
    });
    const permGroup = await this.$axios.$post("/admin/perm-group", {
      token: this.$store.getters['auth/getToken']
    });
    this.isAdmin = permGroup["groupName"] === 'admin';
    if (this.rendererUrl) {
      this.rendererDomain = this.rendererUrl
          .replaceAll("https://", '')
          .replaceAll("http://", '');
    }

    this.setActive();
    await this.getUserData();

    try {
      this.profileUrl = this.rendererUrl + '/' + this.user.activeProfile.handle;
      this.profile_visibility = this.user.activeProfile.visibility;
    } catch (err) {
      console.log(err);
      this.profileUrl = 'https://tinypage.app/';
    }

    try {
      const response = await this.$axios.post("/info/version");
      this.version = "Version v" + response.data.version;
    } catch (err) {
      console.warn("Failed to retrieve version from server.");
    }

    this.$root.$on('refreshUserProfileView', () => {
      const iFrame = document.getElementById('preview-frame') as HTMLIFrameElement;

      if (iFrame) {
        iFrame.src = this.getProfilePreviewUrl();
      }
    });
  },

  methods: {
    attemptLogout() {
      this.$nuxt.$router.push('/logout');
    },
    async createNewProfile() {
      try {
        const profile = await this.$axios.$post('/profile/create', {
          token: this.$store.getters['auth/getToken']
        }) as EditorProfile;

        this.profiles.push(profile);

        this.filteredProfiles = this.profiles;

        this.filteredProfiles.sort(function (a, b) {
          return a.handle.localeCompare(b.handle);
        });

        this.selectingProfile = false;

        if (profile?.id) {
          await this.selectProfile(profile.id);
        }
      } catch (err: any) {
        if (err.response) {
          if (err.response.status === StatusCodes.TOO_MANY_REQUESTS) {
            this.error = `Slow down! You are making profiles too quickly. Error: ${err.response.data.message}`;
          } else {
            this.error = `Error: ${err.response.data.message}`;
          }

          console.error(err);
        } else {
          throw err;
        }

        clearInterval(this.errorIntervalHandler);

        this.errorIntervalHandler = setTimeout(() => {
          this.error = '';
        }, 5000);
      }
    },

    getProfilePreviewUrl(): string {
      const token = this.$store.getters['auth/getToken'];

      const queryParams = new URLSearchParams({
        token: token as string,
        scrolling: "false",
        uid: new Date().toISOString() // necessary to reload the URL...
      });

      return `${this.rendererUrl}/${this.user.activeProfile.handle}?${queryParams}`;
    },

    async selectProfile(profileId: string) {
      this.user.activeProfile = await this.$axios.$post('/user/set-active-profile', {
        token: this.$store.getters['auth/getToken'],
        newProfileId: profileId
      });

      this.selectingProfile = false;

      this.$nextTick(() => {
        window.location.replace('/dashboard');
      });
    },

    getActiveStyles(page: string) {
      if (page === this.active) {
        return "nav-link active";
      }
      return "nav-link";
    },

    setActive() {
      if (process.client) {
        try {
          switch (this.$route.name) {
            case "dashboard":
              this.active = "dashboard";
              this.preview = true;
              break;
            case "dashboard-upgrade":
              this.active = "dashboard-upgrade";
              this.preview = false;
              break;
            case "dashboard-page-management":
              this.active = "dashboard-page-management";
              this.preview = false;
              break;
            case "dashboard-appearance":
              this.active = "dashboard-appearance";
              this.preview = true;
              break;
            case "dashboard-marketplace":
              this.active = "dashboard-marketplace";
              this.preview = false;
              break;
            case "dashboard-analytics":
              this.active = "dashboard-analytics";
              this.preview = false;
              break;
            case "dashboard-referrals":
              this.active = "dashboard-referrals";
              this.preview = false;
              break;
            case "dashboard-discover":
              this.active = "dashboard-discover";
              this.preview = false;
              break;
            case "dashboard-settings":
              this.active = "dashboard-settings";
              this.preview = true;
              break;
            case "dashboard-account":
              this.active = "dashboard-account";
              this.preview = false;
              break;
            case "dashboard-admin":
              this.active = "dashboard-admin";
              this.preview = false;
              break;
          }

          if (this.$route.path.includes('/dashboard/appearance')) {
            this.active = "dashboard-appearance";
            this.preview = true;
          } else if (this.$route.path.includes('/dashboard/settings')) {
            this.active = "dashboard-settings";
            this.preview = true;
          } else if (this.$route.path.includes('/dashboard/link')) {
            this.active = "dashboard";
            this.preview = true;
          }
        } catch (err) {
          console.log(err);
        }
      }
    },

    async getUserData() {
      try {
        const token = this.$store.getters['auth/getToken'];

        const userResponse = await this.$axios.$post('/user', {
          token
        });

        const profileResponse = await this.$axios.$post('/profile/active-profile', {
          token
        });

        this.user = userResponse;
        this.user.activeProfile = profileResponse;
        this.originalHandle = this.user.activeProfile.handle;
      } catch (err: any) {
        console.log('Error getting user data');
        console.log(err);

        if (err.response.status === StatusCodes.UNAUTHORIZED || err.response.status === StatusCodes.FORBIDDEN) {
          console.log("Token is probably expired, resetting...");
          this.$cookies.removeAll();

          window.location.replace("/");
        }
      }
    },

    async copyUrl() {
      try {
        let text = '';
        if (this.user.activeProfile.customDomain) {
          text = this.user.activeProfile.customDomain;
        }

        if (!text || text === 'https://null') {
          text = `${this.rendererUrl}/${this.user.activeProfile.handle}`;
        }

        await window.navigator.clipboard.writeText(text);
        alert(`Url copied to clipboard!\n${text}`);
      } catch (error) {
        let text = '';

        if (this.user.activeProfile.customDomain) {
          text = this.user.activeProfile.customDomain;
        }

        if (!text || text === 'https://null') {
          text = `${this.rendererUrl}/${this.user.activeProfile.handle}`;
        }

        prompt('Copy this url to the clipboard: Ctrl+C, Enter\n', text);
      }
    },

    openUrl() {
      let text = '';

      if (this.user.activeProfile.customDomain) {
        text = this.user.activeProfile.customDomain;
      }

      if (!text || text === 'https://null') {
        text = `${this.rendererUrl}/${this.user.activeProfile.handle}`;
      }

      window.open(text, '_blank');
    },

    getPreviewModeIcon() {
      switch (this.previewMode) {
        case "mobile":
          return 'fas fa-mobile-alt';
        case "desktop":
          return 'fas fa-tv';
      }
    },

    checkPreviewMode() {
      switch (this.previewMode) {
        case "mobile":
          return 'phone-display';
        case "desktop":
          return 'desktop-display';
      }
    },

    onFilterProfilesInput(event: any) {
      const target = event.target;
      const filterSearch = target.value.toLowerCase();
      const profiles = this.profiles as EditorProfile[];

      this.filteredProfiles = profiles.filter(x => x.handle.toLowerCase().startsWith(filterSearch));

      this.filteredProfiles.sort(function (a, b) {
        return a.handle.localeCompare(b.handle);
      });

      const diff = this.profiles.length - this.filteredProfiles.length;

      for (let i = 0; i < diff; i++) {
        this.filteredProfiles.push({
          customCss: "",
          customHtml: "",
          handle: "",
          headline: "",
          imageUrl: "",
          subtitle: "",
          themeId: "",
          visibility: "unpublished",
          showWatermark: true
        });
      }
    },

    toggleProfileSelect() {
      this.selectingProfile = !this.selectingProfile;

      if (this.selectingProfile) {
        this.onSelectingProfilesOpen();

        if (process.client) {
          this.$nextTick(() => {
            const elem = document.getElementById("profileSelection");

            if (elem) {
              elem.focus({preventScroll: true});
            }
          });
        }
      }
    },

    onSelectingProfilesOpen() {
      this.filteredProfiles = this.profiles;
    },

    onSelectingProfilesFocusOut(event: FocusEvent) {
      if (event.relatedTarget instanceof Element && event.target instanceof Element) {
        if (event.target.contains(event.relatedTarget)) {
          return;
        }
      }

      this.selectingProfile = false;
    },

    async onClickDownloadPreviewImage() {
      if (process.client) {
        const token = this.$store.getters['auth/getToken'];

        const response = await this.$axios.get('/profile/preview-image/' + this.originalHandle, {
          responseType: "blob"
        }, {
          token
        });

        let filename = "preview-image.png";
        const disposition = response.headers['content-disposition'];
        if (disposition && disposition.includes('filename')) {
          const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
          const matches = filenameRegex.exec(disposition);
          if (matches != null && matches[1]) {
            filename = matches[1].replace(/['"]/g, '');
          }
        }

        const blob = new Blob([response.data], {type: 'image/png'});
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);
      }
    }
  },
});
</script>

<style lang="scss" scoped>
.logo {
  position: absolute;
  right: 0;
}

@media(min-width: 1024px) {
  .middle {
    width: calc(66.66vw - 70px);
  }
  .content-nuxt {
    height: calc(100vh - 122px);
  }

  .usability-warning {
    display: none;
  }
}

@media(max-width: 1024px) {
  .content-container {
    height: calc(100% - 111px);
    max-height: calc(100% - 111px);
    min-height: calc(100% - 111px);
    position: absolute;
    top: 64px;
    left: 0;
    right: 0;
    z-index: 0;
    overflow-y: scroll;
  }

  .usability-warning {
    display: inline;
  }
}

@media(min-width: 1650px) {
  .visibility-alert {
    display: flex;
  }
}

.iframe-container::-webkit-scrollbar {
  width: 0px;
  background: transparent; /* make scrollbar transparent */
}

html {
  font-family: 'Nunito',
  'Inter',
  -apple-system,
  BlinkMacSystemFont,
  'Segoe UI',
  Roboto,
  'Helvetica Neue',
  Arial,
  sans-serif;
  font-size: 16px;
  line-height: 1.65;
  word-spacing: 1px;
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  box-sizing: border-box;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

.user-profile-preview-parent {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 130px;
  width: 100%;
}

.phone-display {
  display: flex;
  margin: -60px auto auto auto;
  border-radius: 65px;
  overflow: hidden;
  background: #000;
  padding: 14px;
  width: 375px;
  height: 812px;
  transform: scale(.8)
}

.phone-display > iframe {
  border: none;
  width: 100%;
  height: 100%;
}

.phone-display > div {
  border-radius: 50px;
}

.desktop-display > div {
  @apply rounded-lg;
  max-height: calc(100vh - 300px);
}

.desktop-display {
  display: flex;
  margin: 20px auto auto auto;
  padding: 14px;
  width: 500px;
  height: 800px;
}

.desktop-display > iframe {
  border: none;
  width: 100%;
  height: 100%;
}

.nc-item-link:hover {
  border-bottom: solid 2px rgba(235, 244, 255, var(--bg-opacity));
}

.profile-list {
  max-height: 400px !important;
  overflow-y: scroll;
  overflow-x: hidden;

  .profile-search {
    position: sticky;
    top: 0;
    background-color: #FFFFFF;

    input {
      width: 180px;
      padding-left: 10px;
    }

    i.search-icon {
      margin-left: 5px;
    }
  }

  .button-controls {
    position: sticky;
    bottom: 0;
    background-color: #FFFFFF;
  }
}

/**
  Animations
 */

.fade-enter-active, .fade-leave-active {
  transition: opacity .25s;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}

.ace_editor, .ace_editor * {
  font-size: 14px !important;
  font-variant-ligatures: none !important;
  font-style: normal !important;
}

/* required class */
.my-editor {
  /* we dont use `language-` classes anymore so thats why we need to add background and text color manually */
  background: #2d2d2d;
  color: #ccc;

  /* you must provide font-family font-size line-height. Example: */
  font-family: Fira code, Fira Mono, Consolas, Menlo, Courier, monospace;
  font-size: 14px;
  line-height: 1.5;
  padding: 5px;
}

/* optional class for removing the outline */
.prism-editor__textarea:focus {
  outline: none;
}

/* New Dashboard Styles */
#child::-webkit-scrollbar {
  display: none; /* Safari and Chrome */
}

.white-05 {
  background: rgba(255, 255, 255, .05);
}

.black-45 {
  background: rgba(255, 255, 255, .05);
}

.nav {
  background: rgba(255, 255, 255, .03);
}

.wordmark {
  color: #FFF;
}

.phone-display {
  display: flex;
  margin: -60px auto auto;
  border-radius: 65px;
  overflow: hidden;
  background: #000;
  padding: 14px;
  width: 375px;
  height: 812px;
  transform: scale(.8);
}

.nav-link {
  @apply flex mb-1 flex-row p-3 px-4 rounded-2xl cursor-pointer items-center justify-start text-lg;
  min-width: 300px;
}

.nav-link * {
  opacity: .85;
}

.nav-link:hover {
  @apply text-gdp;
  background-color: rgba(71, 142, 204, 0.25);
}

.nav-link.active {
  background: rgba(71, 142, 204, 0.25);
  @apply text-gdp;
}

.nav-link.active * {
  opacity: 1;
}

.nav-link:hover * {
  opacity: 1;
}

.profile-bay {
  border-top: solid 1px rgba(255, 255, 255, .1);
  cursor: pointer;
}

.profile-bay:hover {
  background: rgba(255, 255, 255, .02);
}

.grow:hover {
  transform: scale(1.03);
}

.white-gradient {
  background: #edf4fc;
  background: -moz-linear-gradient(180deg, rgba(254, 254, 254, 1) 0%, rgba(237, 244, 252, 1) 100%);
  background: -webkit-linear-gradient(180deg, rgba(254, 254, 254, 1) 0%, rgba(237, 244, 252, 1) 100%);
  background: linear-gradient(180deg, rgba(254, 254, 254, 1) 0%, rgba(237, 244, 252, 1) 100%);
  filter: progid:DXImageTransform.Microsoft.gradient(startColorstr="#fefefe", endColorstr="#edf4fc", GradientType=1);
}

.error {
  @apply bottom-0 rounded-lg shadow border border-gray-200;
  color: mintcream;
  background-color: #ff4a4a;
  padding: 7px;
  z-index: 25;
}

#preview-frame {
  z-index: 2;
  width: 376px;
  height: 813px;
  transform: scale(0.7) translate(-82px, -175px);
  top: 0;
  left: 0;
  position: absolute;
}

.preview-menu {
  position: relative;
  bottom: 65px;
  width: 100%;
  display: flex;
  flex-direction: row;
}

.sbutton {
  display: flex;
  align-items: center;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  text-align: center;
  margin: 5px auto 0;
  background: rgba(255, 255, 255, 0.5);
  box-shadow: 0 5px 11px -2px rgb(0 0 0 / 50%), 0 4px 12px -7px rgb(0 0 0 / 15%);
  cursor: pointer;
  -webkit-transition: all .1s ease-out;
  transition: all .1s ease-out;
  position: relative;
  z-index: 3;
}
</style>
