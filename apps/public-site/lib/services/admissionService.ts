import { apiPost, USE_MOCK_DATA } from "@/lib/services/apiClient";

export interface AdmissionEnquiryPayload {
  studentName: string;
  dateOfBirth: string;
  gender: string;
  classApplyingFor: string;
  previousSchool?: string;
  guardianName: string;
  phone: string;
  email: string;
  address: string;
  message?: string;
}

export interface AdmissionEnquiryResponse {
  success: boolean;
  referenceId?: string;
  message: string;
}

// Future: POST /api/admissions
export async function submitAdmissionEnquiry(
  payload: AdmissionEnquiryPayload
): Promise<AdmissionEnquiryResponse> {
  if (USE_MOCK_DATA) {
    // Simulate latency so the UI's loading state can be exercised.
    await new Promise((resolve) => setTimeout(resolve, 900));
    return {
      success: true,
      referenceId: `DEMO-${Date.now()}`,
      message:
        "This is a demo submission — no data was sent anywhere. Connect POST /api/admissions to go live.",
    };
  }
  return apiPost<AdmissionEnquiryResponse>("/api/admissions", payload);
}
