import { config } from "../config";

function basicAuthHeader(): string {
  const token = Buffer.from(`${config.khipuReceiverId}:${config.khipuSecret}`, "utf8").toString("base64");
  return `Basic ${token}`;
}

async function khipuFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${config.khipuBaseUrl}${path}`;
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", basicAuthHeader());
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  const res = await fetch(url, { ...init, headers });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg = typeof data === "string" ? data : JSON.stringify(data);
    throw new Error(`Khipu ${res.status}: ${msg}`);
  }
  return data as T;
}

export type KhipuCreatePaymentRequest = {
  subject: string;
  amount: number;
  currency?: string;
  transaction_id: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  notify_api_version: "3.0";
  payer_email?: string;
  custom?: string;
};

export type KhipuCreatePaymentResponse = {
  payment_id: string;
  payment_url: string;
  simplified_transfer_url?: string;
  transfer_url?: string;
  app_url?: string;
  ready_for_terminal?: boolean;
};

export type KhipuGetPaymentResponse = {
  payment_id: string;
  payment_url: string;
  amount: number;
  currency: string;
  status: string;
  transaction_id: string;
  receiver_id: number;
};

export async function createPayment(req: KhipuCreatePaymentRequest): Promise<KhipuCreatePaymentResponse> {
  return khipuFetch<KhipuCreatePaymentResponse>("/payments", {
    method: "POST",
    body: JSON.stringify(req)
  });
}

export async function getPayment(paymentId: string): Promise<KhipuGetPaymentResponse> {
  return khipuFetch<KhipuGetPaymentResponse>(`/payments/${encodeURIComponent(paymentId)}`, {
    method: "GET"
  });
}
