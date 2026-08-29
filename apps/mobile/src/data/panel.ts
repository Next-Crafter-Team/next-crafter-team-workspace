import type { GraveState } from './graves';

export type MyIdea = {
  id: string;
  title: string;
  repo: string;
  state: GraveState;
  stateLabel: string;
  visibility: 'private' | 'public';
  activity: string;
};

export const MY_IDEAS: MyIdea[] = [
  {
    id: 'notion-clone-research',
    title: 'Clon de Notion para research',
    repo: 'tu-usuario/notion-clone-research',
    state: 'buried',
    stateLabel: 'Enterrada',
    visibility: 'public',
    activity: 'Autopsia editada hace 3 días',
  },
  {
    id: 'habit-coach-ai',
    title: 'Coach de hábitos con IA',
    repo: 'tu-usuario/habit-coach-ai',
    state: 'reminder',
    stateLabel: 'Recordatorio 2/3',
    visibility: 'private',
    activity: 'Próximo aviso en 12 días',
  },
  {
    id: 'score-together',
    title: 'Editor colaborativo de partituras',
    repo: 'tu-usuario/score-together',
    state: 'latent',
    stateLabel: 'Latente',
    visibility: 'private',
    activity: 'Importada hace 1 semana',
  },
  {
    id: 'envctl',
    title: 'CLI para entornos de ML',
    repo: 'tu-usuario/envctl',
    state: 'buried',
    stateLabel: 'Enterrada',
    visibility: 'public',
    activity: 'Sin cambios hace 2 meses',
  },
  {
    id: 'digest-forge',
    title: 'Newsletters técnicas auto-resumidas',
    repo: 'tu-usuario/digest-forge',
    state: 'revived',
    stateLabel: 'Revivida',
    visibility: 'public',
    activity: 'Resucitada por @mfontana hace 5 días',
  },
  {
    id: 'mobility-daily',
    title: 'App de rutinas de movilidad',
    repo: 'tu-usuario/mobility-daily',
    state: 'reminder',
    stateLabel: 'Recordatorio 3/3',
    visibility: 'private',
    activity: 'Última alerta — hoy',
  },
];

export type Reminder = {
  id: string;
  repo: string;
  idea: string;
  detail: string;
  step: 1 | 2 | 3;
};

export const REMINDERS: Reminder[] = [
  {
    id: 'habit-coach-ai',
    repo: 'tu-usuario/habit-coach-ai',
    idea: 'Coach de hábitos con IA',
    detail: 'Sin commits hace 5 meses · pospuesto 1 vez',
    step: 2,
  },
  {
    id: 'mobility-daily',
    repo: 'tu-usuario/mobility-daily',
    idea: 'App de rutinas de movilidad',
    detail: 'Sin commits hace 7 meses · pospuesto 2 veces',
    step: 3,
  },
  {
    id: 'side-crm',
    repo: 'tu-usuario/side-crm',
    idea: 'CRM mínimo para freelancers',
    detail: 'Sin commits hace 6 semanas · primer aviso hoy',
    step: 1,
  },
];

export type SavedIdea = {
  id: string;
  title: string;
  repo: string;
  stack: string;
  meta: string;
};

export const SAVED_IDEAS: SavedIdea[] = [
  {
    id: 'whiteboard-ml',
    title: 'Pizarra infinita para diagramas ML',
    repo: 'tanaka/whiteboard-ml',
    stack: 'Rust',
    meta: 'Guardada hace 2 días · 34 reacciones',
  },
  {
    id: 'rss-revival',
    title: 'Lector de RSS social',
    repo: 'lgarcia/rss-revival',
    stack: 'TypeScript',
    meta: 'Guardada hace 5 días · 12 reacciones',
  },
  {
    id: 'tiny-erp',
    title: 'ERP mínimo para talleres',
    repo: 'pmoreau/tiny-erp',
    stack: 'Ruby',
    meta: 'Guardada hace 1 semana · 21 reacciones',
  },
];

export type LineageItem = {
  id: string;
  title: string;
  repo: string;
  what: string;
  who: string;
  when: string;
  glow?: boolean;
};

export const LINEAGE: LineageItem[] = [
  {
    id: 'digest-forge',
    title: 'Newsletters técnicas auto-resumidas',
    repo: 'tu-usuario/digest-forge',
    what: 'Retomó el motor de resúmenes y cambió el modelo de precios a per-seat. Publicó su primera versión.',
    who: 'Resucitada por @mfontana',
    when: 'Hace 5 días · a partir de tu autopsia y 3 artefactos',
    glow: true,
  },
  {
    id: 'notion-clone-research',
    title: 'Clon de Notion para research',
    repo: 'tu-usuario/notion-clone-research',
    what: 'Un reclamo activo y una solicitud pendiente. Todavía nadie publicó una resurrección.',
    who: 'Reclamada por @kessler',
    when: 'Hace 3 semanas · a la espera de la primera publicación',
  },
  {
    id: 'old-scraper',
    title: 'Scraper de precios legacy',
    repo: 'tu-usuario/old-scraper',
    what: 'Resucitada, mantenida 3 meses y vuelta a enterrar con una segunda autopsia encadenada a la tuya.',
    who: 'Resucitada por @dev_ali, luego enterrada de nuevo',
    when: 'Hace 4 meses → re-enterrada hace 1 mes',
  },
];
