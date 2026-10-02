# Local Vietnamese TTS

App dùng local-first cho giọng tiếng Việt:

- VieNeu-TTS: engine chính, gọi qua API local `http://127.0.0.1:8000`, có preset `Ngọc Huyền`.
- KorvaTTS: fallback chạy trực tiếp bằng lệnh `korvatts`, có 10 preset Việt (Bảo Kim, Khánh Vy, Ngọc Huyền, Phương Linh, Quỳnh Như và 5 giọng nam).
- Nếu chọn `Marin · cloud fallback`, app mới dùng provider cloud đã cấu hình.

## 1. Chạy VieNeu-TTS

Cài `uv`, sau đó:

```bash
git clone https://github.com/pnnbao97/VieNeu-TTS.git
cd VieNeu-TTS
uv sync
uv run python -m apps.openai_speech
```

Giữ cửa sổ server mở trong lúc render. Có thể đổi URL bằng biến môi trường `VIENEU_LOCAL_URL`.

## 2. Cài KorvaTTS fallback

```bash
python -m venv .venv
# Windows
.venv\\Scripts\\activate
# macOS/Linux
source .venv/bin/activate
pip install korvatts
```

Kiểm tra nhanh:

```bash
korvatts synth "Xin chào, đây là bản thử giọng." -v ngoc_huyen -o test.wav
```

Nếu Windows không nhận lệnh, đặt `KORVATTS_BIN` thành đường dẫn đầy đủ tới executable `korvatts`.

## Ghi chú

Lần chạy đầu có thể phải tải model/voice weights. VieNeu chạy qua server local; Korva chạy bằng CPU/GPU tùy môi trường. App không gửi văn bản lên cloud khi chọn một trong hai giọng local. Chỉ dùng preset hoặc giọng đã có quyền sử dụng; không bật voice cloning cho giọng người thật nếu chưa có sự cho phép.
