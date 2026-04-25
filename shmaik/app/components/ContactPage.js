'use client';

import { useState } from 'react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', projectType: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      setStatus('success');
      setForm({ name: '', email: '', projectType: '', message: '' });
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  }

  return (
    <div className="contact-page">
      <div className="contact-layout">
        <div className="contact-left">
          <p className="about-label">Get in Touch</p>
          <hr className="about-divider" />
          <p className="about-bio">
            Available for fashion editorials, brand campaigns, portrait sessions,
            and creative collaborations across Mumbai and India.
          </p>
          <div className="contact-info">
            <div className="contact-info-item">
              <p><strong>Location</strong></p>
              <p>India</p>
            </div>
            <div className="contact-info-item">
              <p><strong>Status</strong></p>
              <p>Available for Freelance</p>
            </div>
            <div className="contact-info-item">
              <p><strong>Portfolio</strong></p>
              <p>behance.net/shamikdeshmukh</p>
            </div>
          </div>
        </div>

        <form className="contact-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="contact-name"><strong>Your Name</strong></label>
            <input
              id="contact-name"
              name="name"
              type="text"
              placeholder="Full name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="contact-email"><strong>Email Address</strong></label>
            <input
              id="contact-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="contact-project"><strong>Project Type</strong></label>
            <select
              id="contact-project"
              name="projectType"
              value={form.projectType}
              onChange={handleChange}
            >
              <option value="" disabled>Select a service</option>
              <option>Fashion &amp; Editorial</option>
              <option>Portrait &amp; Lifestyle</option>
              <option>Lookbook / Campaign</option>
              <option>Brand Collaboration</option>
              <option>Other</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="contact-message"><strong>Message</strong></label>
            <textarea
              id="contact-message"
              name="message"
              placeholder="Tell me about your project…"
              value={form.message}
              onChange={handleChange}
              required
            />
          </div>

          {status === 'success' && (
            <p className="form-feedback form-success">
              ✓ Message sent! I&apos;ll get back to you soon.
            </p>
          )}
          {status === 'error' && (
            <p className="form-feedback form-error">
              ✗ {errorMsg}
            </p>
          )}

          <button
            className="btn-send"
            type="submit"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Sending…' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
}
