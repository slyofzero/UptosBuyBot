import { errorHandler, log } from "./handlers";

export async function apiFetcher<T>(url: string, headers?: HeadersInit) {
  try {
    const response = await fetch(url, { headers });
    const data = (await response.json()) as T;
    return { response: response.status, data };
  } catch (error) {
    errorHandler(error);
    log(`Error in fetching ${url}`)
    return { response: 400, data: null };
  }
}
