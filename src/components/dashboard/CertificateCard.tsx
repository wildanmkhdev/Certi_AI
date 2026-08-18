import React from 'react';
import type { Certificate } from '@/types/database';
import { Calendar, Layers, Trash2, Eye } from 'lucide-react';
import { StatusBadge, Card, Button } from '@/components/ui';

export interface CertificateCardProps {
  certificate: Certificate;
  onView: (cert: Certificate) => void;
  onDelete?: (cert: Certificate) => void;
  showActions?: boolean;
}

export function CertificateCard({
  certificate,
  onView,
  onDelete,
  showActions = true,
}: CertificateCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Card hover className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-base truncate">
            {certificate.title || certificate.file_name}
          </h3>
          <p className="text-sm text-gray-500 mt-1 truncate">
            {certificate.organizer || 'Penyelenggara tidak diketahui'}
          </p>
        </div>
        <StatusBadge status={certificate.status} size="sm" />
      </div>

      {/* Details */}
      <div className="space-y-2 text-sm">
        {certificate.category && (
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Kategori AI</span>
            <span className="badge-uinsu text-xs">{certificate.category}</span>
          </div>
        )}

        {certificate.event_date && (
          <div className="flex items-center justify-between">
            <span className="text-gray-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Tanggal
            </span>
            <span className="font-medium text-gray-900">{formatDate(certificate.event_date)}</span>
          </div>
        )}

        {certificate.duration_hours && (
          <div className="flex items-center justify-between">
            <span className="text-gray-500 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              Durasi
            </span>
            <span className="font-medium text-gray-900">{certificate.duration_hours} Jam</span>
          </div>
        )}

        {certificate.status === 'approved' && certificate.final_weight !== null && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-gray-500 font-semibold">Bobot Disetujui</span>
            <span className="text-2xl font-black text-[rgb(34_72_19)]">{certificate.final_weight}</span>
          </div>
        )}

        {certificate.status === 'waiting_review' && (
          <div className="bg-[rgb(232_245_233)]/60 border border-[rgb(76_175_80)]/30 rounded-xl p-2.5 flex items-center justify-between mt-2">
            <div className="flex items-center gap-1.5 text-xs text-[rgb(34_72_19)] font-bold">
              <span>✨ Hasil Ekstraksi AI Selesai</span>
            </div>
            <span className="text-xs font-extrabold bg-white px-2 py-0.5 rounded-md border border-[rgb(76_175_80)]/30 text-gray-800">
              Siap Direview Dosen
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          <Button
            variant="primary"
            size="sm"
            icon={<Eye className="w-3.5 h-3.5" />}
            onClick={() => onView(certificate)}
            fullWidth
          >
            Detail
          </Button>

          {onDelete && certificate.status !== 'approved' && (
            <Button
              variant="secondary"
              size="sm"
              icon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={() => onDelete(certificate)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Hapus
            </Button>
          )}
        </div>
      )}

      {/* Upload Time */}
      <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
        Diunggah {formatDate(certificate.created_at)}
      </div>
    </Card>
  );
}
