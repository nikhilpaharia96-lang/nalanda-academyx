import { apiPost, USE_MOCK_DATA } from "@/lib/services/apiClient";

export interface ContactMessagePayload {
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactMessageResponse {
  success: boolean;
  message: string;
}

// Future: POST /api/contact
export async function submitContactMessage(
  payload: ContactMessagePayload
): Promise<ContactMessageResponse> {
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 900));
    return {
      success: true,
      message:
        "This is a demo submission — no data was sent anywhere. Connect POST /api/contact to go live.",
    };
  }
  return apiPost<ContactMessageResponse>("/api/contact", payload);
}
