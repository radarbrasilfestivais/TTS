import { ProjectDraft } from '../types/tts';

const DRAFTS_KEY = 'vozcraft_studio_drafts_v1';
const ACTIVE_DRAFT_ID_KEY = 'vozcraft_active_draft_id_v1';

export const SAMPLE_PROJECTS: ProjectDraft[] = [
  {
    id: 'sample-suspense',
    title: 'Audiolivro: O Mistério da Mansão',
    content: `A noite caía pesada sobre os campos enevoados da colina.

[dramatico]Nenhum som ousava quebrar a quietude sinistra daquela madrugada.[/dramatico]

[pausa: 1.5s]

Ela aproximou-se devagar do portão de ferro enferrujado e olhou para trás.

[sussurro]Você ouviu isso? Tem alguém nos observando entre as sombras...[/sussurro]

[pausa: 2.0s]

[forte]Não dê mais nenhum passo! Afaste-se agora mesmo da entrada![/forte]

[enfase]A chave dourada escondida no sótão era a única salvação de todos nós.[/enfase]`,
    voiceId: 'Charon',
    engineMode: 'neural',
    globalSpeed: 1.0,
    globalPitch: 1.0,
    globalVolume: 1.0,
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
    wordCount: 78,
    charCount: 485,
  },
  {
    id: 'sample-comercial',
    title: 'Comercial: Lançamento de Alta Performance',
    content: `[alegre]Prepare-se para transformar a sua rotina com o dispositivo mais potente do mercado![/alegre]

[forte]Chegou a nova tecnologia que redefine todos os limites de velocidade e autonomia.[/forte]

[pausa: 1.0s]

[enfase]Mais de dez mil criadores de conteúdo já estão acelerando suas produções.[/enfase]

[sussurro]E o melhor segredo de todos:[/sussurro] você tem acesso exclusivo com garantia total nas primeiras vinte e quatro horas!

[rapido]Acesse agora mesmo o link oficial e garanta a sua unidade antes que esgote o lote de estreia![/rapido]`,
    voiceId: 'Puck',
    engineMode: 'neural',
    globalSpeed: 1.05,
    globalPitch: 1.0,
    globalVolume: 1.0,
    createdAt: Date.now() - 7200000,
    updatedAt: Date.now() - 7200000,
    wordCount: 82,
    charCount: 520,
  },
  {
    id: 'sample-meditacao',
    title: 'Meditação: Respiro & Serenidade',
    content: `[calmo]Feche suavemente os seus olhos e sinta o ar entrando puro pelos seus pulmões.[/calmo]

[pausa: 2.5s]

[sussurro]Solte os ombros. Deixe que todo o peso do dia se dissipe no silêncio deste instante.[/sussurro]

[pausa: 3.0s]

[calmo]Cada respiração traz clareza, serenidade e uma profunda sensação de paz interior.[/calmo]

[pausa: 2.0s]

Você está no controle do seu ritmo e do seu bem-estar.`,
    voiceId: 'Kore',
    engineMode: 'neural',
    globalSpeed: 0.85,
    globalPitch: 0.95,
    globalVolume: 0.8,
    createdAt: Date.now() - 10800000,
    updatedAt: Date.now() - 10800000,
    wordCount: 61,
    charCount: 375,
  },
];

export function getSavedProjects(): ProjectDraft[] {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    if (!raw) {
      // Seed with sample projects on first visit
      saveProjects(SAMPLE_PROJECTS);
      return SAMPLE_PROJECTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SAMPLE_PROJECTS;
  } catch (e) {
    console.error('Falha ao carregar rascunhos do armazenamento local:', e);
    return SAMPLE_PROJECTS;
  }
}

export function saveProjects(projects: ProjectDraft[]): void {
  try {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('Falha ao salvar projetos no armazenamento local:', e);
  }
}

export function saveSingleProject(project: ProjectDraft): void {
  const existing = getSavedProjects();
  const index = existing.findIndex((p) => p.id === project.id);
  if (index >= 0) {
    existing[index] = { ...project, updatedAt: Date.now() };
  } else {
    existing.unshift({ ...project, createdAt: Date.now(), updatedAt: Date.now() });
  }
  saveProjects(existing);
}

export function deleteProject(id: string): ProjectDraft[] {
  const existing = getSavedProjects().filter((p) => p.id !== id);
  saveProjects(existing);
  return existing;
}

export function getActiveProjectId(): string {
  return localStorage.getItem(ACTIVE_DRAFT_ID_KEY) || SAMPLE_PROJECTS[0].id;
}

export function setActiveProjectId(id: string): void {
  localStorage.setItem(ACTIVE_DRAFT_ID_KEY, id);
}
