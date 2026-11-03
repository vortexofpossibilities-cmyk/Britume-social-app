
import { supabase } from './supabase';

export async function askBritumeAI(message: string): Promise<string> {
  if (!supabase) {
    throw new Error('BRITUME is not connected to Supabase.');
  }

  const cleanMessage = message.trim();

  if (!cleanMessage) {
    throw new Error('Please enter a message.');
  }

  if (cleanMessage.length > 8000) {
    throw new Error('Your message is too long. Maximum is 8000 characters.');
  }

  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError || !sessionData.session) {
    throw new Error('Please sign in to BRITUME first.');
  }

  const session = sessionData.session;

  const { data, error } = await supabase.functions.invoke(
    'rapid-function',
    {
      body: {
        message: cleanMessage,
        user_id: session.user.id,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    }
  );

  if (error) {
    throw new Error(error.message || 'Could not connect to BRITUME AI.');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (typeof data?.reply !== 'string' || !data.reply.trim()) {
    throw new Error('BRITUME AI returned an invalid response.');
  }

  return data.reply.trim();
}
