import Image from 'next/image';

const col1 = [
  { src: 'https://mir-s3-cdn-cf.behance.net/projects/404/4e31cc231151773.Y3JvcCw1NDY0LDQyNzMsMCwxMjcx.jpg', alt: 'Soft Chaos', num: '01' },
  { src: 'https://mir-s3-cdn-cf.behance.net/projects/404/65f704233237213.Y3JvcCw0OTg5LDM5MDIsMCwxMTcz.jpg', alt: 'Element', num: '05' },
  { src: 'https://mir-s3-cdn-cf.behance.net/projects/404/5590b3229400671.Y3JvcCwyNjI0LDIwNTIsMCw2MTA.jpg', alt: 'Golden Hours', num: '09' },
  { src: 'https://mir-s3-cdn-cf.behance.net/projects/404/dfc65e224978065.Y3JvcCw2ODE5LDUzMzQsNzQyLDA.jpg', alt: 'Solitude', num: '12' },
];

const col2 = [
  { src: 'https://mir-s3-cdn-cf.behance.net/projects/404/1e6dbc243644673.Y3JvcCw4NjYwLDY3NzMsMCwyMDM2.jpg', alt: 'Back to the Future', num: '04' },
  { src: 'https://mir-s3-cdn-cf.behance.net/projects/404/447e62230033373.Y3JvcCw1MjAzLDQwNjksMCw1MQ.jpg', alt: 'Glams', num: '08' },
];

const col3 = [
  { src: 'https://mir-s3-cdn-cf.behance.net/projects/404/a62b84243658963.Y3JvcCw1NzMxLDQ0ODIsMCwxMjYy.jpg', alt: 'Morning on the Face', num: '03' },
  { src: 'https://mir-s3-cdn-cf.behance.net/projects/404/7bfe64243643075.Y3JvcCw2MjM5LDQ4ODAsMCw5MTE.jpg', alt: 'Soft Glam', num: '07' },
  { src: 'https://mir-s3-cdn-cf.behance.net/projects/404/fd989d225238561.Y3JvcCw2Njc4LDUyMjMsMCw2Ng.jpg', alt: 'New Obsession', num: '11' },
];

const col4 = [
  { src: 'https://mir-s3-cdn-cf.behance.net/projects/404/d3d391243659489.Y3JvcCwxMjAwLDkzOCwwLDE0Mg.jpg', alt: 'In the Moment', num: '02' },
  { src: 'https://mir-s3-cdn-cf.behance.net/projects/404/fc57c1225762401.Y3JvcCw2Mjc5LDQ5MTIsNTQ0LDA.jpg', alt: 'Reverie', num: '10' },
];

function PhotoItem({ src, alt, num }) {
  return (
    <div className="photo-item">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" />
      <span className="photo-number">{num}</span>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="photo-grid">
      <div className="grid-col col1">
        {col1.map((p) => <PhotoItem key={p.num} {...p} />)}
      </div>
      <div className="grid-col col2">
        {col2.map((p) => <PhotoItem key={p.num} {...p} />)}
      </div>
      <div className="grid-col col3">
        {col3.map((p) => <PhotoItem key={p.num} {...p} />)}
      </div>
      <div className="grid-col col4">
        {col4.map((p) => <PhotoItem key={p.num} {...p} />)}
      </div>
    </div>
  );
}
