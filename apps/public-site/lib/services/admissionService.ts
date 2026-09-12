import { apiGetSafe, apiPost, USE_MOCK_DATA } from "@/lib/services/apiClient";

export interface AdmissionClassOption {
  id: string;
  name: string;
}

// Demo-mode class list — mirrors the mock philosophy used elsewhere
// (facilityService, facultyService, etc). Once live, the real class list
// (and real ids the backend actually accepts) comes from GET /api/admissions/classes.
const mockClasses: AdmissionClassOption[] = [
  "Class I",
  "Class II",
  "Class III",
  "Class IV",
  "Class V",
  "Class VI",
  "Class VII",
  "Class VIII",
  "Class IX",
  "Class X",
].map((name, i) => ({ id: `demo-class-${i + 1}`, name }));

// GET /api/admissions/classes — public, unauthenticated endpoint made for
// exactly this dropdown. Falls back to the demo list on any API error so
// the form still renders (though submissions would then fail server-side
// with a real backend, since demo ids aren't real class ids — that's an
// acceptable degrade, matching this app's existing fallback conventions).
export async function fetchAdmissionClasses(): Promise<AdmissionClassOption[]> {
  if (USE_MOCK_DATA) return mockClasses;
  return apiGetSafe<AdmissionClassOption[]>("/api/admissions/classes", mockClasses);
}

export interface AdmissionEnquiryPayload {
  studentName: string;
  dateOfBirth: string;
  gender: string;
  classId: string;
  previousSchool?: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  address: string;
  message?: string;
}

export interface AdmissionEnquiryResponse {
  success: boolean;
  referenceId?: string;
  message: string;
}

// POST /api/admissions — field names/shape match AdmissionsController's
// createSchema on the backend exactly (classId, parentName, parentPhone,
// parentEmail — not the friendlier client-side names the form used to send).
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
        "This is a demo submission — no data was sent anywhere. Connect NEXT_PUBLIC_API_URL to go live.",
    };
  }
  const created = await apiPost<{ applicationNumber: string }>("/api/admissions", payload);
  return {
    success: true,
    referenceId: created.applicationNumber,
    message: `Thank you — your enquiry has been received. Your reference number is ${created.applicationNumber}. Our admissions team will contact you shortly.`,
  };
}
