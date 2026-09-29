import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  poweredByHeader: false,
  outputFileTracingRoot: process.cwd(),
  outputFileTracingIncludes: {
    "/api/artifacts/**": ["./managed/night-payments/keys/*", "./managed/night-payments/zkir/*", "./managed/private-payments/keys/*", "./managed/private-payments/zkir/*", "./managed/test-asset/keys/*", "./managed/test-asset/zkir/*"],
    "/api/build": ["./contracts/night-payments.compact", "./managed/night-payments/contract/index.js", "./toolchain.lock.json"],
  },
  webpack(config) {
    config.module.rules.push({ test: /sonner[\/]dist[\/]index\.(mjs|js)$/, use: [{ loader: process.cwd() + "/scripts/sonner-styles.cjs" }] });
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    config.output.environment = { ...config.output.environment, asyncFunction: true };
    return config;
  },
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ] }];
  },
};
export default nextConfig;
