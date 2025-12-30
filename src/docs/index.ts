import introduction from './01-introduction.md?raw';
import tutorial from './02-tutorial.md?raw';
import languageReference from './03-language-reference.md?raw';
import eadvModel from './04-eadv-model.md?raw';
import functionsReference from './05-functions-reference.md?raw';
import jinja2Templating from './06-jinja2-templating.md?raw';
import examples from './07-examples.md?raw';
import developers from './08-developers.md?raw';

export interface DocPage {
  id: string;
  title: string;
  description: string;
  content: string;
}

export const docs: DocPage[] = [
  {
    id: 'introduction',
    title: 'Introduction',
    description: 'What is Picorules and why it exists',
    content: introduction,
  },
  {
    id: 'tutorial',
    title: 'Tutorial',
    description: 'Step-by-step guide to writing your first ruleblocks',
    content: tutorial,
  },
  {
    id: 'language-reference',
    title: 'Language Reference',
    description: 'Complete syntax specification for functional and conditional statements',
    content: languageReference,
  },
  {
    id: 'eadv-model',
    title: 'EADV Model',
    description: 'Understanding the Entity-Attribute-Date-Value data structure',
    content: eadvModel,
  },
  {
    id: 'functions-reference',
    title: 'Functions Reference',
    description: 'Complete reference of all available functions and operators',
    content: functionsReference,
  },
  {
    id: 'jinja2-templating',
    title: 'Jinja2 Templating',
    description: 'Creating dashboard templates with Jinja2 syntax',
    content: jinja2Templating,
  },
  {
    id: 'examples',
    title: 'Examples & Cookbook',
    description: 'Real-world clinical patterns and complete ruleblock examples',
    content: examples,
  },
  {
    id: 'developers',
    title: 'Developers',
    description: 'Core team, contributing guidelines, and project architecture',
    content: developers,
  },
];
