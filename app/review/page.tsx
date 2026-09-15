import ReviewForm from './page.client';

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return <ReviewForm token="" isValid={false} error="Invalid token" />;
  }

  let isValid = false;
  let error = '';

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/testimonials/validate-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
      cache: 'no-store',
    });

    const data = await res.json();

    if (res.ok && data.valid) {
      isValid = true;
    } else {
      error = data.error || data.message || 'Unable to validate the link. Please try again later.';
    }
  } catch (err) {
    error = 'Something went wrong while validating the link.';
  }

  return <ReviewForm token={token} isValid={isValid} error={error} />;
}
