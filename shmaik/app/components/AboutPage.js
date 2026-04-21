export default function AboutPage() {
  return (
    <div className="about-page">
      <div className="about-layout">
        <div className="about-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://mir-s3-cdn-cf.behance.net/projects/404/fc57c1225762401.Y3JvcCw2Mjc5LDQ5MTIsNTQ0LDA.jpg"
            alt="Shamik Deshmukh"
          />
        </div>
        <div className="about-text">
          <p className="about-label">About Me</p>
          <hr className="about-divider" />
          <div className="about-name-block">
            <p>Shamik Deshmukh</p>
            <p>Fashion and Commercial Photography</p>
            <p>Based in Mumbai, India</p>
          </div>
          <hr className="about-divider2" />
          <p className="about-bio">
            Shamik Deshmukh is a Mumbai-based fashion and commercial photographer with a distinct eye
            for mood, light, and the quiet drama within the human form. His work moves
            between soft editorial glamour and raw, intimate portraiture — always deeply
            personal, always intentional.
            <br /><br />
            Since 2022, he has built a growing body of work spanning editorial shoots,
            portrait series, and creative collaborations. With a sensitivity to atmosphere
            and a precise visual language, Shamik creates images that linger.
            <br /><br />
            Currently available for freelance commissions — brands, editorials, lookbooks,
            and creative collaborations are welcome.
          </p>
        </div>
      </div>
    </div>
  );
}
