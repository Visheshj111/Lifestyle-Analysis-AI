/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

export interface AnalyzeRequest {
  selected: string[];
  input?: string;
}

export interface AnalyzeResponse {
  score: number; // 0-100
  message: string; // short supportive but honest
  tips: string[]; // 0-5 short actionable tips
}
