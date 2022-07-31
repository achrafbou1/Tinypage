<template>
  <section class="flex flex-col p-8 items-center overflow-x-hidden overflow-y-scroll">
    <div class="flex flex-row items-center justify-start mb-4 space-x-4 mb-4">
      <img alt="settings svg" class="w-8" src="/icons/Person.svg">
      <h1 class="text-black font-extrabold tracking-tight text-3xl w-full flex flex-row items-start lg:items-center">
        Account Settings
      </h1>
    </div>

    <!-- Select billing tier -->
    <div class="flex flex-col p-6 bg-white shadow rounded-2xl justify-center items-start w-full mb-8">
      <h2 class="text-black font-bold text-lg w-full">
        Manage Subscription
      </h2>
      <p class="text-black font-bold opacity-70 max-w-xl">
        Want to upgrade or manage your subscription? Use the dropdown below.
        (You will be navigated to our checkout page.)
      </p>
      <div class="flex flex-col mt-4 mb-2 w-full">
        <label class="font-bold opacity-70 text-black mb-3" for="tierSelect">Account tier</label>
        <div class="flex flex-col lg:flex-row items-center justify-start space-y-4 lg:space-y-0 lg:space-x-4 w-full">
          <select
              id="tierSelect"
              v-model="selectedProductId"
              :disabled="godmode"
              class="px-2 py-3 text-sm border-solid border-gray-300 rounded-2xl font-bold border w-full lg:w-auto flex-grow lg:max-w-md"
          >
            <option v-if="subInfo.purchase_type === 'free'" :value="null">None</option>
            <option v-for="subInfo of availableSubscriptions" v-if="availableSubscriptions" :key="subInfo.id"
                    :value="subInfo.id"
            >
              {{ subInfo.name }}
            </option>
            <option v-if="godmode" value="godmode">God Mode</option>
          </select>

          <button
              v-if="loaded"
              v-show="(subInfo.purchase_type === 'free' || (subInfo.purchase_type === 'one_time' && selectedPurchaseType === 'recurring')) && selectedProductId && selectedProductId !== subInfo.product_id"
              :disabled="godmode"
              class="w-full lg:w-auto flex py-3 px-6 text-sm text-white text-center bg-gdp hover:bg-blue-400 rounded-2xl font-bold justify-center align-center"
              type="button"
              @click="initCheckout"
          >
            Add page
          </button>

          <button
              v-if="loaded || godmode"
              v-show="subInfo.purchase_type === 'recurring' || godmode"
              class="w-full lg:w-auto flex py-3 px-6 text-sm text-white text-center bg-gdp hover:bg-blue-400 rounded-2xl font-bold justify-center align-center"
              type="button"
              @click="manageSubscription"
          >
            Manage Subscription
          </button>
        </div>
        <br>
        <p v-if="loaded && godmode">
          Your account has god mode enabled.
        </p>
      </div>
    </div>

    <!-- Team/seats controls -->
    <div class="flex flex-col py-6 bg-white shadow rounded-2xl justify-center items-start w-full mb-8">
      <h2 class="text-black font-bold text-lg w-full px-6 mb-6">
        Manage your team
      </h2>
      <div class="w-full bg-gray-200" style="height:1px;"/>
      <div
          v-for="member in teamMembers"
          :key="member.id"
          class="flex flex-row py-2 px-8 w-full items-center justify-start hover:bg-opaqueBlack border border-gray-200 border-t-0 border-l-0 border-r-0"
      >
        <p class="font-bold text-black text-lg mr-auto">
          {{ member.email }}
        </p>
        <p class="font-bold text-black text-lg mr-auto">
          {{ member.profileHandle }}
        </p>
        <button
            class="py-1 px-2 mb-1 mr-2 rounded-full text-white bg-red-400 text-sm font-extrabold leading-tight grow"
            @click="removeTeamMember(member.email, member.profileId)"
        >
          Remove
        </button>
        <div
            class="py-1 px-2 mb-1 rounded-full text-green-500 bg-green-200 text-sm font-extrabold leading-tight grow"
        >
          <select
              v-model="member.role"
              class="text-green-500 bg-green-200"
              style="min-width: 120px; max-width: 161px;"
              @change="onMemberRoleUpdate(member.email, member.role)"
          >
            <option selected value="editor">Editor</option>
          </select>
        </div>
      </div>

      <div class="flex flex-col mt-4 mb-2 w-full px-6 mt-6">
        <label v-if="!teamMembers || teamMembers.length <=1" class="font-bold text-black opacity-70 mb-3">Ready to add
          your first team
          member? Add them here!</label>
        <label v-else class="font-bold text-black opacity-70 mb-3">Want to add a new member? Add them here!</label>

        <div class="flex flex-row items-center justify-start w-full">
          <label class="mr-4 font-normal">Email</label>
          <input
              v-model="teamMemberEmail"
              class="px-2 py-3 text-sm border-solid border-gray-300 rounded-2xl border flex-grow"
              placeholder="e.g. jane@gmail.com"
              type="text"
          >

          <label class="ml-4 mr-4 font-normal">Role</label>
          <select
              v-model="teamMemberRole"
              class="px-2 py-3 text-sm border-solid border-gray-300 rounded-2xl border flex-grow"
              style="min-width: 120px; max-width: 220px;"
          >
            <!-- <option value="guest" disabled>Guest (View Only) [Coming Soon]</option>-->
            <option selected value="editor">Editor</option>
          </select>
        </div>

        <button
            class="w-full flex py-3 px-6 mt-4 text-sm text-white text-center bg-gdp hover:bg-blue-400 rounded-2xl font-bold justify-center align-center"
            type="button"
            @click="addTeamMember(teamMemberEmail, teamMemberRole); teamMemberEmail = '';"
        >
          Add team member
        </button>

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

    <!-- Request GDPR package-->
    <div class="flex flex-col lg:flex-row p-6 bg-white shadow rounded-2xl justify-center items-center w-full mb-8">
      <div class="flex flex-col mr-auto w-full lg:w-1/2">
        <h2 class="text-black font-bold text-lg w-full">
          Request GDPR Package
        </h2>
        <p class="text-black font-bold opacity-70">Download a data package containing all of your recorded data.</p>
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

          <p class="text-gray-600 text-sm">There is NO UNDO for this operation! All your profiles will be deleted!</p>

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
  </section>
</template>

<script lang="ts">
import Vue from "vue";
import {StatusCodes} from "http-status-codes";
import {Permission} from "~/plugins/permission-utils";

export default Vue.extend({
  name: 'DashboardAccount',
  layout: 'dashboard',
  middleware: 'authenticated',

  head() {
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

  data() {
    return {
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

      teamMemberEmail: '',
      teamMemberRole: 'editor',

      teamMembers: [
        {
          userId: '0',
          profileId: '0',
          profileHandle: 'loading...',
          email: 'loading...',
          role: ''
        }
      ],

      error: '',
      passwordError: '',
      passwordEmail: '' as string | null | undefined,
      resetNewEmail: '',
      showWatermarkNotice: false,
      app_name: process.env.APP_NAME,

      alerts: {},
    };
  },

  watch: {
    'user.activeProfile.showWatermark': {
      handler(val) {
        this.showWatermarkNotice = (!val && this.loaded);
      }
    },
    selectedProductId: {
      handler(val) {
        this.selectedPurchaseType = this.availableSubscriptions.find(x => x.id == val)?.price?.type;
      }
    }
  },

  async beforeMount() {
    await this.getUserData();

    this.availableSubscriptions = (await this.$axios.post('/products', {})).data

    await this.checkSubscription();
    this.loaded = true;

  },

  async mounted() {
    this.getTeamMembers().catch();
  },

  methods: {
    async onMemberRoleUpdate(email: string, role: string) {

      await this.addTeamMember(email, role);
      await this.getTeamMembers();
    },

    async getTeamMembers() {
      if (!this.teamMembers)
        this.teamMembers = [];

      this.teamMembers.length = 0;

      const token = this.$store.getters['auth/getToken'];

      this.teamMembers = (await this.$axios.post('/team', {
        token
      })).data;
    },

    async addTeamMember(email: string, role: string) {
      const token = this.$store.getters['auth/getToken'];

      await this.$axios.post('/team/add', {
        token,
        email,
        role
      });

      await this.getTeamMembers();
    },

    async removeTeamMember(email: string, profileId: string) {
      const token = this.$store.getters['auth/getToken'];

      await this.$axios.post('/team/remove', {
        token,
        email,
        profileId
      });

      await this.getTeamMembers();
    },

    async initCheckout() {
      try {
        const token = this.$store.getters['auth/getToken'];

        let response = await this.$axios.post('/stripe/create-checkout-session', {
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

        let response = await this.$axios.post('/stripe/create-portal-session', {
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

      if (this.subInfo.product_id) {
        this.selectedProductId = this.subInfo.product_id;

        let product = <any>this.subInfo.product;

        if (!product.active) {
          let find = this.availableSubscriptions.find(x => x.id === this.selectedProductId);

          if (find) {
            find.name += " (Legacy)";
          }
        }
      }

      this.availableSubscriptions = this.availableSubscriptions.filter(sub => {
        let permission = Permission.parse(sub.metadata.permission);

        if (sub.price.type === 'recurring' && permission.permLevel === this.currentPermission.permLevel) {
          return false;
        }

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
      } catch (err) {
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
      } catch (err) {
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
        let token = this.$store.getters['auth/getToken'];

        const response = await this.$axios.post('/user/data-package', {
          token
        });

        let filename = "data.json";
        const disposition = response.headers['content-disposition'];
        if (disposition && disposition.indexOf('filename') !== -1) {
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
</style>
