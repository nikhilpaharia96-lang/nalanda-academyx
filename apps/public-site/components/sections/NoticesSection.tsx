import { getNotices } from "@/lib/services/noticeService";
import { NoticesSectionView } from "@/components/sections/NoticesSectionView";

export async function NoticesSection() {
  const notices = await getNotices();
  return <NoticesSectionView notices={notices} />;
}
