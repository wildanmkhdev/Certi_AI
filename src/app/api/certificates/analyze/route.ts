import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ai } from '@/lib/gemini/client';
import { z } from 'zod';

// Define expected Gemini JSON output schema
const analysisSchema = z.object({
  title: z.string().nullable().default('Sertifikat'),
  organizer: z.string().nullable().default(''),
  category: z.string().nullable().default(''),
  event_date: z.string().nullable().default(null),
  duration_hours: z.number().nullable().default(null),
  recommended_weight: z.number().default(0),
  confidence: z.number().min(0).max(1).default(0.5),
  reasoning: z.string().nullable().default(''),
});

export async function POST(request: NextRequest) {
  const supabaseAdmin = createAdminClient();

  try {
    const { certificateId } = await request.json();

    if (!certificateId) {
      return NextResponse.json({ error: 'Certificate ID is required' }, { status: 400 });
    }

    // 1. Fetch certificate record
    const { data: certificate, error: fetchError } = await supabaseAdmin
      .from('certificates')
      .select('*')
      .eq('id', certificateId)
      .single();

    if (fetchError || !certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    // Avoid duplicate processing
    if (certificate.status === 'waiting_review' || certificate.status === 'approved' || certificate.status === 'rejected') {
      return NextResponse.json({ message: 'Certificate already processed', status: certificate.status });
    }

    // Update status to processing
    await supabaseAdmin
      .from('certificates')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', certificateId);

    // 2. Fetch weight rules from DB
    const { data: rules } = await supabaseAdmin
      .from('weight_rules')
      .select('*')
      .eq('is_active', true);

    const rulesListStr = JSON.stringify(rules || [], null, 2);

    // Check if Gemini API Key is configured and valid
    const isMock =
      !process.env.GEMINI_API_KEY ||
      process.env.GEMINI_API_KEY === 'your-gemini-api-key' ||
      process.env.GEMINI_API_KEY === '';

    let parsedResult;
    let modelName = isMock ? 'mock-ai-fallback' : 'gemini-1.5-flash';

    if (isMock) {
      console.log('Running AI extraction with Mock Fallback (GEMINI_API_KEY not configured)...');
      // Simple mock parser based on file name or type
      const filenameLower = certificate.file_name.toLowerCase();
      let category = 'Seminar';
      let duration = 2;
      let weight = 1;
      let title = 'Seminar Nasional Teknologi Informasi';
      let organizer = 'Universitas Terbuka';
      let reasoning = 'Mock AI: Mendeteksi format sertifikat seminar.';

      if (filenameLower.includes('work') || filenameLower.includes('workshop')) {
        category = 'Workshop';
        duration = 8;
        weight = 1;
        title = 'Workshop Pembangunan Web Modern';
        organizer = 'Developer Circle';
        reasoning = 'Mock AI: Mendeteksi kata "workshop" dalam nama berkas. Aturan: Workshop 4-8 jam = bobot 1.';
      } else if (filenameLower.includes('comp') || filenameLower.includes('lomba') || filenameLower.includes('komp')) {
        category = 'Competition';
        duration = 2; // National level
        weight = 2;
        title = 'Kompetisi Pemrograman Mahasiswa Nasional';
        organizer = 'Kementerian Pendidikan dan Kebudayaan';
        reasoning = 'Mock AI: Mendeteksi kata kompetisi dalam nama berkas. Aturan: Kompetisi nasional = bobot 2.';
      } else if (filenameLower.includes('cert') || filenameLower.includes('sertifikasi')) {
        category = 'Certification';
        duration = 40;
        weight = 3;
        title = 'Sertifikasi Kompetensi Cloud Architect';
        organizer = 'AWS Academy';
        reasoning = 'Mock AI: Mendeteksi kata sertifikasi dalam nama berkas. Aturan: Sertifikasi keahlian profesional = bobot 3.';
      }

      parsedResult = {
        title,
        organizer,
        category,
        event_date: new Date().toISOString().split('T')[0],
        duration_hours: duration,
        recommended_weight: weight,
        confidence: 0.9,
        reasoning,
      };
      
      // Simulate small delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
    } else {
      // 3. Download certificate file from storage
      const { data: fileData, error: downloadError } = await supabaseAdmin.storage
        .from('certificates')
        .download(certificate.file_path);

      if (downloadError || !fileData) {
        throw new Error(downloadError?.message || 'Failed to download certificate from storage');
      }

      // Convert file blob to Base64
      const arrayBuffer = await fileData.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString('base64');
      const fileMimeType = certificate.file_type;

      // 4. Construct AI prompt
      const promptText = `
Kamu adalah AI asisten untuk sistem verifikasi sertifikat mahasiswa.
Tugasmu adalah menganalisis berkas sertifikat yang diberikan (berkas PDF/Gambar) dan mengekstrak informasi penting.

Berikut adalah aturan pemberian bobot sertifikat yang harus kamu jadikan acuan:
${rulesListStr}

Harap analisis berkas sertifikat tersebut dan kembalikan data hasil ekstraksi dalam format JSON yang valid sesuai dengan skema di bawah ini. Harap diperhatikan bahwa kategori dan bobot rekomendasi harus sesuai dengan aturan di atas.

Struktur JSON yang WAJIB dihasilkan:
{
  "title": "Nama kegiatan/sertifikat yang tertera",
  "organizer": "Institusi/Penyelenggara kegiatan",
  "category": "Kategori kegiatan (misalnya: Workshop, Seminar, Competition, Certification, dll)",
  "event_date": "Tanggal pelaksanaan kegiatan (format YYYY-MM-DD atau null jika tidak ditemukan)",
  "duration_hours": durasi_kegiatan_dalam_jam_sebagai_angka_atau_null_jika_tidak_tertera,
  "recommended_weight": bobot_rekomendasi_sesuai_dengan_aturan_di_atas_sebagai_angka_bulat,
  "confidence": tingkat_kepercayaan_hasil_analisis_antara_0_sampai_1_sebagai_angka_desimal,
  "reasoning": "Alasan ringkas mengapa kategori dan bobot ini dipilih berdasarkan berkas sertifikat dan aturan bobot"
}
`;

      // 5. Invoke Gemini API
      const geminiResponse = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
          {
            inlineData: {
              data: base64Data,
              mimeType: fileMimeType,
            },
          },
          promptText,
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = geminiResponse.text;
      if (!responseText) {
        throw new Error('Gemini API returned an empty response');
      }

      // Parse and validate with Zod
      const jsonOutput = JSON.parse(responseText.trim());
      parsedResult = analysisSchema.parse(jsonOutput);
    }

    // 6. Save AI results into DB
    const { error: aiInsertError } = await supabaseAdmin
      .from('certificate_ai_analysis')
      .insert({
        certificate_id: certificateId,
        extracted_text: parsedResult.reasoning, // we store the reasoning or full context here
        title: parsedResult.title,
        organizer: parsedResult.organizer,
        category: parsedResult.category,
        event_date: parsedResult.event_date,
        duration_hours: parsedResult.duration_hours,
        recommended_weight: parsedResult.recommended_weight,
        confidence: parsedResult.confidence,
        reasoning: parsedResult.reasoning,
        model_name: modelName,
      });

    if (aiInsertError) {
      throw aiInsertError;
    }

    // 7. Update main certificate table with extracted data and move status to waiting_review
    const { error: certUpdateError } = await supabaseAdmin
      .from('certificates')
      .update({
        title: parsedResult.title,
        organizer: parsedResult.organizer,
        category: parsedResult.category,
        event_date: parsedResult.event_date,
        duration_hours: parsedResult.duration_hours,
        status: 'waiting_review',
        updated_at: new Date().toISOString(),
      })
      .eq('id', certificateId);

    if (certUpdateError) {
      throw certUpdateError;
    }

    return NextResponse.json({
      success: true,
      message: 'AI analysis completed successfully',
      data: parsedResult,
    });
  } catch (error: any) {
    console.error('AI Analysis Error:', error);

    // Rollback status to pending on error so it can be re-tried
    try {
      const body = await request.clone().json();
      if (body?.certificateId) {
        await supabaseAdmin
          .from('certificates')
          .update({ status: 'pending', updated_at: new Date().toISOString() })
          .eq('id', body.certificateId);
      }
    } catch (e) {
      // Ignore body parsing failures in rollback catch
    }

    return NextResponse.json(
      { error: error.message || 'An error occurred during AI processing' },
      { status: 500 }
    );
  }
}
