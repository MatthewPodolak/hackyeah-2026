const API_ORIGIN = process.env.API_ORIGIN_INTERNAL ?? "http://localhost:8080";

const nextConfig = {
  output: "standalone",
  reactCompiler: true,
  async rewrites() {
    if (process.env.NODE_ENV !== "development") return [];
    return [{ source: "/api/:path*", destination: `${API_ORIGIN}/api/:path*` }];
  },
};

export default nextConfig;
