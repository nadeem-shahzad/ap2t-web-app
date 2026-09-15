import RetryButton from './retry-button';
export function ServerError({ error }: { error: any }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-gray-900 text-white">
      <h1 className="text-2xl font-bold mb-2">Oops! Something went wrong</h1>
      <p className="mb-4">
        {error?.message || 'There was an issue fetching the data from the server.'}
      </p>
      <RetryButton />
    </div>
  );
}
