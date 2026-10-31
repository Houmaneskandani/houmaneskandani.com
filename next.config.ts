import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permanent redirect for the old VCloud slug — the case study lives at
  // /work/vport-platform now. Any old bookmarks or shared links resolve
  // cleanly instead of 404'ing.
  async redirects() {
    return [
      {
        source: "/work/vcloud-platform",
        destination: "/work/vport-platform",
        permanent: true,
      },
      {
        source: "/work/applyagent",
        destination: "/lab/applyagent",
        permanent: true,
      },
      {
        source: "/lab/even-g2",
        destination: "/lab",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
