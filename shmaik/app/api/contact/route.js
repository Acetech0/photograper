import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { name, email, projectType, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email and message are required.' }, { status: 400 });
    }

    if (!process.env.WEB3FORMS_KEY) {
      console.error('Contact route error: WEB3FORMS_KEY environment variable is not set.');
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_key: process.env.WEB3FORMS_KEY,
        subject: `New Inquiry: ${projectType || 'General'} — from ${name}`,
        from_name: name,
        replyto: email,
        name,
        email,
        projectType: projectType || '—',
        message,
      }),
    });

    // Guard: web3forms sometimes returns HTML on misconfiguration instead of JSON
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      console.error('Contact route error: web3forms returned non-JSON response:', text.slice(0, 200));
      throw new Error('Unexpected response from mail service.');
    }

    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Submission failed.');

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Contact route error:', err);
    return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 });
  }
}
