import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('focus_reviews')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { data, error } = await supabaseAdmin
    .from('focus_reviews')
    .insert([
      {
        sprint_id: body.sprintId,
        week_number: body.weekNumber,
        what_worked: body.whatWorked,
        what_failed: body.whatFailed,
        biggest_distraction: body.biggestDistraction,
        next_week_focus: body.nextWeekFocus,
        date: body.date,
      },
    ])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
