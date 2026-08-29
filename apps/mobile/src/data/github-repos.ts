/**
 * Mock de los repos de GitHub conectados por el usuario (vía GitHub App).
 * Se usa en "Crear una idea" → "Vincular un repo". Reemplazar por
 * `github.listRepositories` de Convex cuando exista el backend.
 */

export type ConnectedRepo = {
  id: string;
  fullName: string;
  desc: string;
  lastActivity: string;
  private: boolean;
};

export const GITHUB_CONNECTION = {
  login: 'github.com/tu-usuario',
  status: 'Conectado vía Clerk',
};

export const CONNECTED_REPOS: ConnectedRepo[] = [
  {
    id: 'habit-coach-ai',
    fullName: 'tu-usuario/habit-coach-ai',
    desc: 'Coach de hábitos con IA.',
    lastActivity: 'Sin commits hace 5 meses',
    private: true,
  },
  {
    id: 'notion-clone-research',
    fullName: 'tu-usuario/notion-clone-research',
    desc: 'Clon de Notion para research.',
    lastActivity: 'Sin commits hace 4 meses',
    private: true,
  },
  {
    id: 'digest-forge',
    fullName: 'tu-usuario/digest-forge',
    desc: 'Newsletters técnicas auto-resumidas.',
    lastActivity: 'Sin commits hace 8 meses',
    private: false,
  },
  {
    id: 'side-crm',
    fullName: 'tu-usuario/side-crm',
    desc: 'CRM mínimo para freelancers.',
    lastActivity: 'Sin commits hace 6 semanas',
    private: true,
  },
  {
    id: 'old-scraper',
    fullName: 'tu-usuario/old-scraper',
    desc: 'Scraper de precios legacy.',
    lastActivity: 'Sin commits hace 1 año',
    private: false,
  },
];
