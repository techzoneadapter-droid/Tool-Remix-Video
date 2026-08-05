import { Download, RefreshCw, Scissors, Sparkles, TimerReset } from "lucide-react";
import type { WorkflowDefinition } from "@/types/Workflow";

const spaceScenes = [
  {
    id: "01",
    time: "00:00 - 00:45",
    title: "Mở đầu vũ trụ",
    description: "Giới thiệu tổng quan về vũ trụ bao la...",
    tag: "Giữ nguyên"
  },
  {
    id: "02",
    time: "00:45 - 01:30",
    title: "Nguồn gốc vũ trụ",
    description: "Big Bang và sự hình thành vũ trụ...",
    tag: "Viết lại"
  },
  {
    id: "03",
    time: "01:30 - 02:15",
    title: "Hố đen bí ẩn",
    description: "Những bí ẩn về hố đen trong vũ trụ...",
    tag: "Phụ đề"
  },
  {
    id: "04",
    time: "02:15 - 03:00",
    title: "Hệ hành tinh xa xôi",
    description: "Khám phá các hệ hành tinh ngoài thiên hà...",
    tag: "Nhạc nền"
  },
  {
    id: "05",
    time: "03:00 - 03:45",
    title: "Sự sống ngoài hành tinh",
    description: "Liệu có sự sống trong vũ trụ?",
    tag: "Phụ đề"
  }
];

export const workflows: Record<WorkflowDefinition["route"], WorkflowDefinition> = {
  "auto-remix": {
    route: "auto-remix",
    title: "Auto Remix",
    badge: "TOÀN DIỆN",
    theme: "remix",
    description:
      "AI sẽ tự động phân tích, cắt cảnh, viết lại nội dung, thay voice, thêm nhạc, phụ đề và tạo video mới hoàn chỉnh.",
    primaryLabel: "Bắt đầu Auto Remix",
    previewTitle: "Xem trước video",
    timelineTitle: "Timeline & Cảnh (Scene)",
    previewVariant: "space-blue",
    actions: [
      { label: "Tạo lại", icon: RefreshCw, intent: "regenerate" },
      { label: "Tạo lại khác", icon: Sparkles, intent: "regenerate" },
      { label: "Chỉnh sửa", icon: Scissors, intent: "edit" },
      { label: "Xuất video", icon: Download, primary: true, intent: "export" }
    ],
    settings: [
      { label: "Phân tích video", description: "Phân tích nội dung, cảnh, đối tượng, giọng nói...", enabled: true },
      { label: "Nhận diện cảnh", description: "Tự động tách cảnh và xác định nhịp dựng.", enabled: true },
      { label: "Nhận diện giọng nói", description: "Chuyển lời thoại thành kịch bản có thời gian.", enabled: true },
      { label: "OCR nội dung trong hình", description: "Đọc chữ xuất hiện trong khung hình.", enabled: true },
      { label: "Viết lại nội dung (AI Rewrite)", description: "Tối ưu kịch bản hấp dẫn nhưng giữ nguyên ý chính.", enabled: true },
      { label: "Tạo prompt", description: "Tạo prompt nhất quán cho hình ảnh, b-roll và video.", enabled: true },
      { label: "Thay giọng đọc (AI Voice)", description: "Tạo giọng đọc tự nhiên, truyền cảm hơn.", enabled: true },
      { label: "Tạo phụ đề (Subtitle)", description: "Tự động tạo phụ đề chính xác và đẹp mắt.", enabled: true },
      { label: "Nhạc nền (Background Music)", description: "Tự động chọn nhạc phù hợp với nội dung.", enabled: true },
      { label: "Hiệu ứng & Chuyển cảnh", description: "Thêm hiệu ứng, chuyển cảnh mượt mà.", enabled: true },
      { label: "Tạo CTA", description: "Đề xuất lời kêu gọi hành động tự nhiên.", enabled: false },
      { label: "Tạo thumbnail (AI Thumbnail)", description: "Tạo thumbnail thu hút, tối ưu CTR.", enabled: true },
      { label: "Tối ưu video (Enhancement)", description: "Tăng chất lượng, màu sắc và độ nét.", enabled: true },
      { label: "Xuất video", description: "Render và lưu video hoàn chỉnh.", enabled: true }
    ],
    scenes: spaceScenes
  },
  "auto-translate": {
    route: "auto-translate",
    title: "Auto Dịch",
    badge: "ĐA NGÔN NGỮ",
    theme: "translate",
    description:
      "Dịch nội dung video sang nhiều ngôn ngữ, tự động tạo phụ đề và thuyết minh giọng đọc AI tự nhiên.",
    primaryLabel: "Bắt đầu Auto Dịch",
    previewTitle: "Xem trước kết quả",
    timelineTitle: "Chỉnh sửa phụ đề",
    previewVariant: "space-orange",
    actions: [
      { label: "Tạo lại", icon: RefreshCw, intent: "regenerate" },
      { label: "Đặt lại", icon: TimerReset, intent: "settings" },
      { label: "Xuất video", icon: Download, primary: true, intent: "export" }
    ],
    settings: [
      { label: "English", description: "Tiếng Anh", enabled: true },
      { label: "中文", description: "Tiếng Trung", enabled: false },
      { label: "Việt Nam", description: "Tiếng Việt", enabled: false },
      { label: "Dịch cả nội dung trong hình (OCR)", enabled: true },
      { label: "Giữ nguyên âm thanh gốc", enabled: false },
      { label: "Tự động đồng bộ phụ đề", enabled: true },
      { label: "Tạo voice over AI", description: "Sinh giọng đọc mới theo ngôn ngữ đích.", enabled: true },
      { label: "Trộn âm thanh", description: "Cân bằng voice over với âm thanh gốc.", enabled: true }
    ],
    scenes: [
      { id: "01", time: "00:00:00 - 00:00:04", title: "The universe is an infinite place full of mysteries.", description: "Subtitle line synced to voice over.", tag: "EN" },
      { id: "02", time: "00:00:04 - 00:00:08", title: "It contains billions of galaxies, each with billions of stars.", description: "Translated sentence with timing.", tag: "EN" },
      { id: "03", time: "00:00:08 - 00:00:12", title: "Humans are just a small part of this vast space.", description: "Subtitle editable row.", tag: "EN" },
      { id: "04", time: "00:00:12 - 00:00:16", title: "Exploring the universe helps us understand ourselves better.", description: "Final caption block.", tag: "EN" }
    ]
  },
  "auto-magic": {
    route: "auto-magic",
    title: "Auto Magic",
    badge: "THAY ĐỔI BỐI CẢNH",
    theme: "magic",
    description:
      "Giữ nguyên nhân vật, lời thoại và ý nghĩa gốc, nhưng tự động thay đổi nhân vật, bối cảnh và phong cách để tạo ra video mới mẻ.",
    primaryLabel: "Bắt đầu Auto Magic",
    previewTitle: "Xem trước kết quả",
    timelineTitle: "Timeline & Cảnh (đã thay đổi bối cảnh)",
    previewVariant: "magic-world",
    actions: [
      { label: "Tạo lại", icon: RefreshCw, intent: "regenerate" },
      { label: "Tạo lại khác", icon: Sparkles, intent: "regenerate" },
      { label: "Cài đặt nhanh", icon: TimerReset, intent: "settings" },
      { label: "Xuất video", icon: Download, primary: true, intent: "export" }
    ],
    settings: [
      { label: "Realistic", description: "Phong cách chân thực", enabled: true },
      { label: "Cinematic", description: "Ánh sáng điện ảnh", enabled: false },
      { label: "Anime", description: "Phong cách hoạt hình Nhật", enabled: false },
      { label: "3D Cartoon", description: "Nhân vật 3D mềm mại", enabled: false },
      { label: "Cyberpunk", description: "Ánh sáng neon tương lai", enabled: false },
      { label: "Fantasy", description: "Thế giới kỳ ảo", enabled: false },
      { label: "Giữ nguyên nội dung & ý nghĩa", enabled: true },
      { label: "Giữ nguyên lời thoại & giọng nói", enabled: true },
      { label: "Giữ nhịp độ & thời lượng", enabled: true }
    ],
    scenes: spaceScenes.map((scene) => ({ ...scene, tag: "Đã thay đổi" }))
  }
};
