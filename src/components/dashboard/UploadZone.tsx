import React, { useRef, useState } from 'react';
import { Upload, Loader2, FileText, CheckCircle, X, AlertCircle } from 'lucide-react';
import { Alert } from '@/components/ui';

export interface UploadZoneProps {
  onUpload: (files: File[]) => Promise<void>;
  accept?: string;
  maxSize?: number; // in MB
  maxFiles?: number;
  uploading?: boolean;
  disabled?: boolean;
}

export function UploadZone({
  onUpload,
  accept = '.pdf,.png,.jpg,.jpeg',
  maxSize = 10,
  maxFiles = 20,
  uploading = false,
  disabled = false,
}: UploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

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
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return `"${file.name}" — tipe file tidak didukung (hanya PDF, JPG, PNG).`;
    }
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `"${file.name}" — ukuran melebihi batas ${maxSize} MB.`;
    }
    return null;
  };

  const addFiles = (newFiles: File[]) => {
    setError(null);

    // Validate each file
    for (const file of newFiles) {
      const err = validateFile(file);
      if (err) {
        setError(err);
        return;
      }
    }

    setSelectedFiles(prev => {
      const combined = [...prev];
      for (const f of newFiles) {
        // Avoid duplicates by name
        if (!combined.some(existing => existing.name === f.name)) {
          combined.push(f);
        }
      }
      if (combined.length > maxFiles) {
        setError(`Maksimum ${maxFiles} sertifikat per pengajuan.`);
        return prev;
      }
      return combined;
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled || uploading) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
    // Reset input so same files can be added again if removed
    e.target.value = '';
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

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) return;
    setError(null);
    try {
      await onUpload(selectedFiles);
      setSelectedFiles([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengunggah file.';
      setError(message);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Drop Zone */}
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
          relative border-2 border-dashed rounded-2xl p-8 md:p-10
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
          multiple
          className="hidden"
          disabled={disabled || uploading}
          aria-label="Upload certificate files"
        />

        {uploading ? (
          <div className="space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-white border-2 border-[rgb(34_72_19)] flex items-center justify-center mx-auto">
              <Loader2 className="w-7 h-7 text-[rgb(34_72_19)] animate-spin" />
            </div>
            <div>
              <p className="font-bold text-gray-900 mb-1">Mengunggah sertifikat...</p>
              <p className="text-sm text-gray-500">Harap tunggu, jangan tutup halaman ini</p>
            </div>
          </div>
        ) : (
          <>
            <div className="w-14 h-14 bg-white border-2 border-gray-200 rounded-2xl flex items-center justify-center text-[rgb(34_72_19)] shadow-sm mb-4 hover:scale-105 transition-transform duration-300 mx-auto">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-base font-bold text-gray-900">
              Pilih dokumen atau seret ke sini
            </p>
            <p className="text-sm text-gray-500 mt-1">
              PDF, JPG, JPEG, PNG hingga {maxSize}MB — maks. {maxFiles} file
            </p>
          </>
        )}
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && !uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">
              {selectedFiles.length} file dipilih
            </p>
            <button
              onClick={() => setSelectedFiles([])}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              Hapus semua
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {selectedFiles.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-3 py-2 group"
              >
                <div className="w-7 h-7 rounded-lg bg-[rgb(232_245_233)] flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5 text-[rgb(34_72_19)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                  aria-label={`Hapus ${file.name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <button
            id="btn-submit-certificates"
            onClick={handleSubmit}
            disabled={uploading}
            className="
              w-full py-3 px-4 rounded-xl
              bg-[rgb(34_72_19)] hover:bg-[rgb(45_95_25)]
              text-white text-sm font-bold
              flex items-center justify-center gap-2
              transition-all duration-200 hover:shadow-md active:scale-[0.98]
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <CheckCircle className="w-4 h-4" />
            Ajukan {selectedFiles.length} Sertifikat untuk Analisis AI
          </button>
        </div>
      )}

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
