import { apiPost, USE_MOCK_DATA } from "@/lib/services/apiClient";

export interface NewsletterSubscribePayload {
  email: string;
}

export interface NewsletterSubscribeResponse {
  success: boolean;
  message: string;
}

// TODO: connect to POST /api/newsletter/subscribe once the backend exists.
// Until then this mirrors contactService's mock convention rather than
// pretending a real subscription succeeded.
export async function subscribeToNewsletter(
  payload: NewsletterSubscribePayload
): Promise<NewsletterSubscribeResponse> {
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
      success: true,
      message:
        "This is a demo submission — no email was actually subscribed. Connect POST /api/newsletter/subscribe to go live.",
    };
  }
  return apiPost<NewsletterSubscribeResponse>("/api/newsletter/subscribe", payload);
}
