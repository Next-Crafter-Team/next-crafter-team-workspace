export type GraveState = 'buried' | 'latent' | 'reminder' | 'revived';

export type Grave = {
  id: string;
  title: string;
  repo: string;
  stack: string;
  buried: string;
  why: string;
  learned: string;
  reactions: number;
  state: GraveState;
};

export const GRAVES: Grave[] = [
  {
    id: 'notion-clone-research',
    title: 'Clon de Notion para equipos de research',
    repo: 'tu-usuario/notion-clone-research',
    stack: 'Python',
    buried: 'Hace 4 meses',
    why: 'A las tres semanas de arrancar, Notion lanzó Notion AI con casi lo mismo que planeábamos como diferenciador. El equipo perdió la convicción antes de tener un MVP usable — no fue técnico, fue dejar de creer que valía la pena.',
    learned: 'Validar la diferenciación real antes de la primera línea de código, no después.',
    reactions: 41,
    state: 'buried',
  },
  {
    id: 'habit-coach-ai',
    title: 'Coach de hábitos con IA',
    repo: 'tu-usuario/habit-coach-ai',
    stack: 'TypeScript',
    buried: 'Hace 5 meses',
    why: 'El onboarding tenía nueve pantallas. Nadie del piloto llegó al día 3. Reescribirlo se sentía más pesado que empezar de cero, así que no hice ninguna de las dos cosas.',
    learned: 'Si el onboarding necesita un tutorial, el producto todavía no está.',
    reactions: 23,
    state: 'buried',
  },
  {
    id: 'digest-forge',
    title: 'Motor de newsletters técnicas auto-resumidas',
    repo: 'tu-usuario/digest-forge',
    stack: 'Go',
    buried: 'Hace 8 meses',
    why: 'Funcionaba bien, pero cada envío costaba 0,40 USD en tokens y no encontré forma de cobrarlo sin espantar a los primeros lectores. La unidad económica nunca cerró.',
    learned: 'Calcular el costo por unidad servida antes de enamorarme del demo.',
    reactions: 12,
    state: 'buried',
  },
  {
    id: 'score-together',
    title: 'Editor colaborativo de partituras',
    repo: 'tu-usuario/score-together',
    stack: 'Rust',
    buried: 'Hace 11 meses',
    why: 'La sincronización CRDT de notación musical era un doctorado entero disfrazado de feature. Subestimé el problema por un factor de diez y me quedé sin energía en el intento.',
    learned: 'Cuando la parte "difícil pero acotada" tiene papers activos, no está acotada.',
    reactions: 34,
    state: 'buried',
  },
  {
    id: 'figma-parts',
    title: 'Marketplace de componentes de Figma',
    repo: 'tu-usuario/figma-parts',
    stack: 'TypeScript',
    buried: 'Hace 6 meses',
    why: 'Figma cambió su API de plugins a mitad de camino. Rehacer la integración coincidió justo con quedarme sin ahorros y tener que volver a un trabajo full-time.',
    learned: 'Construir sobre la plataforma de otro es alquilar, no tener.',
    reactions: 8,
    state: 'buried',
  },
  {
    id: 'mobility-daily',
    title: 'App de rutinas de movilidad',
    repo: 'tu-usuario/mobility-daily',
    stack: 'Swift',
    buried: 'Hace 3 meses',
    why: 'Era mi tercer intento del mismo concepto en dos años. En algún momento entendí que me gustaba la idea de tenerla hecha, no el proceso de construirla.',
    learned: 'Distinguir "quiero que exista" de "quiero hacerlo yo".',
    reactions: 17,
    state: 'reminder',
  },
  {
    id: 'envctl',
    title: 'CLI para gestionar entornos de ML',
    repo: 'tu-usuario/envctl',
    stack: 'Python',
    buried: 'Hace 9 meses',
    why: 'Conda y uv mejoraron justo lo suficiente como para que mi herramienta dejara de tener sentido. Buenas noticias para mí como usuario, malas para mí como autor.',
    learned: 'Si tu producto es un parche a un dolor temporal, tenés fecha de vencimiento.',
    reactions: 15,
    state: 'buried',
  },
  {
    id: 'bean-notes',
    title: 'Red social de reseñas de cafés de especialidad',
    repo: 'tu-usuario/bean-notes',
    stack: 'Ruby',
    buried: 'Hace 14 meses',
    why: 'Dos personas la usábamos religiosamente: mi socio y yo. El mercado real vivía en Instagram y no queríamos admitir que no íbamos a moverlo de ahí.',
    learned: 'Que a vos te encante no es tracción; es una muestra de tamaño uno.',
    reactions: 29,
    state: 'buried',
  },
];

export const STATE_LABEL: Record<GraveState, string> = {
  buried: 'Enterrada · pública',
  latent: 'Latente',
  reminder: 'Recordatorio',
  revived: 'Revivida',
};
