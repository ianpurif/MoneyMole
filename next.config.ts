import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  poweredByHeader: false,
  outputFileTracingIncludes: {
    "/api/artifacts/**": ["./managed/private-payments/keys/*", "./managed/private-payments/zkir/*", "./managed/test-asset/keys/*", "./managed/test-asset/zkir/*"],
    "/api/build": ["./contracts/private-payments.compact", "./managed/private-payments/contract/index.js", "./toolchain.lock.json"],
  },
  webpack(config) {
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
