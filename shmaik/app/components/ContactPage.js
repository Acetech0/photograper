export default function ContactPage() {
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

        <div className="contact-form">
          <div className="form-group">
            <label><strong>Your Name</strong></label>
            <input type="text" placeholder="Full name" />
          </div>
          <div className="form-group">
            <label><strong>Email Address</strong></label>
            <input type="email" placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label><strong>Project Type</strong></label>
            <select defaultValue="">
              <option value="" disabled>Select a service</option>
              <option>Fashion &amp; Editorial</option>
              <option>Portrait &amp; Lifestyle</option>
              <option>Lookbook / Campaign</option>
              <option>Brand Collaboration</option>
              <option>Other</option>
            </select>
          </div>
          <div className="form-group">
            <label><strong>Message</strong></label>
            <textarea placeholder="Tell me about your project…" />
          </div>
          <button className="btn-send" type="button">Send Message</button>
        </div>
      </div>
    </div>
  );
}
