import {defineConfig} from '@sanity/pkg-utils'

export default defineConfig({
  tsconfig: 'tsconfig.dist.json',
  // Use the rolldown dts generator instead of api-extractor, which would
  // otherwise require @public release tags on every export.
  dts: 'rolldown',
})
