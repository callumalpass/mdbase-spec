import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

const scenes = [
  {
    slug: 'collection',
    title: 'Collection',
    subtitle: 'folder as data surface',
    items: ['mdbase.yaml', '_types/task.md', 'notes/idea.md'],
    detail: ['rooted scan', 'typed files', 'plain markdown'],
  },
  {
    slug: 'types',
    title: 'Types',
    subtitle: 'schema files with prose',
    items: ['fields', 'defaults', 'strict mode'],
    detail: ['inherits rules', 'validates records', 'documents shape'],
  },
  {
    slug: 'query',
    title: 'Query',
    subtitle: 'filters over files',
    items: ['type == "task"', 'status == "open"', 'order: due'],
    detail: ['deterministic rows', 'body-aware filters', 'metadata envelope'],
  },
  {
    slug: 'links',
    title: 'Links',
    subtitle: 'resolved markdown references',
    items: ['[[alpha]]', '[Plan](b.md)', '../team.md'],
    detail: ['id lookup', 'filename fallback', 'format preserved'],
  },
  {
    slug: 'runtime',
    title: 'Runtime',
    subtitle: 'events, workflows, actions',
    items: ['file_modified', 'workflow step', 'record.patch'],
    detail: ['policy gate', 'idempotent write', 'effect log'],
  },
];

const identities = [
  {
    slug: '01-blueprint',
    name: 'Blueprint Systems',
    description: 'Deep blue technical drawings, grid paper, cyan construction lines, and precise implementation notes.',
    renderer: blueprint,
  },
  {
    slug: '02-risograph',
    name: 'Risograph Field Notes',
    description: 'Off-register print layers, halftone texture, warm paper, and high-contrast editorial captions.',
    renderer: risograph,
  },
  {
    slug: '03-archive-cards',
    name: 'Archive Cards',
    description: 'Typed index cards, labels, stamps, tabs, and red editorial marks from a specification filing cabinet.',
    renderer: archiveCards,
  },
  {
    slug: '04-signal-graph',
    name: 'Signal Graph',
    description: 'Clean light-table grids, glowing nodes, routed edges, and modern data-product geometry.',
    renderer: signalGraph,
  },
  {
    slug: '05-cut-paper',
    name: 'Cut Paper Model',
    description: 'Layered paper pieces, soft shadows, large shapes, and concise labels for a more tactile identity.',
    renderer: cutPaper,
  },
];

const esc = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

function text(x, y, value, cls = 'label', attrs = '') {
  return `<text x="${x}" y="${y}" class="${cls}" ${attrs}>${esc(value)}</text>`;
}

function lines(x, y, values, cls = 'small', gap = 34) {
  return values.map((value, index) => text(x, y + index * gap, value, cls)).join('\n');
}

function svg(title, desc, style, defs, body) {
  return `<svg width="1200" height="676" viewBox="0 0 1200 676" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc">
  <title id="title">${esc(title)}</title>
  <desc id="desc">${esc(desc)}</desc>
  <defs>
${defs}
  </defs>
  <style>
${style}
  </style>
${body}
</svg>
`;
}

function commonDefs(seed = 1) {
  return `    <filter id="paper" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="2" seed="${seed}"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="table" tableValues="0 0.06"/></feComponentTransfer>
    </filter>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="9" flood-color="#1e1919" flood-opacity="0.16"/>
    </filter>`;
}

function blueprintMotif(slug) {
  const motifs = {
    collection: `  <path d="M814 182H1068V288H976V382H814Z" fill="none" stroke="#6ee7ff" stroke-width="2.5" opacity="0.5"/>
  <path d="M840 214H930M840 250H1018M840 286H930M980 326H1044" class="thin" opacity="0.5"/>
  <path d="M792 178V404M776 178H810M776 404H810M816 438H1068" class="thin" opacity="0.55"/>
  <path d="M980 176L1066 176L1066 208" class="thin dash" opacity="0.5"/>
  ${text(838, 424, 'root boundary', 'tiny')}`,
    types: `  <path d="M772 188L1020 188L894 462Z" fill="none" stroke="#6ee7ff" stroke-width="2.5" opacity="0.52"/>
  <path d="M810 276H980M850 362H940M894 188V462" class="thin" opacity="0.52"/>
  <circle cx="894" cy="188" r="10" fill="#6ee7ff" opacity="0.55"/>
  <path d="M780 480H1008M780 508H932M780 536H968" class="thin" opacity="0.45"/>
  ${text(790, 456, 'inheritance cone', 'tiny')}`,
    query: `  <path d="M792 202L1038 286L792 370Z" fill="none" stroke="#6ee7ff" stroke-width="2.5" opacity="0.52"/>
  <path d="M826 224L826 348M880 242L880 330M934 260L934 312" class="thin" opacity="0.5"/>
  <path d="M1038 286H1084M1084 286L1062 268M1084 286L1062 304" class="line" opacity="0.48"/>
  <path d="M798 420C878 390 974 400 1068 452" class="thin dash" opacity="0.5"/>
  ${text(836, 452, 'result envelope', 'tiny')}`,
    links: `  <circle cx="854" cy="242" r="48" fill="none" stroke="#6ee7ff" stroke-width="2.5" opacity="0.5"/>
  <circle cx="1004" cy="292" r="58" fill="none" stroke="#6ee7ff" stroke-width="2.5" opacity="0.5"/>
  <circle cx="910" cy="408" r="54" fill="none" stroke="#6ee7ff" stroke-width="2.5" opacity="0.5"/>
  <path d="M894 258L954 276M886 284L920 370M962 346L940 384" class="thin dash" opacity="0.6"/>
  <path d="M794 486H1080M794 486C834 454 892 446 962 464C1012 476 1050 468 1080 438" class="thin" opacity="0.45"/>
  ${text(822, 526, 'preserve link shape', 'tiny')}`,
    runtime: `  <path d="M792 218H1060V430H792Z" fill="none" stroke="#6ee7ff" stroke-width="2.5" opacity="0.5"/>
  <path d="M826 256H900V332H826ZM948 256H1024V332H948ZM886 370H966V408H886Z" fill="none" stroke="#6ee7ff" stroke-width="2.5" opacity="0.52"/>
  <path d="M900 294H948M930 332V370" class="thin" opacity="0.6"/>
  <path d="M802 472H1072M802 506H1020M802 540H1052" class="thin" opacity="0.45"/>
  ${text(812, 454, 'effects ledger', 'tiny')}`,
  };
  return motifs[slug] ?? '';
}

function risographMotif(slug) {
  const motifs = {
    collection: `  <path d="M722 96C810 72 930 92 1018 154L960 262C868 220 764 214 672 250C650 184 666 118 722 96Z" class="yellow"/>
  <path d="M850 96H1046L1090 140V250H850Z" fill="none" class="ink" opacity="0.78"/>
  <path d="M850 140H1090M884 176H1028M884 212H1002" class="thin" opacity="0.82"/>
  <circle cx="826" cy="232" r="20" fill="#1e1919" opacity="0.86"/>
  <circle cx="826" cy="232" r="8" fill="#fff5dc" opacity="0.95"/>`,
    types: `  <path d="M112 432C260 388 430 400 576 466L532 596C374 530 222 526 86 580Z" class="green"/>
  <path d="M904 184H1080V384H904Z" fill="none" class="ink" opacity="0.72"/>
  <path d="M930 226H1050M930 274H1024M930 322H1050" class="thin" opacity="0.78"/>
  <path d="M866 212L904 238M866 298L904 298M866 356L904 334" class="ink" opacity="0.68"/>`,
    query: `  <path d="M132 454L590 118L654 214L196 550Z" class="cyan"/>
  <circle cx="982" cy="190" r="66" fill="none" class="ink" opacity="0.8"/>
  <path d="M1030 238L1108 316" class="ink" opacity="0.8"/>
  <path d="M940 190H1018M962 158H1002M962 222H1002" class="thin" opacity="0.82"/>`,
    links: `  <path d="M640 94C746 74 858 130 900 230C934 310 902 396 830 436C742 486 614 450 566 350C510 234 548 112 640 94Z" class="yellow"/>
  <path d="M194 522C322 424 462 422 596 510C736 604 872 562 1008 456" fill="none" class="ink" opacity="0.78"/>
  <circle cx="194" cy="522" r="20" fill="#1e1919" opacity="0.88"/>
  <circle cx="596" cy="510" r="20" fill="#1e1919" opacity="0.88"/>
  <circle cx="1008" cy="456" r="20" fill="#1e1919" opacity="0.88"/>`,
    runtime: `  <path d="M108 418C254 376 412 400 540 494L474 604C342 514 214 498 82 548Z" class="green"/>
  <path d="M164 552H1020" class="ink" opacity="0.74"/>
  <path d="M252 522L300 552L252 582M532 522L580 552L532 582M812 522L860 552L812 582" class="ink" opacity="0.74"/>
  <path d="M182 508C246 472 322 472 394 510M470 508C534 472 610 472 682 510M758 508C822 472 898 472 970 510" fill="none" class="thin" opacity="0.78"/>`,
  };
  return motifs[slug] ?? '';
}

function archiveMotif(slug) {
  const motifs = {
    collection: `  <path d="M884 86H1076V150H884Z" fill="#d2b182" opacity="0.45" stroke="#241c18" stroke-width="3"/>
  <path d="M904 118H1054" class="line" opacity="0.65"/>
  <path d="M996 184C1024 166 1064 166 1092 186C1064 204 1024 204 996 184Z" fill="none" stroke="#b83232" stroke-width="4" opacity="0.5"/>
  <path d="M1008 184H1080" class="red" opacity="0.5"/>`,
    types: `  <path d="M86 512C168 476 286 486 374 540" class="red" opacity="0.55"/>
  <circle cx="166" cy="498" r="12" fill="#b83232" opacity="0.85"/>
  <circle cx="328" cy="522" r="12" fill="#b83232" opacity="0.85"/>
  <path d="M892 100C936 78 1002 84 1044 118L1016 154C970 130 926 128 886 148Z" fill="#fffaf0" stroke="#241c18" stroke-width="3" opacity="0.75"/>
  <path d="M914 122H1016" class="line" opacity="0.45"/>`,
    query: `  <path d="M90 86H318V142H90Z" fill="#fffaf0" stroke="#241c18" stroke-width="3" opacity="0.75"/>
  <path d="M112 116H292" class="line" opacity="0.5"/>
  <circle cx="1006" cy="104" r="36" fill="none" stroke="#b83232" stroke-width="5" opacity="0.5"/>
  <path d="M1032 130L1084 182" class="red" opacity="0.5"/>`,
    links: `  <path d="M94 506C200 474 330 490 426 554" class="red" opacity="0.45"/>
  <path d="M862 96C920 72 998 84 1048 132" class="line" opacity="0.55"/>
  <path d="M902 96C930 132 982 132 1018 98" class="red" opacity="0.45"/>
  <circle cx="902" cy="96" r="9" fill="#b83232" opacity="0.8"/>
  <circle cx="1018" cy="98" r="9" fill="#b83232" opacity="0.8"/>`,
    runtime: `  <path d="M88 88H252V138H88ZM88 150H252V200H88" fill="#fffaf0" stroke="#241c18" stroke-width="3" opacity="0.7"/>
  <path d="M110 116H230M110 178H230" class="line" opacity="0.5"/>
  <path d="M934 92H1092V138H934ZM956 138V178H1070V138" fill="#f8dfb7" stroke="#241c18" stroke-width="3" opacity="0.72"/>
  <path d="M970 114H1058M980 158H1048" class="line" opacity="0.42"/>`,
  };
  return motifs[slug] ?? '';
}

function signalMotif(slug) {
  const motifs = {
    collection: `  <path d="M838 152C946 186 1008 264 1020 372" class="thin dash" opacity="0.52"/>
  <circle cx="1020" cy="372" r="44" fill="none" stroke="#19b875" stroke-width="3" opacity="0.42"/>
  <circle cx="1020" cy="372" r="84" fill="none" stroke="#19b875" stroke-width="2" opacity="0.24"/>
  <path d="M890 492H1062M890 520H1034M890 548H1052" class="thin" opacity="0.28"/>`,
    types: `  <path d="M218 248C318 170 458 150 590 188" class="thin dash" opacity="0.5"/>
  <path d="M218 248C298 330 406 378 540 392" class="thin dash" opacity="0.42"/>
  <path d="M868 178H1046L1012 238H902Z" fill="none" stroke="#19b875" stroke-width="3" opacity="0.34"/>
  <path d="M886 214H1028M902 256H1010M918 294H994" class="thin" opacity="0.28"/>`,
    query: `  <path d="M778 160H1040V242H778ZM778 274H1040V356H778ZM778 388H1040V470H778" fill="none" stroke="#19b875" stroke-width="3" opacity="0.34"/>
  <path d="M846 202L812 202M846 316L812 316M846 430L812 430M1006 202H1066M1006 316H1066M1006 430H1066" class="thin" opacity="0.32"/>
  <path d="M936 508C984 476 1034 476 1080 508" class="thin dash" opacity="0.4"/>`,
    links: `  <path d="M206 462C344 386 506 362 682 392C810 414 910 390 1018 310" class="thin dash" opacity="0.52"/>
  <circle cx="1018" cy="310" r="54" fill="none" stroke="#19b875" stroke-width="3" opacity="0.3"/>
  <path d="M884 188H1052M884 216H1016M884 244H1034" class="thin" opacity="0.28"/>`,
    runtime: `  <path d="M192 240H994M192 328H994M192 416H994" class="thin" opacity="0.3"/>
  <path d="M276 214V456M600 214V456M910 214V456" class="thin" opacity="0.24"/>
  <path d="M208 492C284 458 350 458 426 492S578 526 654 492S806 458 882 492S1034 526 1092 494" fill="none" stroke="#19b875" stroke-width="3" opacity="0.42"/>`,
  };
  return motifs[slug] ?? '';
}

function cutMotif(slug) {
  const motifs = {
    collection: `  <path d="M880 118C934 96 1004 108 1042 154C1000 176 938 174 888 156Z" fill="#fffdf8" stroke="#1e1919" stroke-width="4" filter="url(#softShadow)"/>
  <path d="M928 132L970 154M970 132L928 154" class="thin"/>
  <path d="M776 520C834 488 908 494 960 532" fill="none" class="line"/>
  <circle cx="776" cy="520" r="10" fill="#fffdf8" stroke="#1e1919" stroke-width="4"/>`,
    types: `  <path d="M822 126L1030 126L986 196L866 196Z" fill="#fffdf8" stroke="#1e1919" stroke-width="4" filter="url(#softShadow)"/>
  <path d="M882 156H970" class="thin"/>
  <path d="M806 504L1006 456" class="line"/>
  <path d="M834 486L856 524M954 452L976 490" class="thin"/>`,
    query: `  <path d="M178 520C268 486 392 490 496 536C448 584 288 596 174 560Z" fill="#fffdf8" stroke="#1e1919" stroke-width="4" filter="url(#softShadow)"/>
  <circle cx="1014" cy="142" r="44" fill="#fffdf8" stroke="#1e1919" stroke-width="4" filter="url(#softShadow)"/>
  <path d="M1048 176L1102 230" class="line"/>
  <path d="M988 142H1038M1014 116V168" class="thin"/>`,
    links: `  <path d="M944 118C1010 96 1076 120 1100 180C1038 196 976 178 944 118Z" fill="#fffdf8" stroke="#1e1919" stroke-width="4" filter="url(#softShadow)"/>
  <path d="M184 532C294 484 434 500 532 574" fill="none" class="line"/>
  <circle cx="184" cy="532" r="10" fill="#fffdf8" stroke="#1e1919" stroke-width="4"/>
  <circle cx="532" cy="574" r="10" fill="#fffdf8" stroke="#1e1919" stroke-width="4"/>`,
    runtime: `  <path d="M146 512H360L326 596H112Z" fill="#fffdf8" stroke="#1e1919" stroke-width="4" filter="url(#softShadow)"/>
  <path d="M178 552H296" class="thin"/>
  <path d="M1000 118C1048 88 1106 104 1132 154C1088 174 1030 162 1000 118Z" fill="#fffdf8" stroke="#1e1919" stroke-width="4" filter="url(#softShadow)"/>
  <path d="M1038 124L1088 154" class="thin"/>`,
  };
  return motifs[slug] ?? '';
}

function blueprint(scene, index, identity) {
  const style = `    .bg { fill: #081d33; }
    .grid { stroke: #60d8ff; stroke-width: 1; opacity: 0.16; }
    .major { stroke: #60d8ff; stroke-width: 2; opacity: 0.24; }
    .panel { fill: #0d2a47; stroke: #bdf2ff; stroke-width: 4; }
    .panel2 { fill: #12395f; stroke: #6ee7ff; stroke-width: 3; }
    .line { stroke: #bdf2ff; stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; }
    .thin { stroke: #6ee7ff; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
    .dash { stroke-dasharray: 10 12; }
    .label { fill: #f1fbff; font: 700 34px "Azeret Mono", "DejaVu Sans Mono", monospace; letter-spacing: 0; }
    .small { fill: #d7f8ff; font: 650 22px "Azeret Mono", "DejaVu Sans Mono", monospace; letter-spacing: 0; }
    .tiny { fill: #9eeeff; font: 650 17px "Azeret Mono", "DejaVu Sans Mono", monospace; letter-spacing: 0; }
    .tag { fill: #081d33; font: 800 17px "Azeret Mono", "DejaVu Sans Mono", monospace; letter-spacing: 0; }`;
  const defs = `    <pattern id="minorGrid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" class="grid"/></pattern>
    <pattern id="majorGrid" width="160" height="160" patternUnits="userSpaceOnUse"><path d="M160 0H0V160" class="major"/></pattern>
${commonDefs(10 + index)}`;

  const body = blueprintBody(scene, index);

  return svg(`${identity.name}: ${scene.title}`, `Blueprint identity study for ${scene.title}.`, style, defs, body);
}

function blueprintFrame(scene, index, inner) {
  return `  <rect width="1200" height="676" class="bg"/>
  <rect width="1200" height="676" fill="url(#minorGrid)"/>
  <rect width="1200" height="676" fill="url(#majorGrid)"/>
  <rect x="72" y="72" width="1056" height="532" rx="10" class="panel"/>
  <path d="M72 154H1128M196 72V604M1002 72V604" class="thin"/>
  ${text(116, 128, scene.title, 'label')}
  ${text(820, 128, `MDB-${String(index + 1).padStart(2, '0')}`, 'tiny')}
${blueprintMotif(scene.slug)}
${inner}`;
}

function blueprintBody(scene, index) {
  const bodies = {
    collection: `  <path d="M166 260H408L454 306H704V512H166Z" class="panel2"/>
  <path d="M166 306H704" class="thin"/>
  ${lines(204, 364, scene.items, 'small', 44)}
  <rect x="790" y="238" width="230" height="92" rx="8" class="panel2"/>
  <rect x="790" y="374" width="230" height="92" rx="8" class="panel2"/>
  ${text(820, 292, 'scan root', 'small')}
  ${text(820, 428, 'records', 'small')}
  <path d="M704 386C740 352 754 318 790 286" class="line"/>
  <path d="M704 436C738 428 758 426 790 420" class="thin dash"/>`,
    types: `  <rect x="176" y="246" width="260" height="104" rx="8" class="panel2"/>
  <rect x="390" y="340" width="260" height="104" rx="8" class="panel2"/>
  <rect x="604" y="434" width="260" height="104" rx="8" class="panel2"/>
  ${text(212, 306, 'base.md', 'small')}
  ${text(430, 400, 'task.md', 'small')}
  ${text(646, 494, 'bug.md', 'small')}
  <path d="M434 318L390 340M648 412L604 434" class="line"/>
  <rect x="806" y="218" width="236" height="156" rx="8" class="panel2"/>
  ${lines(836, 272, ['strict inherited', 'fields merged', 'cycles rejected'], 'tiny', 34)}`,
    query: `  <rect x="148" y="222" width="328" height="280" rx="8" class="panel2"/>
  ${lines(186, 292, scene.items, 'small', 48)}
  <path d="M512 232L742 338L512 444Z" class="panel2"/>
  ${text(566, 344, 'filter', 'label')}
  <rect x="808" y="230" width="220" height="74" rx="8" class="panel2"/>
  <rect x="808" y="340" width="220" height="74" rx="8" class="panel2"/>
  <rect x="808" y="450" width="220" height="74" rx="8" class="panel2"/>
  ${lines(836, 276, scene.detail, 'tiny', 110)}
  <path d="M476 362H512M742 338C774 310 788 286 808 266M742 338C774 356 790 374 808 386M742 338C772 400 790 454 808 486" class="line"/>`,
    links: `  <circle cx="260" cy="320" r="78" class="panel2"/>
  <circle cx="508" cy="248" r="68" class="panel2"/>
  <circle cx="520" cy="452" r="78" class="panel2"/>
  <circle cx="790" cy="338" r="88" class="panel2"/>
  ${text(214, 328, 'raw', 'small')}
  ${text(466, 256, 'id', 'small')}
  ${text(460, 460, 'path', 'small')}
  ${text(746, 346, 'file', 'small')}
  <path d="M334 300C382 272 426 254 440 252M338 350C398 404 432 436 444 444M588 452C660 426 718 388 744 362M576 258C650 276 716 304 746 326" class="line dash"/>
  <rect x="864" y="486" width="190" height="44" rx="22" fill="#6ee7ff"/>
  ${text(892, 514, 'format kept', 'tag')}`,
    runtime: `  <rect x="150" y="250" width="220" height="120" rx="8" class="panel2"/>
  <rect x="490" y="250" width="220" height="120" rx="8" class="panel2"/>
  <rect x="830" y="250" width="220" height="120" rx="8" class="panel2"/>
  ${text(196, 320, 'event', 'small')}
  ${text(522, 320, 'workflow', 'small')}
  ${text(876, 320, 'action', 'small')}
  <path d="M370 310H490M710 310H830" class="line"/>
  <path d="M468 292L490 310L468 328M808 292L830 310L808 328" class="line"/>
  <path d="M196 424H1008" class="thin dash"/>
  ${lines(214, 470, scene.items, 'tiny', 34)}
  ${lines(836, 470, scene.detail, 'tiny', 34)}`,
  };
  return blueprintFrame(scene, index, bodies[scene.slug]);
}

function risograph(scene, index, identity) {
  const style = `    .paper { fill: #fff5dc; }
    .ink { stroke: #1e1919; stroke-width: 5; stroke-linecap: round; stroke-linejoin: round; }
    .thin { stroke: #1e1919; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
    .magenta { fill: #ff4f78; opacity: 0.9; mix-blend-mode: multiply; }
    .cyan { fill: #1f9dff; opacity: 0.82; mix-blend-mode: multiply; }
    .yellow { fill: #ffd447; opacity: 0.92; mix-blend-mode: multiply; }
    .green { fill: #39bf7a; opacity: 0.9; mix-blend-mode: multiply; }
    .label { fill: #1e1919; font: 800 42px "DejaVu Sans", Arial, sans-serif; letter-spacing: 0; }
    .small { fill: #1e1919; font: 750 24px "DejaVu Sans", Arial, sans-serif; letter-spacing: 0; }
    .tiny { fill: #1e1919; font: 700 17px "Azeret Mono", "DejaVu Sans Mono", monospace; letter-spacing: 0; }`;
  const defs = `    <pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.7" fill="#1e1919" opacity="0.18"/></pattern>
${commonDefs(30 + index)}`;
  const body = risographBody(scene);

  return svg(`${identity.name}: ${scene.title}`, `Risograph identity study for ${scene.title}.`, style, defs, body);
}

function risoBase(scene, inner) {
  return `  <rect width="1200" height="676" class="paper"/>
  <rect width="1200" height="676" fill="#1e1919" filter="url(#paper)" opacity="0.28"/>
  <rect x="70" y="78" width="1060" height="520" fill="url(#dots)" opacity="0.55"/>
  ${text(108, 152, scene.title, 'label')}
  ${text(110, 194, scene.subtitle, 'small')}
${inner}
${risographMotif(scene.slug)}`;
}

function risoSlip(x, y, values) {
  return `<path d="M${x} ${y}C${x + 72} ${y - 18} ${x + 168} ${y - 6} ${x + 230} ${y + 28}L${x + 208} ${y + 142}C${x + 142} ${y + 126} ${x + 76} ${y + 126} ${x + 14} ${y + 140}C${x - 2} ${y + 91} ${x - 4} ${y + 44} ${x} ${y}Z" fill="#fff5dc" opacity="0.9"/>
  ${lines(x + 24, y + 48, values, 'tiny', 34)}`;
}

function risographBody(scene) {
  const bodies = {
    collection: `  <path d="M116 260C210 168 392 154 520 238C640 317 646 490 522 562C390 638 190 598 94 482C18 390 38 310 116 260Z" class="cyan"/>
  <path d="M460 154C618 108 821 164 896 306C967 442 860 585 684 576C540 569 424 480 406 354C394 266 408 170 460 154Z" class="yellow"/>
  <path d="M688 194C784 122 958 132 1050 236C1134 331 1112 494 1004 556C902 614 744 568 692 458C646 360 628 240 688 194Z" class="magenta"/>
  <path d="M138 284C286 260 454 284 610 354" class="thin"/>
  ${lines(150, 344, scene.items, 'small', 46)}
  ${risoSlip(742, 300, scene.detail)}
  <path d="M466 426L520 482L628 330" class="ink"/>`,
    types: `  <path d="M184 134H398V562H184Z" class="cyan"/>
  <path d="M364 110H588V562H364Z" class="yellow"/>
  <path d="M548 138H778V562H548Z" class="green"/>
  <path d="M728 108H994V562H728Z" class="magenta"/>
  <path d="M208 248H950" class="thin"/>
  ${lines(228, 318, scene.items, 'small', 44)}
  ${risoSlip(710, 310, scene.detail)}
  <path d="M428 438L480 490L620 320" class="ink"/>`,
    query: `  <path d="M132 226C272 166 474 184 604 276L490 548C348 548 196 490 106 388C58 334 72 254 132 226Z" class="cyan"/>
  <path d="M494 150L1038 266L910 560L378 444Z" class="yellow"/>
  <path d="M744 126C874 94 1038 152 1082 286C1128 426 1008 564 856 548C716 534 612 414 634 280C646 208 676 142 744 126Z" class="magenta"/>
  ${lines(150, 304, scene.items, 'small', 46)}
  ${risoSlip(746, 326, scene.detail)}
  <path d="M518 350C594 330 646 328 716 350" class="ink"/>
  <path d="M638 304L716 350L628 398" class="ink"/>`,
    links: `  <circle cx="270" cy="356" r="170" class="cyan"/>
  <circle cx="548" cy="256" r="140" class="yellow"/>
  <circle cx="608" cy="474" r="136" class="green"/>
  <circle cx="880" cy="358" r="180" class="magenta"/>
  <path d="M338 328C406 282 454 260 500 252M376 408C454 450 504 468 548 472M680 448C756 418 814 386 870 350" class="ink"/>
  ${lines(144, 320, scene.items, 'small', 46)}
  ${risoSlip(750, 292, scene.detail)}`,
    runtime: `  <path d="M190 154C278 126 380 154 428 236C480 326 446 438 354 486C262 534 150 494 112 396C78 308 102 184 190 154Z" class="cyan"/>
  <path d="M486 104C608 72 748 134 790 252C832 370 758 498 632 518C508 538 402 448 398 320C394 218 414 122 486 104Z" class="yellow"/>
  <path d="M806 132C938 82 1094 170 1110 318C1126 466 1004 574 860 542C742 516 686 392 720 274C740 204 752 152 806 132Z" class="magenta"/>
  ${lines(156, 314, scene.items, 'small', 46)}
  <path d="M420 330H526M768 330H856" class="ink"/>
  <path d="M512 296L560 330L512 364M842 296L890 330L842 364" class="ink"/>
  ${risoSlip(830, 340, scene.detail)}`,
  };
  return risoBase(scene, bodies[scene.slug]);
}

function archiveCards(scene, index, identity) {
  const style = `    .bg { fill: #f3eadb; }
    .card { fill: #fffaf0; stroke: #241c18; stroke-width: 4; }
    .cardAlt { fill: #f8dfb7; stroke: #241c18; stroke-width: 4; }
    .red { stroke: #b83232; fill: none; stroke-width: 5; stroke-linecap: round; stroke-linejoin: round; }
    .line { stroke: #241c18; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
    .stamp { fill: none; stroke: #b83232; stroke-width: 5; }
    .label { fill: #241c18; font: 700 35px Georgia, "Times New Roman", serif; letter-spacing: 0; }
    .small { fill: #241c18; font: 700 23px "Azeret Mono", "DejaVu Sans Mono", monospace; letter-spacing: 0; }
    .tiny { fill: #241c18; font: 650 16px "Azeret Mono", "DejaVu Sans Mono", monospace; letter-spacing: 0; }
    .stampText { fill: #b83232; font: 800 22px "Azeret Mono", "DejaVu Sans Mono", monospace; letter-spacing: 0; }`;
  const defs = commonDefs(50 + index);
  const body = archiveBody(scene);

  return svg(`${identity.name}: ${scene.title}`, `Archive card identity study for ${scene.title}.`, style, defs, body);
}

function archiveBase(scene, inner) {
  return `  <rect width="1200" height="676" class="bg"/>
  <rect width="1200" height="676" fill="#1e1919" filter="url(#paper)" opacity="0.25"/>
${archiveMotif(scene.slug)}
${inner}
  <path d="M100 84C132 70 169 67 208 77" class="line"/>
  <path d="M982 582C1020 598 1062 594 1103 570" class="line"/>`;
}

function portableStamp(x, y, rotate = -7) {
  return `<rect x="${x}" y="${y}" width="206" height="82" rx="8" class="stamp" transform="rotate(${rotate} ${x + 103} ${y + 41})"/>
  ${text(x + 36, y + 50, 'PORTABLE', 'stampText', `transform="rotate(${rotate} ${x + 103} ${y + 41})"`)}`
}

function archiveCardPath(x, y, w, h, cls = 'card') {
  return `<path d="M${x + 42} ${y}C${x + w * 0.42} ${y - 22} ${x + w * 0.82} ${y - 12} ${x + w} ${y + 42}L${x + w - 54} ${y + h}C${x + w * 0.56} ${y + h - 18} ${x + w * 0.24} ${y + h - 4} ${x + 24} ${y + h + 18}C${x - 8} ${y + h - 116} ${x + 2} ${y + 116} ${x + 42} ${y}Z" class="${cls}"/>`;
}

function archiveBody(scene) {
  const bodies = {
    collection: `${archiveCardPath(72, 108, 430, 430)}
  <path d="M122 198H468" class="line"/>
  ${text(126, 168, 'Collection', 'label')}
  ${lines(144, 260, scene.items, 'small', 48)}
  <path d="M584 156H1016L1064 206V536H584Z" class="cardAlt"/>
  <path d="M584 206H1064" class="line"/>
  ${text(632, 272, 'folder inventory', 'small')}
  ${lines(632, 330, scene.detail, 'small', 44)}
  ${portableStamp(760, 438)}`,
    types: `${archiveCardPath(96, 128, 330, 420)}
  ${archiveCardPath(316, 102, 330, 420, 'cardAlt')}
  ${archiveCardPath(536, 128, 330, 420)}
  ${text(146, 188, 'base', 'label')}
  ${text(368, 162, 'task', 'label')}
  ${text(590, 188, 'child', 'label')}
  <path d="M250 326C340 292 430 292 520 326" class="red"/>
  <path d="M520 326C610 360 700 360 790 326" class="red"/>
  ${lines(142, 260, scene.items, 'small', 42)}
  ${lines(606, 260, scene.detail, 'small', 42)}
  ${portableStamp(824, 430, 4)}`,
    query: `${archiveCardPath(72, 98, 500, 470)}
  ${text(126, 158, 'Query ledger', 'label')}
  <path d="M126 206H524M126 280H524M126 354H524M126 428H524" class="line"/>
  ${lines(146, 254, scene.items, 'small', 74)}
  <path d="M654 128C784 98 930 112 1050 180L990 532C884 492 750 492 624 534C614 402 620 270 654 128Z" class="cardAlt"/>
  ${text(700, 210, 'results', 'label')}
  ${lines(704, 282, scene.detail, 'small', 48)}
  <path d="M548 332H654" class="red"/>
  ${portableStamp(792, 440)}`,
    links: `${archiveCardPath(80, 122, 300, 330)}
  ${archiveCardPath(452, 82, 300, 330, 'cardAlt')}
  ${archiveCardPath(790, 176, 300, 330)}
  ${text(130, 182, 'raw', 'label')}
  ${text(504, 142, 'resolver', 'label')}
  ${text(850, 236, 'file', 'label')}
  ${lines(128, 250, scene.items, 'small', 42)}
  ${lines(506, 210, scene.detail, 'small', 42)}
  <path d="M352 300C432 238 468 210 500 188M688 260C756 260 800 270 850 306" class="red"/>
  <circle cx="500" cy="188" r="12" fill="#b83232"/>
  <circle cx="850" cy="306" r="12" fill="#b83232"/>
  ${portableStamp(812, 452, -10)}`,
    runtime: `${archiveCardPath(86, 160, 250, 330)}
  ${archiveCardPath(392, 112, 300, 382, 'cardAlt')}
  ${archiveCardPath(778, 160, 280, 330)}
  ${text(136, 220, 'event', 'label')}
  ${text(452, 172, 'workflow', 'label')}
  ${text(830, 220, 'action', 'label')}
  ${lines(130, 292, [scene.items[0]], 'small', 40)}
  ${lines(452, 250, [scene.items[1], scene.detail[0], 'idempotent'], 'small', 42)}
  ${lines(832, 292, [scene.items[2], scene.detail[2]], 'small', 42)}
  <path d="M336 324H392M692 324H778" class="red"/>
  ${portableStamp(820, 450, 5)}`,
  };
  return archiveBase(scene, bodies[scene.slug]);
}

function signalGraph(scene, index, identity) {
  const style = `    .bg { fill: #fbfffb; }
    .grid { stroke: #cceede; stroke-width: 1.2; }
    .panel { fill: #ffffff; stroke: #14231c; stroke-width: 4; }
    .nodeA { fill: #32f29b; stroke: #14231c; stroke-width: 5; }
    .nodeB { fill: #38a7ff; stroke: #14231c; stroke-width: 5; }
    .nodeC { fill: #ff5a7c; stroke: #14231c; stroke-width: 5; }
    .line { stroke: #14231c; stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; }
    .thin { stroke: #19b875; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
    .dash { stroke-dasharray: 8 12; }
    .label { fill: #14231c; font: 800 36px "DejaVu Sans", Arial, sans-serif; letter-spacing: 0; }
    .small { fill: #14231c; font: 750 23px "DejaVu Sans", Arial, sans-serif; letter-spacing: 0; }
    .tiny { fill: #14231c; font: 700 16px "Azeret Mono", "DejaVu Sans Mono", monospace; letter-spacing: 0; }`;
  const defs = `    <pattern id="signalGrid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" class="grid"/></pattern>
    <filter id="glow" x="-60%" y="-60%" width="220%" height="220%"><feDropShadow dx="0" dy="0" stdDeviation="12" flood-color="#32f29b" flood-opacity="0.45"/></filter>
${commonDefs(70 + index)}`;
  const body = signalBody(scene);

  return svg(`${identity.name}: ${scene.title}`, `Signal graph identity study for ${scene.title}.`, style, defs, body);
}

function signalFrame(scene, inner) {
  return `  <rect width="1200" height="676" class="bg"/>
  <rect width="1200" height="676" fill="url(#signalGrid)" opacity="0.75"/>
  <rect x="78" y="76" width="1046" height="524" rx="22" class="panel"/>
  <circle cx="1018" cy="114" r="9" fill="#32f29b" stroke="#14231c" stroke-width="3"/>
  <circle cx="1050" cy="114" r="9" fill="#38a7ff" stroke="#14231c" stroke-width="3"/>
  <circle cx="1082" cy="114" r="9" fill="#ff5a7c" stroke="#14231c" stroke-width="3"/>
  <path d="M920 150C938 126 958 126 976 150S1014 174 1032 150S1070 126 1092 150" fill="none" stroke="#19b875" stroke-width="3" opacity="0.62"/>
  <path d="M892 190H1096" class="thin" opacity="0.24"/>
  ${text(118, 144, scene.title, 'label')}
  ${text(120, 180, scene.subtitle, 'small')}
${signalMotif(scene.slug)}
${inner}`;
}

function pill(x, y, w, label) {
  return `<rect x="${x}" y="${y}" width="${w}" height="58" rx="29" fill="#ffffff" stroke="#14231c" stroke-width="4"/>
  ${text(x + 24, y + 36, label, 'tiny')}`;
}

function signalBody(scene) {
  const bodies = {
    collection: `  <circle cx="244" cy="362" r="88" class="nodeB" filter="url(#glow)"/>
  <circle cx="522" cy="280" r="86" class="nodeA" filter="url(#glow)"/>
  <circle cx="522" cy="468" r="86" class="nodeA" filter="url(#glow)"/>
  <circle cx="824" cy="374" r="106" class="nodeC" filter="url(#glow)"/>
  <path d="M330 342L438 296M330 382L438 452M608 300L728 350M608 448L728 398" class="line dash"/>
  ${text(486, 288, 'types', 'tiny')}
  ${text(486, 476, 'notes', 'tiny')}
  ${text(782, 382, 'scan', 'tiny')}
  ${pill(154, 516, 242, scene.items[0])}
  ${pill(460, 516, 260, scene.items[1])}
  ${pill(770, 516, 240, scene.detail[0])}`,
    types: `  <circle cx="600" cy="246" r="92" class="nodeA" filter="url(#glow)"/>
  <circle cx="382" cy="420" r="84" class="nodeB" filter="url(#glow)"/>
  <circle cx="600" cy="452" r="84" class="nodeB" filter="url(#glow)"/>
  <circle cx="818" cy="420" r="84" class="nodeC" filter="url(#glow)"/>
  <path d="M554 322L426 386M600 338V368M646 322L774 386" class="line"/>
  ${text(560, 254, 'base', 'tiny')}
  ${text(346, 428, 'fields', 'tiny')}
  ${text(562, 460, 'defaults', 'tiny')}
  ${text(770, 428, 'strict', 'tiny')}
  ${pill(204, 532, 240, scene.detail[0])}
  ${pill(480, 532, 250, scene.detail[1])}
  ${pill(770, 532, 250, scene.detail[2])}`,
    query: `  <circle cx="246" cy="344" r="82" class="nodeB" filter="url(#glow)"/>
  <path d="M392 210L724 338L392 466Z" class="nodeA" filter="url(#glow)"/>
  <circle cx="898" cy="260" r="66" class="nodeC" filter="url(#glow)"/>
  <circle cx="930" cy="420" r="82" class="nodeC" filter="url(#glow)"/>
  <path d="M328 344H430M724 338C792 300 828 278 840 268M724 338C794 376 836 402 850 414" class="line dash"/>
  ${text(500, 348, 'where', 'tiny')}
  ${pill(146, 520, 260, scene.items[0])}
  ${pill(470, 520, 240, scene.items[1])}
  ${pill(782, 520, 300, scene.detail[0])}`,
    links: `  <circle cx="228" cy="304" r="68" class="nodeB" filter="url(#glow)"/>
  <circle cx="420" cy="430" r="68" class="nodeA" filter="url(#glow)"/>
  <circle cx="602" cy="284" r="86" class="nodeA" filter="url(#glow)"/>
  <circle cx="816" cy="430" r="86" class="nodeC" filter="url(#glow)"/>
  <circle cx="966" cy="292" r="60" class="nodeC" filter="url(#glow)"/>
  <path d="M286 338L366 396M478 392L548 330M674 326L760 394M870 390L926 332" class="line dash"/>
  ${text(566, 292, 'resolve', 'tiny')}
  ${pill(140, 524, 220, scene.items[0])}
  ${pill(398, 524, 230, scene.items[1])}
  ${pill(710, 524, 260, scene.detail[0])}`,
    runtime: `  <circle cx="232" cy="360" r="80" class="nodeB" filter="url(#glow)"/>
  <rect x="398" y="246" width="262" height="228" rx="32" class="nodeA" filter="url(#glow)"/>
  <circle cx="846" cy="360" r="92" class="nodeC" filter="url(#glow)"/>
  <path d="M312 360H398M660 360H754" class="line"/>
  <path d="M376 334L398 360L376 386M730 334L754 360L730 386" class="line"/>
  ${text(190, 368, 'event', 'tiny')}
  ${text(448, 356, 'workflow', 'tiny')}
  ${text(802, 368, 'action', 'tiny')}
  ${pill(154, 522, 240, scene.items[0])}
  ${pill(462, 522, 240, scene.items[1])}
  ${pill(770, 522, 240, scene.items[2])}`,
  };
  return signalFrame(scene, bodies[scene.slug]);
}

function cutPaper(scene, index, identity) {
  const style = `    .bg { fill: #fffdf8; }
    .paper1 { fill: #f8c94a; stroke: #1e1919; stroke-width: 5; filter: url(#softShadow); }
    .paper2 { fill: #ff647d; stroke: #1e1919; stroke-width: 5; filter: url(#softShadow); }
    .paper3 { fill: #2fb879; stroke: #1e1919; stroke-width: 5; filter: url(#softShadow); }
    .paper4 { fill: #2f7df4; stroke: #1e1919; stroke-width: 5; filter: url(#softShadow); }
    .line { stroke: #1e1919; stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; }
    .thin { stroke: #1e1919; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
    .label { fill: #1e1919; font: 800 39px "DejaVu Sans", Arial, sans-serif; letter-spacing: 0; }
    .small { fill: #1e1919; font: 750 24px "DejaVu Sans", Arial, sans-serif; letter-spacing: 0; }
    .tiny { fill: #1e1919; font: 700 16px "Azeret Mono", "DejaVu Sans Mono", monospace; letter-spacing: 0; }`;
  const defs = commonDefs(90 + index);
  const body = cutPaperBody(scene);

  return svg(`${identity.name}: ${scene.title}`, `Cut paper identity study for ${scene.title}.`, style, defs, body);
}

function cutPaperBase(scene, inner) {
  return `  <rect width="1200" height="676" class="bg"/>
  <rect width="1200" height="676" fill="#1e1919" filter="url(#paper)" opacity="0.18"/>
${inner}
${cutMotif(scene.slug)}
  ${text(82, 118, scene.title, 'label')}
  ${text(84, 154, scene.subtitle, 'small')}`;
}

function cutLabel(x, y, label) {
  return `<path d="M${x} ${y}C${x + 78} ${y - 26} ${x + 180} ${y - 16} ${x + 250} ${y + 18}C${x + 238} ${y + 52} ${x + 210} ${y + 68} ${x + 170} ${y + 64}C${x + 106} ${y + 56} ${x + 54} ${y + 60} ${x + 8} ${y + 74}C${x - 8} ${y + 48} ${x - 6} ${y + 18} ${x} ${y}Z" fill="#fffdf8" stroke="#1e1919" stroke-width="4" filter="url(#softShadow)"/>
  ${text(x + 28, y + 42, label, 'small')}`;
}

function cutPaperBody(scene) {
  const bodies = {
    collection: `  <path d="M164 230H520L592 302V548H164Z" class="paper1"/>
  <path d="M164 302H592" class="thin"/>
  <path d="M452 148C568 96 728 132 792 238C854 340 794 484 668 518C554 550 442 482 414 366C392 276 390 178 452 148Z" class="paper4"/>
  <path d="M744 218C858 164 1032 198 1098 316C1158 424 1070 560 918 556C790 552 704 452 720 334C728 278 706 238 744 218Z" class="paper2"/>
  ${lines(206, 372, scene.items, 'small', 42)}
  ${cutLabel(704, 454, scene.detail[0])}
  <path d="M790 330L850 390L966 250" class="line"/>`,
    types: `  <path d="M214 190C316 142 448 170 504 266C560 362 496 494 380 522C264 550 152 484 136 370C124 286 146 222 214 190Z" class="paper1"/>
  <path d="M438 134C552 86 706 124 762 236C818 348 730 488 592 494C470 500 392 404 406 292C414 222 390 154 438 134Z" class="paper4"/>
  <path d="M680 192C810 132 1004 174 1068 310C1128 438 1012 564 856 534C728 510 654 394 684 276C692 244 648 206 680 192Z" class="paper2"/>
  ${lines(182, 334, scene.items, 'small', 42)}
  ${cutLabel(518, 456, scene.detail[0])}
  <path d="M318 274C430 238 564 246 684 306" class="line"/>`,
    query: `  <path d="M174 214C272 158 404 180 470 278C532 370 496 498 384 552C274 604 138 556 92 446C54 354 88 262 174 214Z" class="paper1"/>
  <path d="M500 188L830 340L500 492Z" class="paper4"/>
  <path d="M812 184C946 122 1118 218 1110 370C1104 498 982 574 858 526C756 486 724 364 774 270C790 238 772 202 812 184Z" class="paper2"/>
  ${lines(144, 340, scene.items, 'small', 42)}
  ${cutLabel(748, 450, scene.detail[0])}
  <path d="M472 350H506M832 340C874 316 906 292 942 260M832 340C886 386 914 418 948 466" class="line"/>`,
    links: `  <path d="M126 290C208 224 338 232 410 316C486 404 434 538 318 570C204 602 88 526 74 410C68 358 86 322 126 290Z" class="paper1"/>
  <path d="M464 174C554 122 680 138 744 226C812 320 768 456 652 502C536 548 414 484 390 366C372 278 398 214 464 174Z" class="paper4"/>
  <path d="M806 232C902 168 1044 196 1100 304C1158 416 1086 554 956 566C832 578 736 484 746 356C750 304 766 258 806 232Z" class="paper2"/>
  ${lines(116, 398, scene.items, 'small', 42)}
  ${cutLabel(500, 504, scene.detail[0])}
  <path d="M374 350C440 292 480 260 514 246M710 328C790 330 844 348 900 384" class="line"/>
  <circle cx="514" cy="246" r="13" fill="#fffdf8" stroke="#1e1919" stroke-width="4"/>
  <circle cx="900" cy="384" r="13" fill="#fffdf8" stroke="#1e1919" stroke-width="4"/>`,
    runtime: `  <path d="M126 260C222 198 354 214 420 310C486 406 436 536 318 572C210 604 92 536 72 426C60 354 76 292 126 260Z" class="paper3"/>
  <path d="M450 192C558 134 706 162 764 274C824 390 748 530 610 536C486 542 398 444 412 322C418 266 398 218 450 192Z" class="paper1"/>
  <path d="M796 234C900 168 1058 202 1110 326C1162 450 1066 572 924 554C810 540 730 438 756 326C766 282 756 258 796 234Z" class="paper2"/>
  ${text(166, 370, 'event', 'small')}
  ${text(492, 350, 'workflow', 'small')}
  ${text(840, 370, 'action', 'small')}
  <path d="M418 356H472M764 356H812" class="line"/>
  ${cutLabel(470, 508, scene.detail[0])}
  <path d="M864 414L922 474L1038 318" class="line"/>`,
  };
  return cutPaperBase(scene, bodies[scene.slug]);
}

function writeReadme() {
  const text = `# mdbase branding identities

Five additional illustration identity directions for mdbase. Each identity has five SVG studies using the same subject set: collection, types, query, links, and runtime.

These are exploratory systems, not final brand assets. They are intentionally different from the existing sketch identity in \`../branding-sketches\`.

## Identities

${identities.map((identity) => `- \`${identity.slug}\` - ${identity.name}: ${identity.description}`).join('\n')}

## Review

Run \`node generate-identities.mjs\` to regenerate the SVGs and contact sheet.
Raster review was done with \`rsvg-convert\` and ImageMagick montages.
`;
  writeFileSync(join(root, 'README.md'), text);
}

function writeIndex() {
  const figures = identities
    .map((identity) => {
      const sceneFigures = scenes
        .map((scene, index) => {
          const file = `${identity.slug}/${String(index + 1).padStart(2, '0')}-${scene.slug}.svg`;
          return `        <figure>
          <img src="./${file}" alt="${esc(identity.name)} ${esc(scene.title)} illustration">
          <figcaption><span>${esc(identity.name)} / ${esc(scene.title)}</span><a href="./${file}">open</a></figcaption>
        </figure>`;
        })
        .join('\n');
      return `      <section>
        <h2>${esc(identity.name)}</h2>
        <p>${esc(identity.description)}</p>
        <div class="grid">
${sceneFigures}
        </div>
      </section>`;
    })
    .join('\n');

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>mdbase branding identities</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-width: 320px;
        background: #fffdf8;
        color: #1e1919;
        font-family: "DejaVu Sans", Arial, sans-serif;
        line-height: 1.5;
      }
      main {
        width: min(1180px, calc(100vw - 32px));
        margin: 0 auto;
        padding: 36px 0 64px;
      }
      h1 {
        margin: 0 0 8px;
        font-size: clamp(32px, 5vw, 56px);
        line-height: 1.05;
        letter-spacing: 0;
      }
      h2 {
        margin: 48px 0 8px;
        font-size: 26px;
        letter-spacing: 0;
      }
      p {
        max-width: 820px;
        margin: 0 0 20px;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 18px;
      }
      figure {
        margin: 0;
        background: #fff;
        border: 2px solid #1e1919;
      }
      img {
        display: block;
        width: 100%;
        aspect-ratio: 1200 / 676;
        object-fit: cover;
        border-bottom: 2px solid #1e1919;
      }
      figcaption {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 10px 12px;
        font-size: 12px;
        overflow-wrap: anywhere;
      }
      a {
        color: #1f62ff;
        text-decoration-thickness: 2px;
        text-underline-offset: 3px;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>mdbase branding identities</h1>
      <p>Five distinct illustration systems, each demonstrated across collection, type, query, link, and runtime subjects.</p>
${figures}
    </main>
  </body>
</html>
`;
  writeFileSync(join(root, 'index.html'), html);
}

for (const identity of identities) {
  const dir = join(root, identity.slug);
  mkdirSync(dir, { recursive: true });
  scenes.forEach((scene, index) => {
    const file = `${String(index + 1).padStart(2, '0')}-${scene.slug}.svg`;
    writeFileSync(join(dir, file), identity.renderer(scene, index, identity));
  });
}

writeReadme();
writeIndex();

console.log(`Generated ${identities.length * scenes.length} SVGs in ${root}`);
