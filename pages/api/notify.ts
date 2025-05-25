import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { event, data } = req.body;

  try {
    const response = await fetch('https://ad46bd1b-14a6-41e9-8e65-00bf6ff85598-00-18vqeaip43wr3.riker.replit.dev/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, data }),
    });

    if (!response.ok) {
      throw new Error('Erreur serveur python');
    }

    res.status(200).json({ message: 'Notifié avec succès' });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
}