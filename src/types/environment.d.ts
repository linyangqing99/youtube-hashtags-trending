declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // YouTube API Configuration
      YOUTUBE_API_KEY?: string;

      // Proxy settings
      HTTPS_PROXY?: string;
      HTTP_PROXY?: string;
      ALL_PROXY?: string;
      https_proxy?: string;
      http_proxy?: string;
      all_proxy?: string;

      // Supabase Configuration
      NEXT_PUBLIC_SUPABASE_URL?: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
      SUPABASE_SERVICE_ROLE_KEY?: string;
      SUPABASE_URL?: string;
      SUPABASE_ANON_KEY?: string;
    }
  }
}

export {};