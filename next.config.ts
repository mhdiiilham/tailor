import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image.
  output: "standalone",
  poweredByHeader: false,
  // The job list used to live at /hiring; shared links keep working.
  async redirects() {
    return [
      { source: "/hiring", destination: "/jobs", permanent: true },
      { source: "/hiring/:id", destination: "/jobs/:id", permanent: true },
    ];
  },
};

export default nextConfig;
