import Link from 'next/link';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <h1>Welcome to ShortLink Service</h1>
      <p>Create and manage your own short links!</p>
      <Link href="/pages/login">
          <button>Login</button>
      </Link>
    </div>
  );
};

export default LandingPage;
