#!/usr/bin/env node

/**
 * mdbase.dev static site builder
 *
 * Reads all spec .md files, converts to HTML, and injects them
 * into the page templates. Outputs to dist/.
 */

import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(__dirname, 'dist');
const TEMPLATES = join(__dirname, 'templates');
const STATIC = join(__dirname, 'static');

// ---------------------------------------------------------------------------
// Spec file ordering and metadata
// ---------------------------------------------------------------------------

const SPEC_FILES = [
  { file: '00-overview.md',               num: '00', title: 'Overview',             id: 'section-00' },
  { file: '01-concepts.md',               num: '01', title: 'Concepts',             id: 'section-01' },
  { file: '02-collection-layout.md',      num: '02', title: 'Collection Layout',    id: 'section-02' },
  { file: '03-records-and-frontmatter.md', num: '03', title: 'Records & Frontmatter', id: 'section-03' },
  { file: '04-configuration.md',          num: '04', title: 'Configuration',        id: 'section-04' },
  { file: '05-type-files.md',             num: '05', title: 'Type Files',           id: 'section-05' },
  { file: '06-json-schema-profile.md',    num: '06', title: 'JSON Schema Profile',  id: 'section-06' },
  { file: '07-collection-semantics.md',   num: '07', title: 'Collection Semantics', id: 'section-07' },
  { file: '08-links.md',                  num: '08', title: 'Links',                id: 'section-08' },
  { file: '09-lifecycle.md',              num: '09', title: 'Lifecycle',            id: 'section-09' },
  { file: '10-cel-profile.md',            num: '10', title: 'CEL Profile',          id: 'section-10' },
  { file: '11-querying.md',               num: '11', title: 'Querying',             id: 'section-11' },
  { file: '12-operations.md',             num: '12', title: 'Operations',           id: 'section-12' },
  { file: '13-runtime-contracts.md',      num: '13', title: 'Runtime Contracts',    id: 'section-13' },
  { file: '14-workflows.md',              num: '14', title: 'Workflows',            id: 'section-14' },
  { file: '15-migrations-and-compatibility.md', num: '15', title: 'Migrations & Compatibility', id: 'section-15' },
  { file: '16-conformance.md',            num: '16', title: 'Conformance',          id: 'section-16' },
];

const LEGACY_SPEC_FILES = [
  { file: 'v0.2/00-overview.md',               num: '00', title: 'Overview',             id: 'section-00' },
  { file: 'v0.2/01-terminology.md',            num: '01', title: 'Terminology',          id: 'section-01' },
  { file: 'v0.2/02-collection-layout.md',      num: '02', title: 'Collection Layout',    id: 'section-02' },
  { file: 'v0.2/03-frontmatter.md',            num: '03', title: 'Frontmatter',          id: 'section-03' },
  { file: 'v0.2/04-configuration.md',          num: '04', title: 'Configuration',        id: 'section-04' },
  { file: 'v0.2/05-types.md',                  num: '05', title: 'Types',                id: 'section-05' },
  { file: 'v0.2/06-matching.md',               num: '06', title: 'Matching',             id: 'section-06' },
  { file: 'v0.2/07-field-types.md',            num: '07', title: 'Field Types',          id: 'section-07' },
  { file: 'v0.2/08-links.md',                  num: '08', title: 'Links',                id: 'section-08' },
  { file: 'v0.2/09-validation.md',             num: '09', title: 'Validation',           id: 'section-09' },
  { file: 'v0.2/10-querying.md',               num: '10', title: 'Querying',             id: 'section-10' },
  { file: 'v0.2/11-expressions.md',            num: '11', title: 'Expressions',          id: 'section-11' },
  { file: 'v0.2/12-operations.md',             num: '12', title: 'Operations',           id: 'section-12' },
  { file: 'v0.2/13-caching.md',                num: '13', title: 'Caching',              id: 'section-13' },
  { file: 'v0.2/14-conformance.md',            num: '14', title: 'Conformance',          id: 'section-14' },
  { file: 'v0.2/15-watching.md',               num: '15', title: 'Watching',             id: 'section-15' },
  { file: 'v0.2/16-runtime-profile.md',        num: '16', title: 'Runtime Profile',      id: 'section-16' },
  { file: 'v0.2/appendix-a-examples.md',       num: 'A',  title: 'Examples',             id: 'appendix-a', group: 'Appendices' },
  { file: 'v0.2/appendix-b-expression-grammar.md', num: 'B', title: 'Expression Grammar', id: 'appendix-b', group: 'Appendices' },
  { file: 'v0.2/appendix-c-error-codes.md',    num: 'C',  title: 'Error Codes',          id: 'appendix-c', group: 'Appendices' },
  { file: 'v0.2/appendix-d-compatibility.md',  num: 'D',  title: 'Compatibility',        id: 'appendix-d', group: 'Appendices' },
];

// ---------------------------------------------------------------------------
// Markdown setup
// ---------------------------------------------------------------------------

// Custom renderer for anchor links on headings and to add data-lang to code blocks
const renderer = new marked.Renderer();

renderer.heading = function ({ text, depth }) {
  const raw = text.replace(/<[^>]+>/g, '');
  const slug = raw
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  const anchor = depth <= 3
    ? `<a class="anchor" href="#${slug}" aria-hidden="true">#</a>`
    : '';
  return `<h${depth} id="${slug}">${anchor}${text}</h${depth}>\n`;
};

renderer.code = function ({ text, lang }) {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const langAttr = lang ? ` data-lang="${lang}"` : '';
  return `<pre${langAttr}><code>${escaped}</code></pre>\n`;
};

// Rewrite relative .md links to in-page anchors
renderer.link = function ({ href, title, text }) {
  let resolvedHref = href;

  // Turn ./XX-foo.md into #section-XX
  const mdMatch = href.match(/^\.?\/?(\d{2})-[\w-]+\.md$/);
  if (mdMatch) {
    resolvedHref = `#section-${mdMatch[1]}`;
  }

  // Turn ./appendix-X-foo.md into #appendix-X
  const appMatch = href.match(/^\.?\/?appendix-([a-d])-[\w-]+\.md$/);
  if (appMatch) {
    resolvedHref = `#appendix-${appMatch[1]}`;
  }

  const titleAttr = title ? ` title="${title}"` : '';
  return `<a href="${resolvedHref}"${titleAttr}>${text}</a>`;
};

marked.setOptions({
  renderer,
  gfm: true,
  breaks: false,
});

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

function build() {
  console.log('Building mdbase.dev...\n');

  // Clean & create dist
  mkdirSync(DIST, { recursive: true });

  // Copy static assets
  cpSync(STATIC, DIST, { recursive: true });
  console.log('  Copied static assets');

  // Copy index.html
  const indexHtml = readFileSync(join(TEMPLATES, 'index.html'), 'utf-8');
  writeFileSync(join(DIST, 'index.html'), indexHtml);
  console.log('  Built index.html');

  // Copy ecosystem.html
  const ecosystemHtml = readFileSync(join(TEMPLATES, 'ecosystem.html'), 'utf-8');
  writeFileSync(join(DIST, 'ecosystem.html'), ecosystemHtml);
  console.log('  Built ecosystem.html');

  // Copy runtime.html
  const runtimeHtml = readFileSync(join(TEMPLATES, 'runtime.html'), 'utf-8');
  writeFileSync(join(DIST, 'runtime.html'), runtimeHtml);
  console.log('  Built runtime.html');

  // Build spec page
  buildSpec({
    entries: SPEC_FILES,
    output: 'spec.html',
    title: 'Specification',
    version: 'v0.3.0',
    switchLink: '<a href="spec-v0.2.html">v0.2 archive</a>',
  });
  buildSpec({
    entries: LEGACY_SPEC_FILES,
    output: 'spec-v0.2.html',
    title: 'Specification v0.2 archive',
    version: 'v0.2.1 archive',
    switchLink: '<a href="spec.html">Current v0.3</a>',
  });

  console.log('\nDone! Output in site/dist/');
}

function buildSpec({ entries, output: outputFile, title, version, switchLink }) {
  const specTemplate = readFileSync(join(TEMPLATES, 'spec.html'), 'utf-8');

  // Build sidebar links
  let sidebarHtml = '';
  let currentGroup = null;

  for (const entry of entries) {
    if (entry.group && entry.group !== currentGroup) {
      currentGroup = entry.group;
      sidebarHtml += `</div>\n<div class="sidebar-group">\n`;
      sidebarHtml += `  <div class="sidebar-group-label">${currentGroup}</div>\n`;
    }
    sidebarHtml += `  <a class="sidebar-link" href="#${entry.id}">`;
    sidebarHtml += `<span class="num">${entry.num}</span>${entry.title}</a>\n`;
  }

  // Build spec content sections
  let contentHtml = '';

  for (const entry of entries) {
    const filePath = join(ROOT, entry.file);
    if (!existsSync(filePath)) {
      throw new Error(`Required specification file is missing: ${entry.file}`);
    }

    const raw = readFileSync(filePath, 'utf-8');
    const md = raw.replace(/^---\n[\s\S]*?\n---\n/, '');
    const html = marked.parse(md);

    contentHtml += `<section class="spec-section" id="${entry.id}">\n`;
    contentHtml += html;
    contentHtml += `</section>\n\n`;

    console.log(`  Converted ${entry.file}`);
  }

  // Inject into template
  const rendered = specTemplate
    .replace('{{SPEC_TITLE}}', title)
    .replace('{{SPEC_VERSION}}', version)
    .replaceAll('{{SPEC_SWITCH_LINK}}', switchLink)
    .replace('{{SIDEBAR_LINKS}}', sidebarHtml)
    .replace('{{SPEC_CONTENT}}', contentHtml);

  writeFileSync(join(DIST, outputFile), rendered);
  console.log(`  Built ${outputFile}`);
}

build();
