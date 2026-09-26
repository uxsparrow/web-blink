import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  sassOptions: {
    // Bootstrap 5.3 still uses @import internally; silence the noise rather
    // than patching upstream.
    // Bootstrap 5.3's SCSS predates several Dart Sass deprecations; this is
    // upstream noise, not our code.
    silenceDeprecations: [
      'import',
      'global-builtin',
      'color-functions',
      'legacy-js-api',
      'if-function',
    ],
  },
}

export default nextConfig
