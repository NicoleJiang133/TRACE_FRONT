/**
 * Trace Backend API Service
 *
 * Connects frontend to the SpoonOS-powered backend for:
 * - Paper analysis via SpoonOS LLM (Agent -> SpoonOS -> LLM)
 * - Real Neo blockchain minting
 * - NeoFS storage
 * - X402 payments
 */

import { HypothesisArtifact, SourcePaper } from "../types";

// Backend API URL - configurable via environment
const API_BASE_URL = process.env.TRACE_API_URL || "http://localhost:8000";

export interface ProcessPapersRequest {
  paper_a: {
    title: string;
    content: string;
  };
  paper_b: {
    title: string;
    content: string;
  };
  author_wallet?: string;
  use_neofs?: boolean;
  use_x402?: boolean;
}

export interface BackendError {
  detail: string;
}

/**
 * Process two papers through the SpoonOS-powered backend pipeline.
 *
 * Flow: Frontend -> Backend API -> SpoonOS -> LLM (Groq)
 *       + Neo blockchain minting
 *       + NeoFS storage (optional)
 *       + X402 payment (optional)
 */
export const processWithBackend = async (
  papers: SourcePaper[],
  options: {
    authorWallet?: string;
    useNeofs?: boolean;
    useX402?: boolean;
  } = {}
): Promise<HypothesisArtifact> => {
  if (papers.length < 2) {
    throw new Error("Two papers are required for analysis");
  }

  const request: ProcessPapersRequest = {
    paper_a: {
      title: papers[0].title,
      content: papers[0].content,
    },
    paper_b: {
      title: papers[1].title,
      content: papers[1].content,
    },
    author_wallet: options.authorWallet || "NTestWallet...",
    use_neofs: options.useNeofs ?? true,
    use_x402: options.useX402 ?? false,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/process-papers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error: BackendError = await response.json();
      throw new Error(error.detail || `API error: ${response.status}`);
    }

    const artifact: HypothesisArtifact = await response.json();
    return artifact;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        `Cannot connect to backend at ${API_BASE_URL}. ` +
        "Make sure the backend server is running: python api_server.py"
      );
    }
    throw error;
  }
};

/**
 * Process two PDF files through the backend pipeline.
 *
 * Use this when you have actual PDF files to upload.
 */
export const processPdfsWithBackend = async (
  pdfA: File,
  pdfB: File,
  options: {
    authorWallet?: string;
    useNeofs?: boolean;
    useX402?: boolean;
  } = {}
): Promise<HypothesisArtifact> => {
  const formData = new FormData();
  formData.append("paper_a", pdfA);
  formData.append("paper_b", pdfB);
  formData.append("author_wallet", options.authorWallet || "NTestWallet...");
  formData.append("use_neofs", String(options.useNeofs ?? true));
  formData.append("use_x402", String(options.useX402 ?? false));

  try {
    const response = await fetch(`${API_BASE_URL}/api/process-pdfs`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error: BackendError = await response.json();
      throw new Error(error.detail || `API error: ${response.status}`);
    }

    const artifact: HypothesisArtifact = await response.json();
    return artifact;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        `Cannot connect to backend at ${API_BASE_URL}. ` +
        "Make sure the backend server is running: python api_server.py"
      );
    }
    throw error;
  }
};

/**
 * Check if backend is available
 */
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/`, {
      method: "GET",
    });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Get backend status info
 */
export const getBackendStatus = async (): Promise<{
  status: string;
  service: string;
  version: string;
} | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch {
    return null;
  }
};
