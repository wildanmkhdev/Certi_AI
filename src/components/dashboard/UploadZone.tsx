import React, { useRef, useState } from 'react';
import { Upload, Loader2, FileText, CheckCircle } from 'lucide-react';
import { Alert } from '@/components/ui';

export interface UploadZoneProps {
  onUpload: (file: File) => Promise<void>;
  accept?: string;
  maxSize?: number; // in MB
  uploading?: boolean;
  disabled?: boolean;
}

export function UploadZone({
  onUpload,
  accept = '.pdf,.png,.jpg,.jpeg',
  maxSize = 10,
  uploading = false,
  disabled = false,
}: UploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return 'Tipe file tidak didukung. Harap unggah PDF, JPG, atau PNG.';
    }

    // Check file size
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `Ukuran file melebihi batas ${maxSize} MB.`;
    }

    return null;
  };

  const handleFile = async (file: File) => {
    setError(null);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await onUpload(file);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengunggah file.';
      setError(message);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled || uploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div
        role="button"
        tabIndex={disabled || uploading ? -1 : 0}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 md:p-12 
          flex flex-col items-center justify-center text-center
          transition-all duration-300 cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-[rgb(34_72_19)] focus:ring-offset-2
          ${dragActive
            ? 'border-[rgb(34_72_19)] bg-[rgb(232_245_233)]/40 scale-[1.02]'
            : 'border-gray-200 bg-gray-50/50 hover:border-[rgb(76_175_80)]/40 hover:bg-[rgb(232_245_233)]/20'
          }
          ${(disabled || uploading) && 'opacity-60 cursor-not-allowed'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleChange}
          accept={accept}
          className="hidden"
          disabled={disabled || uploading}
          aria-label="Upload certificate file"
        />

        {uploading ? (
          <div className="space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-white border-2 border-[rgb(34_72_19)] flex items-center justify-center animate-pulse-glow">
                <Loader2 className="w-8 h-8 text-[rgb(34_72_19)] animate-spin" />
              </div>
            </div>
            <div>
              <p className="font-bold text-gray-900 mb-1">Menganalisis dengan AI...</p>
              <p className="text-sm text-gray-500">Harap tunggu, jangan tutup halaman ini</p>
            </div>
          </div>
        ) : (
          <>
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-[rgb(34_72_19)] rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity" />
              <div className="relative w-16 h-16 bg-white border-2 border-gray-200 rounded-2xl flex items-center justify-center text-[rgb(34_72_19)] shadow-sm hover:scale-105 transition-transform duration-300">
                <Upload className="w-7 h-7" />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-base font-bold text-gray-900">
                Pilih dokumen atau seret ke sini
              </p>
              <p className="text-sm text-gray-500">
                PDF, JPG, JPEG, PNG hingga {maxSize}MB
              </p>
            </div>

            {/* Quick Tips */}
            <div className="mt-6 pt-6 border-t border-gray-200 w-full max-w-md">
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="flex flex-col items-center gap-1">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 font-medium">PDF</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 font-medium">Otomatis</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Upload className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 font-medium">Aman</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Upload Guidelines */}
      <div className="bg-[rgb(232_245_233)] border border-[rgb(76_175_80)]/30 rounded-xl p-4">
        <h4 className="text-xs font-bold text-[rgb(34_72_19)] uppercase tracking-wider mb-2">
          Aturan Bobot UINSU:
        </h4>
        <ul className="text-xs text-gray-700 space-y-1">
          <li>• Workshop 4-8 jam = Bobot 1</li>
          <li>• Workshop &gt;8 jam = Bobot 2</li>
          <li>• Seminar &lt;4 jam = Bobot 1</li>
          <li>• Kompetisi: Lokal (1), Nasional (2), Internasional (3)</li>
          <li>• Sertifikasi Keahlian = Bobot 3</li>
        </ul>
      </div>
    </div>
  );
}
