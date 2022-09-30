<template>
  <div class="flex flex-col p-8 items-center overflow-x-hidden overflow-y-scroll">
    <div class="flex flex-row items-center justify-start mb-4 space-x-4 mb-4">
      <img alt="settings svg" class="w-8" src="/icons/Person.svg">
      <h1 class="text-black font-extrabold tracking-tight text-3xl w-full flex flex-row items-start lg:items-center">
        Account Settings
      </h1>
    </div>

    <div class="overflow-x-hidden overflow-y-hidden w-full">
      <div class="bg-white py-8 shadow rounded-2xl justify-center items-start w-full mb-8 px-6">
        <div class="flex space-x-96 flex-row">
          <div>
            <h2 class="text-black font-bold text-lg w-full px-6">
              Manage your pages
            </h2>
          </div>
          <div class="flex-initial w-64 data-table-search-filter mb-6">
            <span>search:</span><input type="search" @input="filterProfiles">
          </div>
        </div>
        <DataTable v-bind="profilesTableParams"/>
      </div>
    </div>

    <!-- Reset Email Address -->
    <!--    <div class="flex flex-col p-6 bg-white shadow rounded-2xl justify-center items-start w-full mb-8">-->
    <!--      <h2 class="text-black font-bold text-lg w-full">-->
    <!--        Update your email address-->
    <!--      </h2>-->
    <!--      <p class="text-black font-bold opacity-70">-->
    <!--        An email will be sent to you with a confirmation link. Please type your new email in the form below to coninue.-->
    <!--      </p>-->
    <!--      <div class="flex flex-col mt-4 mb-2 w-full">-->
    <!--        <label class="font-bold text-black opacity-70 mb-3">New email address</label>-->
    <!--        <div class="flex flex-col items-center justify-start space-y-4 w-full">-->
    <!--          <input-->
    <!--              id="resetEmail"-->
    <!--              v-model="resetNewEmail"-->
    <!--              aria-label="password reset email"-->
    <!--              class="px-2 py-3 text-sm border-solid border-gray-300 rounded-2xl border w-full flex-grow"-->
    <!--              placeholder="e.g. jane@gmail.com"-->
    <!--              type="text"-->
    <!--          >-->
    <!--          <button-->
    <!--              class="w-full flex py-3 px-6 text-sm text-white text-center bg-gdp hover:bg-blue-400 rounded-2xl font-bold justify-center align-center"-->
    <!--              type="button"-->
    <!--              @click="setPasswordModalActive(true)"-->
    <!--          >-->
    <!--            Send email change confirmation email-->
    <!--          </button>-->
    <!--        </div>-->
    <!--      </div>-->
    <!--    </div>-->

    <!-- Manage SSO -->
    <div class="flex flex-col lg:flex-row p-6 bg-white shadow rounded-2xl justify-center items-center w-full mb-8">
      <div class="flex flex-col mr-auto w-full lg:w-1/2">
        <h2 class="text-black font-bold text-lg w-full">
          Manage SSO
        </h2>
        <p class="text-black opacity-70 font-semibold">
          Link up your social media accounts for easy single sign-on access.
        </p>
      </div>
      <div>
        <a
            class="flex flex-row items-center font-bold justify-center cursor-pointer rounded-full px-8 py-2 my-2 text-md border-gray-300 hover:border-gray-600"
            style="border-width:3px;border-style:solid;"
            @click="assignGoogleAccount()"
        >
          <img class="w-5 mr-4" src="/icons/google-icon.png" alt="Link with Google">
          Link with Google
        </a>
        <!--        <a-->
        <!--          class="flex flex-row items-center font-bold justify-center rounded-full px-8 py-2 my-2 text-md border-gray-300 hover:border-gray-600"-->
        <!--          style="border-width:3px;border-style:solid;"-->
        <!--          @click="assignGitHubAccount()"-->
        <!--        >-->
        <!--          <img src="/icons/google-icon.png" class="w-5 mr-4">-->
        <!--          Link with GitHub-->
        <!--        </a>-->
      </div>
    </div>

    <!-- Request GDPR package-->
    <div class="flex flex-col lg:flex-row p-6 bg-white shadow rounded-2xl justify-center items-center w-full mb-8">
      <div class="flex flex-col mr-auto w-full lg:w-1/2">
        <h2 class="text-black font-bold text-lg w-full">
          Request GDPR Package
        </h2>
        <p class="text-black font-bold opacity-70">
          Download a data package containing all of your recorded data.
        </p>
      </div>
      <button
          class="w-full lg:w-auto mt-4 lg:mt-0 ml-2 flex px-6 py-3 text-sm text-white text-center bg-green-600 hover:bg-green-400 rounded-2xl font-bold w-1/3 justify-center align-center"
          type="button"
          @click="downloadGDPRPackage"
      >
        Download
      </button>
    </div>

    <!-- Reset Password -->
    <div class="flex flex-col p-6 bg-white shadow rounded-2xl justify-center items-start w-full mb-8">
      <h2 class="text-black font-bold text-lg w-full">
        Reset your password
      </h2>
      <p class="text-black font-bold opacity-70 max-w-xl">
        An email will be sent to you with a password reset link. Please type in the same email you used to sign up
        for this account to confirm.
      </p>
      <div class="flex flex-col mt-4 mb-2 w-full">
        <label class="font-bold text-black opacity-70 mb-3">Confirm your email address</label>
        <div class="flex flex-col items-center justify-start space-y-4 w-full">
          <input
              id="passwordResetEmail"
              v-model="passwordEmail"
              aria-label="password reset email"
              class="px-2 py-3 text-sm border-solid border-gray-300 rounded-2xl border w-full flex-grow"
              placeholder="e.g. jane@gmail.com"
              type="text"
          >
          <button
              class="w-full flex py-3 px-6 text-sm text-white text-center bg-gdp hover:bg-blue-400 rounded-2xl font-bold justify-center align-center"
              type="button"
              @click="setPasswordModalActive(true)"
          >
            Request password reset link
          </button>
        </div>
      </div>
    </div>

    <!-- Delete account -->
    <div class="flex flex-col lg:flex-row p-6 bg-white shadow rounded-2xl justify-center items-center w-full mb-8">
      <div class="flex flex-col mr-auto w-full lg:w-1/2">
        <h2 class="text-black font-bold text-lg w-full">
          Delete this account
        </h2>
        <p class="text-black font-bold opacity-70">Done with this account? Click the button on your right to delete
          this
          profile and all related content.</p>
      </div>
      <button
          class="w-full lg:w-auto mt-4 lg:mt-0 ml-2 flex px-6 py-3 text-sm text-white text-center bg-red-600 hover:bg-red-400 rounded-2xl font-bold w-1/3 justify-center align-center"
          type="button"
          @click="setDeleteUserModalActive(true)"
      >
        Delete this account
      </button>
    </div>

    <transition name="fade">
      <!-- Password reset confirmation modal -->
      <div
          v-if="resetPasswordModalActive"
          class="h-screen absolute top-0 left-0 right-0 bottom-0 z-50 flex items-center justify-center"
          style="background: rgba(0,0,0,.5); backdrop-filter: saturate(180%) blur(5px);"
          @click="setPasswordModalActive(false)"
      >
        <div class="flex flex-col p-6 bg-white shadow rounded-2xl w-full max-w-lg" @click.stop>
          <h2 class="text-black font-bold text-xl">
            {{ passwordError ? 'Error on password request!' : 'Password reset requested' }}
          </h2>
          <p v-if="!passwordError" class="text-gray-600 text-sm">A password reset link has been sent to your account
            email inbox successfully.
            Make sure to check your spam folder.</p>

          <p v-if="passwordError" class="text-gray-600 text-sm">
            <em class="fas fa-exclamation-triangle"/>
            {{ passwordError }}
          </p>
          <button
              class="mt-4 p-3 text-center text-md text-white bg-blue-600 hover:bg-blue-400 rounded-2xl font-bold"
              type="button"
              @click="setPasswordModalActive(false)"
          >
            Close
          </button>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <!-- user deletion reset modal -->
      <div
          v-if="deleteUserModalActive"
          class="h-screen absolute top-0 left-0 right-0 bottom-0 z-50 flex items-center justify-center"
          style="background: rgba(0,0,0,.5); backdrop-filter: saturate(180%) blur(5px);"
          @click="setDeleteUserModalActive(false)"
      >
        <div class="flex flex-col p-6 bg-white shadow rounded-2xl w-full max-w-lg" @click.stop>
          <h2 class="text-black font-bold text-xl">
            Are you sure?
          </h2>

          <p class="text-gray-600 text-sm">
            There is NO UNDO for this operation! All your profiles will be deleted!
          </p>

          <button
              class="mt-4 p-3 text-center text-md text-white bg-red-700 hover:bg-red-400 rounded-2xl font-bold"
              type="button"
              @click="deleteUser"
          >
            Delete User
          </button>

          <button
              class="mt-4 p-3 text-center text-md text-white bg-blue-600 hover:bg-blue-400 rounded-2xl font-bold"
              type="button"
              @click="setDeleteUserModalActive(false)"
          >
            Cancel
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
// @ts-ignore
import DataTable from '@andresouzaabreu/vue-data-table';

import Vue from "vue";
// eslint-disable-next-line import/named
import {MetaInfo} from "vue-meta";
import {StatusCodes} from "http-status-codes";
import {Permission} from "~/plugins/permission-utils";
import ImageComponent from "~/components/page-management/ImageComponent.vue";
import VisibilityComponent from "~/components/page-management/VisibilityComponent.vue";
import StatusComponent from "~/components/page-management/StatusComponent.vue";
import '@andresouzaabreu/vue-data-table/dist/DataTable.css';
import ActionsComponent from "~/components/page-management/ActionsComponent.vue";

export default Vue.extend({
  name: 'DashboardAccount',
  components: {
    DataTable
  },
  layout: 'dashboard',
  middleware: 'authenticated',
  data: () => ({
    filteredProfiles: [] as EditorProfile[],
    profiles: [] as EditorProfile[],
    selectedProductId: null as string | null,
    selectedPurchaseType: undefined as DbProduct["purchase_type"],
    currentPermission: Permission.FREE,
    availableSubscriptions: [] as {
      id?: string,
      name: string,
      metadata: any,
      order: number,
      price: any
    }[],

    godmode: false,

    subInfo: {} as (DbSubscription | DbProduct) & { product: unknown | null, price: unknown | null },

    loaded: false,
    resetPasswordModalActive: false,
    deleteUserModalActive: false,
    originalHandle: '',

    user: {
      name: '',
      emailHash: '',
      email: '',
      activeProfile: {
        imageUrl: '',
        headline: '',
        subtitle: '',
        handle: '',
        customDomain: '',
        visibility: '',
        showWatermark: false,
      }
    },
    error: '',
    passwordError: '',
    passwordEmail: '' as string | null | undefined,
    resetNewEmail: '',
    showWatermarkNotice: false,
    app_name: process.env.APP_NAME,

    alerts: {},
  }),

  head(): MetaInfo {
    return {
      title: 'Account Settings - ' + this.$customSettings.productName,
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Manage your ' + this.$customSettings.productName + ' account.'
        },
        {
          hid: 'twitter:description',
          name: 'twitter:description',
          content: 'Manage your ' + this.$customSettings.productName + ' account.'
        },
        {
          hid: 'og:title',
          name: 'og:title',
          content: 'Account Settings - ' + this.$customSettings.productName
        },
        {
          hid: 'twitter:title',
          name: 'twitter:title',
          content: 'Account Settings - ' + this.$customSettings.productName
        },
        {
          hid: 'og:description',
          name: 'og:description',
          content: 'Manage your ' + this.$customSettings.productName + ' account.'
        },
      ],
    };
  },
  computed: {
    profilesTableParams(): Object {
      return {
        showPerPage: false,
        showSearchFilter: false,
        sortingMode: "single",
        showDownloadButton: false,
        showEntriesInfo: false,
        // eslint-disable-next-line vue/no-side-effects-in-computed-properties
        data: this.filteredProfiles.sort((a, b) => a.handle.localeCompare(b.handle)),
        columns: [
          {
            key: "imageUrl",
            title: "Avatar Photo",
            component: ImageComponent,
            sortable: false
          },
          {
            key: "headline",
            sortable: false
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

  watch: {
    'user.activeProfile.showWatermark': {
      handler(val) {
        this.showWatermarkNotice = (!val && this.loaded);
      }
    },
    selectedProductId: {
      handler(val) {
        this.selectedPurchaseType = this.availableSubscriptions.find(x => x.id === val)?.price?.type;
      }
    }
  },

  async beforeMount() {
    await this.getUserData();

    this.availableSubscriptions = (await this.$axios.post('/products', {})).data;

    await this.checkSubscription();
    this.loaded = true;

  },

  async mounted() {
    this.profiles = await this.$axios.$post('/profiles', {
      token: this.$store.getters['auth/getToken'],
      includePaymentInfoAndAnalytics: true
    });
    this.filteredProfiles = this.profiles;
  },

  methods: {
    filterProfiles(event: any) {
      const target = event.target;
      const filterSearch = target.value.toLowerCase();
      const profiles = this.profiles;
      if (filterSearch) {
        this.filteredProfiles = profiles.filter(x => x.handle.toLowerCase().includes(filterSearch));
      } else {
        this.filteredProfiles = this.profiles;
      }
    },
    async assignGoogleAccount() {
      const response = await this.$axios.post('/auth/google/assign', {
        token: this.$store.getters['auth/getToken']
      });

      window.location.assign(response.data);
    },

    async initCheckout() {
      try {
        const token = this.$store.getters['auth/getToken'];

        const response = await this.$axios.post('/stripe/create-checkout-session', {
          token,
          productId: this.selectedProductId
        });

        window.location.replace(response.data);
      } catch (err) {
        console.error(err);
      }
    },

    async manageSubscription() {
      try {
        const token = this.$store.getters['auth/getToken'];

        const response = await this.$axios.post('/stripe/create-portal-session', {
          token
        });

        window.location.replace(response.data);
      } catch (err) {
        console.error(err);
      }
    },

    async checkSubscription() {
      const token = this.$store.getters['auth/getToken'];

      this.subInfo = await this.$axios.$post('/payments/sub-info', {
        token
      });

      this.currentPermission = Permission.parse(this.subInfo.tier);
      this.$store.commit('auth/setCurrentPermission', this.currentPermission);

      if (this.subInfo.product_id) {
        this.selectedProductId = this.subInfo.product_id;

        const product: any = this.subInfo.product;

        if (!product.active) {
          const find = this.availableSubscriptions.find(x => x.id === this.selectedProductId);

          if (find) {
            find.name += " (Legacy)";
          }
        }
      }

      this.availableSubscriptions = this.availableSubscriptions.filter(sub => {
        const permission = Permission.parse(sub.metadata.permission);

        return this.currentPermission.permLevel <= permission.permLevel;
      });

      if (this.currentPermission.permLevel >= Permission.GODMODE.permLevel) {
        this.godmode = true;
        this.selectedProductId = "godmode";
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

        this.user.name = userResponse.name;
        this.user.emailHash = userResponse.emailHash;

        this.user.activeProfile = profileResponse;

        this.originalHandle = this.user.activeProfile.handle;

        this.passwordEmail = localStorage.getItem("email");
      } catch (err) {
        console.log('Error getting user data');
        console.log(err);
      }
    },

    async saveChanges() {
      try {
        await this.$axios.$post('/profile/update', {
          token: this.$store.getters['auth/getToken'],
          imageUrl: this.user.activeProfile.imageUrl ?? null,
          headline: this.user.activeProfile.headline ?? null,
          subtitle: this.user.activeProfile.subtitle ?? null,
          handle: this.user.activeProfile.handle ?? null,
          visibility: this.user.activeProfile.visibility ?? null,
          customDomain: this.user.activeProfile.customDomain ?? null,
          showWatermark: this.user.activeProfile.showWatermark ?? true,
        });

        if (process.client) {
          if (this.user.activeProfile.handle !== this.originalHandle) {
            location.reload();
            return;
          }

          this.$root.$emit('refreshUserProfileView');
        }
      } catch (err: any) {
        if (err.response) {
          if (err.response.status === StatusCodes.CONFLICT) {
            console.error("This handle is already being used by another profile.");
            this.error = "This handle is already being used by another profile.";

            return;
          }
        }

        throw err;
      }
    },

    setPasswordModalActive(active: boolean) {
      this.resetPasswordModalActive = active;

      if (active) {
        if (!this.passwordEmail) {
          this.passwordError = "Please enter a valid email.";
          return;
        } else {
          this.passwordError = '';
        }

        this.requestPasswordReset();
      }
    },

    setDeleteUserModalActive(active: boolean) {
      this.deleteUserModalActive = active;
    },

    async deleteUser() {
      this.$nuxt.$loading.start();

      await this.$axios.$post('/user/delete', {
        token: this.$store.getters['auth/getToken']
      });

      this.$nuxt.$loading.finish();

      this.$cookies.removeAll();

      window.location.replace('/');
    },

    async requestPasswordReset() {
      try {
        const request = await this.$axios.post('/user/request-reset-password', {
          email: this.passwordEmail
        });
        if (request.status && request.status === 200) {
          this.passwordError = '';
        }
      } catch (err: any) {
        console.error(err);

        this.passwordError = err.toString();

        if (err.response) {
          if (err.response.status === StatusCodes.NOT_FOUND) {
            this.passwordError = "The email couldn't be found, please make sure it's correct.";
          }

          if (err.response.status === StatusCodes.TOO_MANY_REQUESTS) {
            this.passwordError = `Whoa, slow down! Error: ${err.response.data.message}`;
          }

          return;
        }

        throw err;
      }
    },

    async downloadGDPRPackage() {
      if (process.client) {
        const token = this.$store.getters['auth/getToken'];

        const response = await this.$axios.post('/user/data-package', {
          token
        });

        let filename = "data.json";
        const disposition = response.headers['content-disposition'];
        if (disposition && disposition.includes('filename')) {
          const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
          const matches = filenameRegex.exec(disposition);
          if (matches != null && matches[1]) {
            filename = matches[1].replace(/['"]/g, '');
          }
        }

        const blob = new Blob([JSON.stringify(response.data)], {type: 'application/pdf'});
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);
      }
    },
  }
});
</script>

<style lang="scss">
.fade-enter-active, .fade-leave-active {
  transition: opacity .25s;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}

input, select {
  @apply font-bold;
}

.error {
  @apply bottom-0 rounded-lg shadow border border-gray-200;
  color: mintcream;
  background-color: #ff4a4a;
  padding: 7px;
  z-index: 25;
}

.data-table {
  height: 50%;
}
</style>
