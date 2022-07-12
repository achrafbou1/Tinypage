export default {
  /*
  ** Nuxt rendering mode
  ** See https://nuxtjs.org/api/configuration-mode
  */
  ssr: true,

  /*
  ** Nuxt target
  ** See https://nuxtjs.org/api/configuration-target
  */
  target: 'server',

  i18n: {
    locales: ['en-US'],
    defaultLocale: 'en-US'
  },

  loading: {
    color: '#478ecc',
    height: '3px'
  },

  server: {
    host: process.env.SERVER_HOST ?? '0.0.0.0',
    port: process.env.EDITOR_PORT ?? 80
  },

  /*
  ** Headers of the page
  ** See https://nuxtjs.org/api/configuration-head
  */
  head: {
    link: [
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com'
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap'
      }
    ],
    script: [
      {
        src: '/js/jscolor.min.js'
      }
    ]
  },
  /*
  ** Global CSS
  */
  css: [
    '~/assets/css/theme.css'
  ],
  /*
  ** Plugins to load before mounting the App
  ** https://nuxtjs.org/guide/plugins
  */
  plugins: [
    {
      src: '~plugins/draggable.js',
      ssr: true
    },
    {
      src: '~plugins/cssjson.ts',
      ssr: true
    },
    {
      src: '~plugins/server-customization.ts',
      ssr: true
    },
    {
      src: '~/plugins/vue-editor.js',
      ssr: false
    }
  ],
  /*
  ** Auto import components
  ** See https://nuxtjs.org/api/configuration-components
  */
  components: true,
  /*
  ** Nuxt.js dev-modules
  */
  buildModules: [
    // Doc: https://github.com/nuxt-community/eslint-module
    '@nuxt/typescript-build',
    // Doc: https://github.com/nuxt-community/nuxt-tailwindcss
    '@nuxtjs/tailwindcss',
    '@nuxtjs/dotenv'
  ],
  /*
  ** Nuxt.js modules
  */
  modules: [
    // Doc: https://axios.nuxtjs.org/usage
    '@nuxtjs/axios',
    'cookie-universal-nuxt',
    '@aceforth/nuxt-optimized-images',
    '@nuxtjs/sitemap',
    'cookie-universal-nuxt',
    'vue2-editor/nuxt'
  ],

  optimizedImages: {
    optimizeImages: true
  },

  /*
  ** Axios module configuration
  ** See https://axios.nuxtjs.org/options
  */
  axios: {
    baseURL: 'https://api.singlelink.co' /* fallback */
  },

  env: {
    ENABLE_WHITELABEL: process.env.ENABLE_WHITELABEL === 'true',
    API_URL: process.env.API_URL ?? 'https://api.singlelink.co',
    HOSTNAME: process.env.EDITOR_HOSTNAME ?? 'app.singlelink.co',
    RENDERER_URL: process.env.RENDERER_URL ?? 'https://singlel.ink',
    LEADERBOARD: process.env.LEADERBOARD === 'true',
    SUPPORT: process.env.SUPPORT ?? 'https://discord.gg/BUbmgV4',
    COMMUNITY_GROUP: process.env.COMMUNITY_GROUP ?? 'https://www.facebook.com/neutroncreative/',
    EDITOR_PORT: process.env.EDITOR_PORT ?? 3000,
    LOGO_WIDTH: process.env.LOGO_WIDTH ?? '200px',
    ICON_WIDTH: process.env.ICON_WIDTH ?? '46px',
    FREE_SIGNUP: process.env.FREE_SIGNUP ? (process.env.FREE_SIGNUP === 'true') : true
  },

  publicRuntimeConfig: {
    axios: {
      browserBaseURL: process.env.API_URL
    }
  },

  privateRuntimeConfig: {
    axios: {
      baseURL: process.env.API_URL
    }
  },

  sitemap: {
    hostname: 'https://' + process.env.HOSTNAME ?? 'app.singlelink.co'
  },
  /*
  ** Build configuration
  ** See https://nuxtjs.org/api/configuration-build/
  */
  build: {
    plugins: [],
    extend (config, ctx) {

      // Added Line
      config.devtool = ctx.isClient ? 'eval-source-map' : 'inline-source-map';
    }
  }
};
