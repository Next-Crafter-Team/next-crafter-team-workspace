import type { GraveState } from './graves';

/** Recordatorio del cron sobre una idea inactiva. Se gestiona por idea. */
export type ReminderInfo = {
  step: 1 | 2 | 3;
  /** "Sin actividad hace 5 meses" */
  inactiveLabel: string;
  /** "Te avisamos una vez" / "Te preguntamos dos veces" */
  timesAskedLabel: string;
  /** cada cuánto se reprograma si el usuario elige "sigo con esto" */
  keepEveryLabel: string;
};

export type MyIdea = {
  id: string;
  title: string;
  /** origen: repo (github/manual) u otra fuente. Vacío si es una idea suelta. */
  source?: string;
  state: GraveState;
  stateLabel: string;
  visibility: 'private' | 'public';
  activity: string;
  /** presente sólo cuando hay un recordatorio activo (state === 'reminder') */
  reminder?: ReminderInfo;
};

export const MY_IDEAS: MyIdea[] = [
  {
    id: 'notion-clone-research',
    title: 'Clon de Notion para research',
    source: 'tu-usuario/notion-clone-research',
    state: 'buried',
    stateLabel: 'Enterrada',
    visibility: 'public',
    activity: 'Autopsia editada hace 3 días',
  },
  {
    id: 'habit-coach-ai',
    title: 'Coach de hábitos con IA',
    source: 'tu-usuario/habit-coach-ai',
    state: 'reminder',
    stateLabel: 'Recordatorio 2/3',
    visibility: 'private',
    activity: 'Próximo aviso en 12 días',
    reminder: {
      step: 2,
      inactiveLabel: 'Sin actividad hace 5 meses',
      timesAskedLabel: 'Te avisamos una vez y no hubo movimiento',
      keepEveryLabel: '3 meses',
    },
  },
  {
    id: 'score-together',
    title: 'Editor colaborativo de partituras',
    source: 'tu-usuario/score-together',
    state: 'latent',
    stateLabel: 'Latente',
    visibility: 'private',
    activity: 'Importada hace 1 semana',
  },
  {
    id: 'lasagna-supper-club',
    title: 'Club de cenas temáticas de barrio',
    state: 'latent',
    stateLabel: 'Latente',
    visibility: 'private',
    activity: 'Idea manual · creada hace 4 días',
  },
  {
    id: 'envctl',
    title: 'CLI para entornos de ML',
    source: 'tu-usuario/envctl',
    state: 'buried',
    stateLabel: 'Enterrada',
    visibility: 'public',
    activity: 'Sin cambios hace 2 meses',
  },
  {
    id: 'digest-forge',
    title: 'Newsletters técnicas auto-resumidas',
    source: 'tu-usuario/digest-forge',
    state: 'revived',
    stateLabel: 'Revivida',
    visibility: 'public',
    activity: 'Resucitada por @mfontana hace 5 días',
  },
  {
    id: 'side-crm',
    title: 'CRM mínimo para freelancers',
    source: 'tu-usuario/side-crm',
    state: 'reminder',
    stateLabel: 'Recordatorio 1/3',
    visibility: 'private',
    activity: 'Primer aviso hoy',
    reminder: {
      step: 1,
      inactiveLabel: 'Sin commits hace 6 semanas',
      timesAskedLabel: 'Es el primer aviso',
      keepEveryLabel: '2 meses',
    },
  },
  {
    id: 'mobility-daily',
    title: 'App de rutinas de movilidad',
    source: 'tu-usuario/mobility-daily',
    state: 'reminder',
    stateLabel: 'Recordatorio 3/3',
    visibility: 'private',
    activity: 'Última alerta — hoy',
    reminder: {
      step: 3,
      inactiveLabel: 'No tocás este repo privado hace 7 meses',
      timesAskedLabel: 'Te preguntamos dos veces y no hubo actividad',
      keepEveryLabel: '3 meses',
    },
  },
];

export function findMyIdea(id: string | undefined): MyIdea | undefined {
  return MY_IDEAS.find((i) => i.id === id);
}

export type SavedIdea = {
  id: string;
  title: string;
  source: string;
  origin: 'GitHub' | 'Manual';
  meta: string;
};

export const SAVED_IDEAS: SavedIdea[] = [
  {
    id: 'whiteboard-ml',
    title: 'Pizarra infinita para diagramas',
    source: 'tanaka/whiteboard-ml',
    origin: 'GitHub',
    meta: 'Guardada hace 2 días · 34 reacciones',
  },
  {
    id: 'rss-revival',
    title: 'Lector de RSS social',
    source: 'lgarcia/rss-revival',
    origin: 'GitHub',
    meta: 'Guardada hace 5 días · 12 reacciones',
  },
  {
    id: 'tiny-erp',
    title: 'Feria de intercambio de barrio',
    source: 'Idea manual de @pmoreau',
    origin: 'Manual',
    meta: 'Guardada hace 1 semana · 21 reacciones',
  },
];

export type LineageItem = {
  id: string;
  title: string;
  source: string;
  what: string;
  who: string;
  when: string;
  glow?: boolean;
};

/** "Contribuciones externas": ideas que enterraste y otras personas retomaron. */
export const LINEAGE: LineageItem[] = [
  {
    id: 'digest-forge',
    title: 'Newsletters técnicas auto-resumidas',
    source: 'tu-usuario/digest-forge',
    what: 'Retomó el motor de resúmenes y cambió el modelo de precios a per-seat. Publicó su primera versión.',
    who: 'Continuada por @mfontana',
    when: 'Hace 5 días · a partir de tu autopsia y 3 artefactos',
    glow: true,
  },
  {
    id: 'notion-clone-research',
    title: 'Clon de Notion para research',
    source: 'tu-usuario/notion-clone-research',
    what: 'Un reclamo activo y una solicitud pendiente. Todavía nadie publicó una continuación.',
    who: 'Reclamada por @kessler',
    when: 'Hace 3 semanas · a la espera de la primera publicación',
  },
  {
    id: 'old-scraper',
    title: 'Scraper de precios legacy',
    source: 'tu-usuario/old-scraper',
    what: 'Resucitada, mantenida 3 meses y vuelta a enterrar con una segunda autopsia encadenada a la tuya.',
    who: 'Continuada por @dev_ali, luego enterrada de nuevo',
    when: 'Hace 4 meses → re-enterrada hace 1 mes',
  },
];
