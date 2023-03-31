/* import the fontawesome core */
import { library } from '@fortawesome/fontawesome-svg-core'

/* import font awesome icon component */
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

/* import specific icons */
import { faCheck, faCloudArrowDown, faCloudArrowUp, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons'
import Vue from 'vue'

/* add icons to the library */
library.add(faCloudArrowUp)
library.add(faCloudArrowDown)
library.add(faTrash)
library.add(faPlus)
library.add(faCheck)

Vue.component('FontAwesomeIcon', FontAwesomeIcon)
