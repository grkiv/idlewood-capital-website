/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  async redirects() {
    return [
      {
        source: '/index.html',
        destination: '/',
        permanent: true,
      },
      {
        source: '/investor-portal.html',
        destination: '/investor-portal',
        permanent: true,
      },
      {
        source: '/login-failed.html',
        destination: '/login-failed',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig