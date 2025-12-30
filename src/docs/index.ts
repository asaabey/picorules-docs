import overview from './overview.md?raw';
import language from './language.md?raw';
import ruleblocks from './ruleblocks.md?raw';
import templatesAndDevelopment from './templates-and-development.md?raw';

export interface DocPage {
  id: string;
  title: string;
  description: string;
  content: string;
}

export const docs: DocPage[] = [
  {
    id: 'overview',
    title: 'Picorules Overview',
    description: 'High-level motivation, repository layout, and core architecture concepts.',
    content: overview,
  },
  {
    id: 'language',
    title: 'Language & Syntax',
    description: 'Statement types, directives, and idiomatic Picorules patterns.',
    content: language,
  },
  {
    id: 'ruleblocks',
    title: 'Working with Ruleblocks',
    description: 'Naming conventions, update workflows, and citation usage.',
    content: ruleblocks,
  },
  {
    id: 'templates',
    title: 'Templates & Development Notes',
    description: 'Template pack structure plus operational guardrails for rollouts.',
    content: templatesAndDevelopment,
  },
];
