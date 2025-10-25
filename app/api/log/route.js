import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, checkboxLabel, isChecked, timestamp, meta } = body;

    const { error } = await supabase.from('logs').insert([
      { name, checkbox_label: checkboxLabel, is_checked: isChecked, timestamp, meta },
    ]);

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    return new Response(JSON.stringify({ message: 'Logged successfully' }), { status: 200 });
  } catch (err) {
    console.error('Logging API error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
