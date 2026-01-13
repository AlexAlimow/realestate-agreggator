import axios, { AxiosRequestConfig } from 'axios';

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

const getRandomUserAgent = () => {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface FetchOptions extends AxiosRequestConfig {
  retries?: number;
  retryDelay?: number;
}

export async function fetchHtml(url: string, options: FetchOptions = {}): Promise<string> {
  const { retries = 3, retryDelay = 1000, ...axiosConfig } = options;
  
  let lastError;

  for (let i = 0; i <= retries; i++) {
    try {
      const config: AxiosRequestConfig = {
        ...axiosConfig,
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          ...axiosConfig.headers,
        },
        timeout: axiosConfig.timeout || 15000,
        validateStatus: (status) => status < 500, // Accept 404s to handle them manually if needed, but retry on 5xx
      };

      console.log(`[HTTP] Fetching ${url} (Attempt ${i + 1}/${retries + 1})`);
      const response = await axios.get(url, config);

      if (response.status === 200) {
        return response.data;
      }
      
      // If we get a 404 or other non-200 but < 500, we might want to return empty or throw depending on logic.
      // For scrapers, 404 usually means no results or bad URL.
      if (response.status === 404) {
        console.warn(`[HTTP] 404 Not Found: ${url}`);
        throw new Error(`404 Not Found: ${url}`);
      }
      
      if (response.status === 403 || response.status === 429) {
         console.warn(`[HTTP] Blocked (${response.status}): ${url}`);
         // If blocked, maybe wait longer?
         if (i < retries) {
             const waitTime = retryDelay * (i + 1) * 2; // Exponential backoff
             console.log(`[HTTP] Waiting ${waitTime}ms before retry...`);
             await delay(waitTime);
             continue;
         }
      }

      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);

    } catch (error: any) {
      lastError = error;
      console.error(`[HTTP] Error fetching ${url}: ${error.message}`);
      
      if (i < retries) {
        const waitTime = retryDelay * (i + 1);
        await delay(waitTime);
      }
    }
  }

  throw lastError;
}
