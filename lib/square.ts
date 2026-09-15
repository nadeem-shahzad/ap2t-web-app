import { SquareClient, SquareEnvironment } from 'square';
import { GetSquare } from './square-creds';

export async function getSquareClient() {
  const { apiKey, mode } = await GetSquare();

  const client = new SquareClient({
    token: apiKey!,
    environment: mode ? SquareEnvironment.Sandbox : SquareEnvironment.Production,
  });

  return client;
}
