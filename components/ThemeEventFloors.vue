<template>
  <el-row class="theme-event-floors " :gutter="25">
    <component :is="navComponentName" :list="list" :floor-index="floorIndex" :type="floorType" @scroll="scrollTo" v-if="!isHomePage"></component>
    <template v-for="(floorData,index) in list">
      <component :is="converName(floorData.floorTemplateName)" :key="`${floorData.floorTemplateName}_${floorData.id}_${index}`" :value="formatFloorData(floorData)" v-webClick="`主题活动-${floorData.floorName}`" :type="floorType" :ref="`floor-${index}`" class="floor"></component>
    </template>
  </el-row>
</template>
<script>
import components from './asyncComponent'
import element from '../modules/element'

export default {
  name: 'theme-event-floors',
  components: {
    ...components,
    ...element
  },
  props: {
    list: {
      type: Array,
      default: () => []
    },
    themeEventType: Number,
    floorType: Number,
    isHomePage: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      floorIndex: 0
    }
  },
  computed: {
    // floorType() {
    //   let floor0 = this.list[ 0 ] || {}
    //   return floor0.floorType || 0
    // },
    navComponentName() {
      // { id: 0, name: '普通推荐' },
      // { id: 1, name: '限时促销' },
      // { id: 2, name: '试用商品' },
      // { id: 3, name: '自定义推荐' },
      // { id: 4, name: '满赠' },
      // { id: 5, name: '满减' },
      // { id: 6, name: '折扣' }

      switch ( this.floorType ) {
        case 1:
          return 'top-nav'
        case 4:
        case 5:
        case 6:
          return 'side-nav'
        default:
          return ''
      }
    }
  },
  methods: {
    scrollTo( floorIndex ) {
      let ele = this.$refs[ `floor-${floorIndex}` ][ 0 ]
      if ( !ele ) return
      this.$scrollTo( ele.$el, 500, { offset: this.floorType === 1 ? -50 : 0 } )
      this.floorIndex = floorIndex
    },
    converName( str = '' ) {
      let name = str.replace( /(\/\w{1})/g, ( v ) => v.substr( 1 ).toUpperCase() )
      return components[ name ] && name || `normal_${this.themeEventType}`
    },
    formatFloorData( data ) {
      return {
        ...data,
        floorContainers: data.floorContainers.map( val => ( JSON.parse( val.containerInfo ) ) )
      }
    }
  }
}
</script>
<style lang="stylus" scoped>
.theme-event-floor
  position relative
  &:first-child
    padding-top 27px
</style>
