import { useState } from "react";
import { Eye, EyeOff, KeyRound, Save, Trash2 } from "lucide-react";
import type { ProviderId } from "@/config/providerConfig";
import { aiProviderRegistry } from "@/services/AiProviderRegistry";

export function AiProviderSecretManager({
  providerId,
  configured,
  onChanged
}: {
  providerId: ProviderId;
  configured: boolean;
  onChanged: () => void | Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    const secret = value.trim();
    if (!secret) {
      setMessage("Hãy nhập API key trước khi lưu.");
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      await aiProviderRegistry.saveProviderSecret(providerId, secret);
      setValue("");
      setEditing(false);
      setMessage("Đã lưu key bằng bảo vệ native của Windows.");
      await Promise.resolve(onChanged());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể lưu API key.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setMessage(null);
    try {
      await aiProviderRegistry.removeProviderSecret(providerId);
      setValue("");
      setEditing(false);
      setMessage("Đã xóa key lưu trong app.");
      await Promise.resolve(onChanged());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể xóa API key.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
      <div className="flex items-center gap-2">
        <KeyRound size={14} className={configured ? "text-emerald-300" : "text-white/35"} />
        <span className="text-[11px] font-semibold text-white/55">
          {configured ? "API key đã được cấu hình" : "Chưa có API key"}
        </span>
        <button
          type="button"
          className="ml-auto rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-[10px] font-bold text-white/65 hover:bg-white/[0.05]"
          onClick={() => { setEditing((current) => !current); setMessage(null); }}
          disabled={busy}
        >
          {editing ? "Đóng" : configured ? "Đổi key" : "Nhập key"}
        </button>
      </div>

      {editing ? (
        <div className="mt-3 space-y-2">
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <input
                className="h-10 w-full rounded-xl border border-white/[0.08] bg-black/25 px-3 pr-10 text-xs text-white outline-none placeholder:text-white/25 focus:border-purple-400/40"
                type={visible ? "text" : "password"}
                autoComplete="off"
                spellCheck={false}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="Dán API key vào đây"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white/70"
                onClick={() => setVisible((current) => !current)}
                aria-label={visible ? "Ẩn API key" : "Hiện API key"}
              >
                {visible ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <button
              type="button"
              className="flex h-10 items-center gap-1.5 rounded-xl bg-purple-500/20 px-3 text-[11px] font-bold text-purple-100 hover:bg-purple-500/30 disabled:opacity-40"
              disabled={busy || !value.trim()}
              onClick={() => void save()}
            >
              <Save size={13} />
              Lưu
            </button>
            {configured ? (
              <button
                type="button"
                className="flex h-10 items-center gap-1.5 rounded-xl border border-red-400/15 bg-red-400/[0.05] px-3 text-[11px] font-bold text-red-200 hover:bg-red-400/10 disabled:opacity-40"
                disabled={busy}
                onClick={() => void remove()}
              >
                <Trash2 size={13} />
                Xóa
              </button>
            ) : null}
          </div>
          <p className="text-[10px] leading-4 text-white/35">
            Key không được trả ngược về React sau khi lưu. Bản Windows mã hóa bằng DPAPI theo tài khoản Windows hiện tại.
          </p>
        </div>
      ) : null}

      {message ? <div className="mt-2 text-[10px] leading-4 text-white/50">{message}</div> : null}
    </div>
  );
}
