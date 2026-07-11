import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import analyticsHandler from "./api/analytics";

function analyticsApiPlugin(mode: string): Plugin {
  return {
    name: "analytics-api-dev",
    configureServer(server) {
      const env = loadEnv(mode, process.cwd(), "");

      setProcessEnv(
        "SUPABASE_URL",
        env.SUPABASE_URL ?? env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL
      );
      setProcessEnv(
        "VITE_SUPABASE_URL",
        env.VITE_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
      );
      setProcessEnv(
        "SUPABASE_SERVICE_ROLE_KEY",
        env.SUPABASE_SERVICE_ROLE_KEY ??
          process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      server.middlewares.use("/api/analytics", async (request, response) => {
        try {
          await analyticsHandler(request, response);
        } catch (error) {
          console.error("[Vite] analytics API failed", error);
          response.statusCode = 500;
          response.setHeader("Content-Type", "application/json");
          response.end(
            JSON.stringify({
              error: "Local analytics API failed. Check the dev server logs.",
            })
          );
        }
      });

      server.middlewares.use(
        "/api/business-sponsorship",
        async (request, response) => {
          const { default: sponsorshipHandler } = await import(
            "./api/business-sponsorship"
          );

          try {
            await sponsorshipHandler(request, response);
          } catch (error) {
            console.error("[Vite] sponsorship API failed", error);
            response.statusCode = 500;
            response.setHeader("Content-Type", "application/json");
            response.end(
              JSON.stringify({
                error:
                  "Local sponsorship API failed. Check the dev server logs.",
              })
            );
          }
        }
      );
    },
  };
}

function getClientEnv(mode: string) {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
      cleanEnvValue(env.VITE_SUPABASE_URL ?? env.SUPABASE_URL) ?? ""
    ),
    "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
      cleanEnvValue(env.VITE_SUPABASE_ANON_KEY ?? env.SUPABASE_ANON_KEY) ?? ""
    ),
  };
}

function cleanEnvValue(value: string | undefined) {
  return value?.trim().replace(/^["']|["']$/g, "");
}

function setProcessEnv(key: string, value: string | undefined) {
  const cleaned = cleanEnvValue(value);

  if (cleaned) {
    process.env[key] = cleaned;
  } else {
    delete process.env[key];
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), analyticsApiPlugin(mode)],
  define: getClientEnv(mode),
}));
