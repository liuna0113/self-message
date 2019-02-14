
import asyncComponentNames from '../modules/asyncComponentNames.yaml'

export default asyncComponentNames.reduce( ( total, next ) => {
  let key = next.split( '.' )[ 0 ].replace( /(\/\w{1})/g, v => v.substr( 1 ).toUpperCase() )
  total[ key ] = () => import( `../modules/template/${next}` )
  return total
}, {} )
