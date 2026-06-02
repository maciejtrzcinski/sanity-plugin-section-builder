import studio from '@sanity/eslint-config-studio'
import prettier from 'eslint-config-prettier'

export default [
  {ignores: ['dist/', 'coverage/', '.sanity/']},
  ...studio,
  // Turn off ESLint rules that conflict with Prettier — keep formatting Prettier's job.
  prettier,
]
