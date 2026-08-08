const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const jobs = [
  ['assets/images/licitabase-search-flow-transparent.svg', 'assets/images/licitabase-search-flow-light.svg'],
  ['assets/images/licitabase-unified-hub-transparent.svg', 'assets/images/licitabase-unified-hub-light.svg'],
  ['assets/images/licitabase-daily-opportunities-transparent.svg', 'assets/images/licitabase-daily-opportunities-light.svg'],
  ['assets/images/licitabase-decision-intelligence-transparent.svg', 'assets/images/licitabase-decision-intelligence-light.svg'],
  ['assets/images/licitabase-portals-solar-system.svg', 'assets/images/licitabase-portals-solar-system-light.svg'],
  ['assets/illustrations/how/how-01-filtros.svg', 'assets/illustrations/how/how-01-filtros-light.svg'],
  ['assets/illustrations/how/how-02-oportunidades.svg', 'assets/illustrations/how/how-02-oportunidades-light.svg'],
  ['assets/illustrations/how/how-03-pipeline.svg', 'assets/illustrations/how/how-03-pipeline-light.svg'],
];

const colors = new Map(Object.entries({
  '#000000': '#173A29',
  '#000': '#173A29',
  '#030C08': '#F8FBF9',
  '#030C0A': '#F8FBF9',
  '#04090C': '#F8FBF9',
  '#04090c': '#F8FBF9',
  '#04110B': '#EDF7F1',
  '#050810': '#FFFFFF',
  '#050A0B': '#F8FBF9',
  '#060B0C': '#F8FBF9',
  '#06100B': '#EEF6F1',
  '#06130D': '#F5F9F6',
  '#061810': '#EEF6F1',
  '#061D14': '#EAF4EE',
  '#06251A': '#E7F4EB',
  '#063D27': '#DDF2E5',
  '#063F29': '#067A39',
  '#070C0D': '#F1F6F3',
  '#07100D': '#F5F9F6',
  '#071916': '#EAF4EE',
  '#081510': '#F4F8F5',
  '#081B18': '#F0F6F2',
  '#08261A': '#DFF2E6',
  '#09130F': '#F5F9F6',
  '#091611': '#F1F7F3',
  '#09271A': '#E5F4EA',
  '#0A1117': '#F1F6F3',
  '#0A1712': '#F3F8F5',
  '#0A1C14': '#ECF5EF',
  '#0A1E15': '#E7F4EB',
  '#0A2418': '#E7F4EB',
  '#0A281B': '#E2F2E7',
  '#0B1713': '#F1F7F3',
  '#0B1814': '#FFFFFF',
  '#0C1119': '#F8FBF9',
  '#0C1A15': '#EFF6F1',
  '#0C4A2E': '#067A39',
  '#0D2118': '#EAF7EF',
  '#0D452B': '#DFF3E7',
  '#0E1C17': '#EDF5F0',
  '#0E4A2E': '#067A39',
  '#10201A': '#FFFFFF',
  '#172029': '#FFFFFF',
  '#345D49': '#8DA398',
  '#405149': '#94A099',
  '#4FA876': '#6C9880',
  '#55B17B': '#067A39',
  '#57645E': '#66736B',
  '#6B9E81': '#6C9880',
  '#7B8A82': '#66736B',
  '#91AB9C': '#66736B',
  '#92999F': '#66736B',
  '#9BC5AA': '#6D8D7B',
  '#9DA5AB': '#66736B',
  '#A9B4B5': '#5B6961',
  '#AEB5BB': '#66736B',
  '#B2B7BD': '#66736B',
  '#B7C0BB': '#5B6961',
  '#BFEAD0': '#5F806E',
  '#C5D0CA': '#526159',
  '#C8D5CE': '#526159',
  '#C9DDD2': '#8CA097',
  '#D8DDDF': '#102018',
  '#D8DDE1': '#102018',
  '#DCE5E0': '#46564D',
  '#DDE7E1': '#46564D',
  '#EEF4F1': '#102018',
  '#EEF7F2': '#102018',
  '#F6F9F7': '#102018',
  '#F7FAF8': '#102018',
  '#FFFFFF': '#FFFFFF',
}));

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function convert(source, targetName) {
  let output = source;
  const entries = [...colors.entries()].sort((a, b) => b[0].length - a[0].length);
  entries.forEach(([from, to]) => {
    output = output.replace(new RegExp(escapeRegExp(from), 'gi'), to);
  });
  output = output
    .replace(/flood-opacity="\.([23])"/g, 'flood-opacity=".10"')
    .replace(/stroke="#FFFFFF" stroke-opacity="0\.0[5-9]"/g, 'stroke="#067A39" stroke-opacity="0.14"')
    .replace(/<svg /, '<svg data-theme-asset="light" ');

  if (targetName.includes('portals-solar-system')) {
    output = output.replace(/(<text\b[^>]*\bfill=")#FFFFFF("[^>]*>)/gi, '$1#102018$2');
  }

  if (targetName.includes('daily-opportunities')) {
    output = output
      .replace(/(<text\b[^>]*\bfill=")#FFFFFF("[^>]*>)/gi, '$1#102018$2')
      .replace(/#71E9A2/gi, '#067A39');
  }

  if (targetName.includes('unified-hub')) {
    output = output
      .replace(/(<text\s+x="438"\s+y="264"\s+fill=")#FFFFFF("[^>]*>)/i, '$1#102018$2')
      .replace(/#51D989/gi, '#067A39');
  }

  if (targetName.includes('decision-intelligence')) {
    output = output.replace(
      /(<text\s+x="68"\s+y="82"\s+fill=")#FFFFFF("[^>]*>)/i,
      '$1#102018$2',
    );
  }

  return output;
}

jobs.forEach(([sourceName, targetName]) => {
  const sourcePath = path.join(root, sourceName);
  const targetPath = path.join(root, targetName);
  const source = fs.readFileSync(sourcePath, 'utf8');
  fs.writeFileSync(targetPath, convert(source, targetName), 'utf8');
  process.stdout.write(`${targetName}\n`);
});
