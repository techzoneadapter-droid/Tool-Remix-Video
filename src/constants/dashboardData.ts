import {
  AudioWaveform,
  BadgeCheck,
  BarChart3,
  Bot,
  BrainCircuit,
  Clock3,
  Clapperboard,
  FileText,
  FolderArchive,
  Image,
  Languages,
  Mic2,
  Music2,
  Palette,
  RotateCcw,
  Subtitles,
  Wand2,
  Zap
} from "lucide-react";
import type { DashboardStat, FeatureCard, ModeSettings, RecentProject } from "@/types/Dashboard";

export const featureCards: FeatureCard[] = [
  {
    id: "auto-remix",
    step: 1,
    title: "Auto Remix",
    badge: "TOÀN DIỆN",
    description:
      "Tự động phân tích, cắt cảnh, viết lại nội dung, thay voice, thêm nhạc, hiệu ứng, sub, tối ưu hình ảnh... để tạo ra video mới khác biệt hoàn toàn.",
    buttonLabel: "Bắt đầu Auto Remix",
    theme: "remix",
    highlights: [
      { label: "Phân tích AI", icon: BrainCircuit },
      { label: "Viết lại kịch bản", icon: FileText },
      { label: "Voice & Nhạc", icon: Music2 },
      { label: "Hiệu ứng", icon: Wand2 },
      { label: "Sub & CTA", icon: Subtitles },
      { label: "Xuất tối ưu", icon: BadgeCheck }
    ],
    footer: "và nhiều hơn thế nữa..."
  },
  {
    id: "auto-translate",
    step: 2,
    title: "Auto Dịch",
    badge: "ĐA NGÔN NGỮ",
    description:
      "Dịch nội dung video sang nhiều ngôn ngữ, tự động tạo phụ đề và thuyết minh giọng đọc AI tự nhiên.",
    buttonLabel: "Bắt đầu Auto Dịch",
    theme: "translate",
    highlights: [
      { label: "Dịch ngôn ngữ", icon: Languages },
      { label: "Tạo phụ đề tự động", icon: Subtitles },
      { label: "Thuyết minh AI", icon: Mic2 }
    ],
    footer: "Hỗ trợ: 🇬🇧 Tiếng Anh   🇨🇳 Tiếng Trung   🇻🇳 Tiếng Việt"
  },
  {
    id: "auto-magic",
    step: 3,
    title: "Auto Magic",
    badge: "THAY ĐỔI BỐI CẢNH",
    description:
      "Giữ nguyên nội dung, lời thoại và ý nghĩa gốc, nhưng tự động thay đổi nhân vật, bối cảnh, phong cách để tạo ra video mới mẻ và độc đáo.",
    buttonLabel: "Bắt đầu Auto Magic",
    theme: "magic",
    highlights: [
      { label: "Giữ nguyên nội dung", icon: RotateCcw },
      { label: "Thay nhân vật", icon: Bot },
      { label: "Đổi bối cảnh", icon: Image },
      { label: "Phong cách mới", icon: Palette }
    ]
  }
];

export const recentProjects: RecentProject[] = [
  {
    id: "project-1",
    name: "Khoa học vũ trụ remix",
    mode: "Auto Remix",
    aspect: "9:16",
    duration: "00:58",
    date: "08/05/2025 14:30",
    status: "Hoàn thành",
    thumbnail: "space"
  },
  {
    id: "project-2",
    name: "Lịch sử Việt Nam dịch sang Anh",
    mode: "Auto Dịch",
    aspect: "16:9",
    duration: "02:15",
    date: "08/05/2025 10:15",
    status: "Hoàn thành",
    thumbnail: "history"
  },
  {
    id: "project-3",
    name: "Cổ trang magic phong cách anime",
    mode: "Auto Magic",
    aspect: "9:16",
    duration: "01:05",
    date: "07/05/2025 20:45",
    status: "Hoàn thành",
    thumbnail: "magic"
  }
];

export const dashboardStats: DashboardStat[] = [
  { label: "Video đã xử lý", value: "128", icon: Clapperboard },
  { label: "Tổng thời gian", value: "12h 45m", icon: Clock3 },
  { label: "Tiết kiệm thời gian", value: "36h 20m", icon: Zap },
  { label: "Dung lượng đã tiết kiệm", value: "48.6 GB", icon: FolderArchive },
  { label: "Credits", value: "12,450", icon: BarChart3 }
];

export const defaultModeSettings: Record<FeatureCard["id"], ModeSettings> = {
  "auto-remix": {
    mode: "Auto Remix",
    modules: [
      { id: "analysis", label: "Phân tích video", description: "Nội dung, cảnh, đối tượng và giọng nói", enabled: true },
      { id: "scene", label: "Cắt cảnh thông minh", description: "Tự nhận diện timeline và nhịp dựng", enabled: true },
      { id: "speech", label: "Nhận diện giọng nói", description: "Chuyển lời thoại thành kịch bản", enabled: true },
      { id: "ocr", label: "OCR", description: "Đọc chữ xuất hiện trong video", enabled: true },
      { id: "rewrite", label: "Viết lại kịch bản", description: "Tối ưu hook, nhịp kể và CTA", enabled: true },
      { id: "voice", label: "Thay giọng đọc", description: "Tạo giọng đọc AI tự nhiên", enabled: true },
      { id: "music", label: "Nhạc nền", description: "Chọn nhạc phù hợp với nội dung", enabled: true },
      { id: "caption", label: "Tạo phụ đề", description: "Phụ đề đẹp và đúng nhịp", enabled: true },
      { id: "thumbnail", label: "Tạo thumbnail", description: "Gợi ý ảnh đại diện tối ưu CTR", enabled: false },
      { id: "enhance", label: "Tối ưu video", description: "Màu sắc, crop, zoom và tốc độ", enabled: true }
    ]
  },
  "auto-translate": {
    mode: "Auto Dịch",
    modules: [
      { id: "language", label: "Ngôn ngữ đích", description: "English, Chinese, Vietnamese", enabled: true },
      { id: "voice", label: "Giọng đọc AI", description: "Giới tính, phong cách và tốc độ", enabled: true },
      { id: "subtitle-style", label: "Kiểu phụ đề", description: "Font, màu, vị trí và animation", enabled: true },
      { id: "subtitle-sync", label: "Đồng bộ phụ đề", description: "Căn thời gian theo giọng đọc mới", enabled: true },
      { id: "audio-mix", label: "Trộn âm thanh", description: "Cân bằng voice over và âm gốc", enabled: true }
    ]
  },
  "auto-magic": {
    mode: "Auto Magic",
    modules: [
      { id: "character", label: "Phong cách nhân vật", description: "Realistic, anime, cyberpunk, fantasy", enabled: true },
      { id: "environment", label: "Bối cảnh mới", description: "Môi trường, kiến trúc và ánh sáng", enabled: true },
      { id: "visual", label: "Phong cách hình ảnh", description: "Cinematic, Pixar, sci-fi hoặc lịch sử", enabled: true },
      { id: "creativity", label: "Mức sáng tạo", description: "Điều chỉnh độ khác biệt thị giác", enabled: true },
      { id: "consistency", label: "Giữ nhất quán", description: "Nhân vật, thời lượng và lời thoại", enabled: true }
    ]
  }
};

export const historyProjects: RecentProject[] = [
  ...recentProjects,
  {
    id: "project-4",
    name: "Review phim tự động",
    mode: "Auto Remix",
    aspect: "16:9",
    duration: "00:49",
    date: "07/05/2025 18:20",
    status: "Đang xử lý",
    thumbnail: "magic"
  },
  {
    id: "project-5",
    name: "Video marketing dịch Trung",
    mode: "Auto Dịch",
    aspect: "16:9",
    duration: "01:30",
    date: "07/05/2025 09:10",
    status: "Hoàn thành",
    thumbnail: "space"
  },
  {
    id: "project-6",
    name: "Chuyển thể truyện thành video",
    mode: "Auto Magic",
    aspect: "9:16",
    duration: "01:16",
    date: "06/05/2025 21:30",
    status: "Hoàn thành",
    thumbnail: "history"
  }
];

export const templates = [
  { name: "Review Phim", views: "72.3K", mode: "Auto Remix", aspect: "9:16", thumbnail: "magic" },
  { name: "Kể Chuyện", views: "98.7K", mode: "Auto Magic", aspect: "16:9", thumbnail: "history" },
  { name: "Top 10", views: "64.3K", mode: "Auto Remix", aspect: "9:16", thumbnail: "space" },
  { name: "Hướng Dẫn", views: "64.2K", mode: "Auto Dịch", aspect: "9:16", thumbnail: "space" },
  { name: "Tin Tức", views: "52.1K", mode: "Auto Dịch", aspect: "16:9", thumbnail: "history" },
  { name: "Phỏng Vấn", views: "41.8K", mode: "Auto Remix", aspect: "9:16", thumbnail: "magic" },
  { name: "Quảng Cáo", views: "38.9K", mode: "Auto Magic", aspect: "9:16", thumbnail: "space" },
  { name: "Du Lịch", views: "32.7K", mode: "Auto Magic", aspect: "16:9", thumbnail: "history" }
];
