// Tavily 实时网络检索封装（仅在服务端使用，不要把 key 打进客户端 bundle）
import { tavily } from "@tavily/core";

const apiKey = process.env.EP_TAVILY_API_KEY;

export type SearchResult = {
  title: string;
  url: string;
  content: string;
};

export async function searchWeb(
  query: string,
  maxResults = 5,
): Promise<SearchResult[]> {
  if (!apiKey) {
    throw new Error("未配置 EP_TAVILY_API_KEY（请在 .env 里加 EP_TAVILY_API_KEY）");
  }
  const client = tavily({ apiKey });
  const res = await client.search(query, { maxResults });
  return (res.results ?? []).map((r) => ({
    title: r.title ?? "",
    url: r.url ?? "",
    content: r.content ?? "",
  }));
}
