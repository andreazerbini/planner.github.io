export const initialModel = {
  tabs: [
    {
      id: 'roles',
      title: 'Ruoli',
      description: 'Identità e responsabilità chiave',
      items: [
        {
          id: 'role-1',
          name: 'Leader di team',
          owner: 'Francesca',
          priority: 'Alta',
          notes: 'Allineare il team sul piano trimestrale'
        },
        {
          id: 'role-2',
          name: 'Mentore',
          owner: 'Francesca',
          priority: 'Media',
          notes: 'Seguire i nuovi membri del team'
        }
      ]
    },
    {
      id: 'long-term-goals',
      title: 'Obiettivi LT',
      description: 'Visione a lungo termine',
      items: [
        {
          id: 'lt-1',
          name: 'Lanciare la nuova piattaforma',
          owner: 'Team Prodotto',
          priority: 'Alta',
          notes: 'Versione beta entro Q3'
        },
        {
          id: 'lt-2',
          name: 'Incrementare NPS',
          owner: 'Team Esperienza',
          priority: 'Media',
          notes: 'Obiettivo +10 punti'
        }
      ]
    },
    {
      id: 'big-rocks',
      title: 'Big Things',
      description: 'Iniziative chiave trimestrali',
      items: [
        {
          id: 'bt-1',
          name: 'Ricerca utenti',
          owner: 'Ricerca',
          priority: 'Alta',
          notes: 'Interviste con 15 clienti'
        },
        {
          id: 'bt-2',
          name: 'Onboarding automatizzato',
          owner: 'CX',
          priority: 'Alta',
          notes: 'Ridurre time-to-value a 5 minuti'
        }
      ]
    },
    {
      id: 'tasks',
      title: 'Attività',
      description: 'Azioni concrete per avanzare',
      items: [
        {
          id: 'task-1',
          name: 'Scrivere job stories',
          owner: 'Product Manager',
          priority: 'Alta',
          notes: 'Focus su utenti power'
        },
        {
          id: 'task-2',
          name: 'Aggiornare dashboard KPI',
          owner: 'Data Analyst',
          priority: 'Media',
          notes: 'Allineamento con Big Things'
        }
      ]
    }
  ]
};
