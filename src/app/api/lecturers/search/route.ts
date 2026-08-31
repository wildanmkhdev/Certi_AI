import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';

    const supabaseAdmin = createAdminClient();

    // Query dari view public.lecturer_directory
    let query = supabaseAdmin
      .from('lecturer_directory')
      .select('*')
      .limit(20);

    if (q.trim()) {
      query = query.or(`full_name.ilike.%${q}%,lecturer_number.ilike.%${q}%`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ lecturers: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
