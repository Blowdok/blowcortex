// Client Inngest partagé. En dev, le SDK détecte automatiquement le serveur
// local (http://localhost:8288) lorsque NODE_ENV=development.
//
// Note Sprint 1 : on n'enregistre pas encore de schéma typé d'événements ;
// ce sera fait au Sprint 2 quand les premiers événements applicatifs seront
// définis (`gmail.message.received`, `message.ingested`, etc.).

import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'blowcortex',
  eventKey: process.env['INNGEST_EVENT_KEY'],
});
