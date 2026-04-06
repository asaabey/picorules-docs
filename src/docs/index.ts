import introduction from './01-introduction.md?raw';
import tutorial from './02-tutorial.md?raw';
import languageReference from './03-language-reference.md?raw';
import eadvModel from './04-eadv-model.md?raw';
import functionsReference from './05-functions-reference.md?raw';
import jinja2Templating from './06-jinja2-templating.md?raw';
import examples from './07-examples.md?raw';
import developers from './08-developers.md?raw';
import ecosystem from './09-ecosystem.md?raw';
import architecture from './10-architecture.md?raw';
import fhirIntegration from './11-fhir-integration.md?raw';
import openehrIntegration from './12-openehr-integration.md?raw';
import picorulesStudio from './13-picorules-studio.md?raw';

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
    id: 'architecture',
    title: 'Architecture',
    description: 'Transport-agnostic three-layer model, DataAdapter interface, and comparison with CDS standards',
    content: architecture,
  },
  {
    id: 'fhir-integration',
    title: 'FHIR R4 Integration',
    description: 'FHIR data adapter, smart fetch, CDS Hooks prefetch, SMART on FHIR apps',
    content: fhirIntegration,
  },
  {
    id: 'openehr-integration',
    title: 'openEHR Integration',
    description: 'AQL-based adapter for openEHR CDRs — EHRbase, Better Platform, DIPS',
    content: openehrIntegration,
  },
  {
    id: 'picorules-studio',
    title: 'Picorules Studio',
    description: 'Web IDE for rule authoring, SQL compilation, mock data, and execution',
    content: picorulesStudio,
  },
  {
    id: 'ecosystem',
    title: 'SDK & Ecosystem',
    description: 'npm packages, data adapters, tools, and source repositories',
    content: ecosystem,
  },
  {
    id: 'developers',
    title: 'Developers',
    description: 'Core team, contributing guidelines, and project history',
    content: developers,
  },
];
