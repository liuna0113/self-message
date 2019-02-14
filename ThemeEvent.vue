<template>
  <div id="theme-event" v-myScroll="loadMore">
    <lc-sub-header v-if="!isHomePage" class="main">
      <span class="sub-title">
        {{themeEventData.themeEventName}}
        <span>
          {{themeEventData.themeEventDesc}}
        </span>
      </span>
      <lc-nav slot="sub" :is-visible="false"></lc-nav>
    </lc-sub-header>
    <div class="theme-container" id="theme-container" :style="`background-image:url('${!isHomePage && (themeEventData.backgroundPicture|| myBackground)}')`">
      <div class="main">
        <theme-event-floors :list="themeEventFloors" ref="floors" :floorType="floorType" :themeEventType="themeEventType" v-if="hasInit" :is-home-page="isHomePage"></theme-event-floors>
        <loading v-if="loading"></loading>
      </div>
    </div>
  </div>
</template>
<script>
/* eslint-disable */
import { fromEvent } from 'rxjs/observable/fromEvent'
import { delay, throttleTime } from 'rxjs/operators/'
import { _throw } from 'rxjs/observable/throw'
import { getHomeThemeEvent, getsubThemeEvent, getSubEventFloorProductPaging } from '@/api'
import { multicastObservable } from '@/utils'
import Loading from '@/components/Loading'
import LcSubHeader from '@/components/SubHeader'
import LcNav from '@/components/Nav'
import ThemeEventFloors from './components/ThemeEventFloors'

const backgroundList = {
  1: require( './modules/assets/promotion_1.png' ),
  4: require( './modules/assets/promotion_4.png' ),
  5: require( './modules/assets/promotion_5.png' ),
  6: require( './modules/assets/promotion_6.png' )
}

export default {
  name: 'theme-event',
  components: {
    LcSubHeader,
    ThemeEventFloors,
    Loading,
    LcNav
  },
  props: {
    isHomePage: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      themeEventData: {},
      floorPage: {
        start: 0,
        num: 10,
        total: 0
      },
      hasInit: false,
      loading: true,

      floorSequence: 0,
      productPage: {
        start: 10,
        num: 10,
        total: 0
      },
      floorType: undefined
    }
  },
  computed: {
    themeEventId() {
      return !this.isHomePage && this.$route.params.id
    },
    themeEventFloors() {
      return ( this.themeEventData && this.themeEventData.themeEventFloors ) || []
    },
    themeEventType() {
      return this.themeEventData && this.themeEventData.themeEventType
    },
    myBackground() {
      let firstFloor = this.themeEventFloors[ 0 ] || {}
      let floorType = firstFloor.floorType || 0
      return backgroundList[ floorType ]
    }
  },
  watch: {
    themeEventId() {
      this.floorPage = {
        start: 0,
        num: 10,
        total: 0
      }
      this.floorSequence = 0
      this.productPage = {
        start: 10,
        num: 10,
        total: 0
      }
      this.hasInit = false
      this.getData()
    }
  },
  directives: {
    myScroll: {
      bind( el, binding ) {

        let loadData = binding.value
        el.subscription = fromEvent( document, 'scroll' ).pipe(
          throttleTime( 50 )
        ).subscribe( () => loadData() )

      },

      unbind( el ) {
        if ( el.subscription ) {
          el.subscription.unsubscribe()
        }
      }
    }
  },
  created() {
    console.log( 1 )
    this.getData()
  },
  methods: {
    getData() {
      this.getThemeEvent().pipe( delay( 1000 ) ).subscribe( ( { data } ) => {
        this.loading = false
        let themeEventFloors = data.themeEventFloors || []
        themeEventFloors.forEach( v => {
          v.floorLayoutDetail = this.parseStr( v.floorLayoutDetail )
        } )
        let firstFloor = themeEventFloors[ 0 ]
        if ( !firstFloor ) {
          return
        }
        this.loading = false
        this.hasInit = true
        this.themeEventFloorId = firstFloor.id
        this.productPage.total = firstFloor.productTotal
        this.floorType = firstFloor.floorType
        this.floorSequence = firstFloor.floorSequence
        this.floorPage.total = data.floorTotal
        this.floorPage.start += this.floorPage.num
        this.themeEventData = data
      } )
    },
    getThemeEvent() {
      let observable
      this.loading = true
      let { start, total } = this.floorPage
      if ( start && start >= total ) {
        return _throw( 'finish loading' )
      }
      if ( this.isHomePage ) {
        observable = this.getHomeThemeEvent( this.floorPage )
      } else {
        observable = this.getsubThemeEvent( this.floorPage )
      }
      return observable
    },
    getHomeThemeEvent( params ) {
      this.floorPage.num = 10
      return getHomeThemeEvent( params )
    },
    getsubThemeEvent( params ) {
      return getsubThemeEvent( { themeEventId: this.themeEventId, ...params } )
    },

    parseStr( o ) {
      try {
        return JSON.parse( o )
      } catch ( e ) {
        return o
      }
    },

    scrollData() {
      this.$nextTick( () => {
        let floorsVonode = this.$refs[ 'floors' ]
        let floorsEl = floorsVonode.$el
        let floors = floorsEl.getElementsByClassName( 'floor' )
        if ( !floors.length ) {
          return
        }
        const basicTop = 160 // 顶部导航加起来的高度
        const offset = 50 // 偏移值
        let clientHeight = document.documentElement.clientHeight
        let scrollTop = document.documentElement.scrollTop
        let { offsetHeight = 0, offsetTop = 0 } = floors[ this.floorSequence ] || {}

        if ( clientHeight + scrollTop + offset > offsetHeight + offsetTop + basicTop ) {
          this.getSubEventFloorProduct().subscribe( () => {
            console.log( `floor ${this.floorSequence} data loading` )
          } )
        }
      } )
    },
    getSubEventFloorProduct() {

      this.loading = true
      let { num, start, total } = this.productPage
      let observable = getSubEventFloorProductPaging( { themeEventId: this.themeEventId, themeEventFloorId: this.themeEventFloorId, num, start } )
      if ( start >= total ) {
        this.loading = false

        this.floorSequence += 1
        let floor = this.themeEventData.themeEventFloors[ this.floorSequence ] || {}
        this.productPage = {
          start: 10,
          num: 10,
          total: floor.productTotal || 0
        }
        this.themeEventFloorId = floor.id
        this.loading = false
        return _throw( 'finish loading' )
      }
      const multi = multicastObservable( observable )
      multi.subscribe( ( { data } ) => {
        let curFloor = this.themeEventData.themeEventFloors[ this.floorSequence ]
        curFloor.floorProducts.push( ...data.floorProducts )
        this.loading = false
        this.productPage.start += 10
      } )
      return multi
    },
    loadMore() {
      if ( this.isHomePage || this.floorType !== 0 ) {
        return
      }
      if ( !this.loading && this.$route.path.indexOf( '/themeEvent' ) > -1 ) {
        this.scrollData()
      }
    }
  }
}
</script>
<style lang="stylus" scoped>
.theme-container
  background-position center top
  background-size 100% auto
  background-repeat no-repeat
  margin-top -10px
  padding-top 27px
  min-height 700px
</style>
