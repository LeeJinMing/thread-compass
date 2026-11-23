import { fileURLToPath } from 'node:url';
import Relate from '@relate/relate';

const path = fileURLToPath(new URL('./sample/workbench.rl', import.meta.url));
const graph = Relate.Database.open(path, { readOnly: true }).connect();
const { count } = graph.query('MATCH (s:SavedLink) RETURN count(s) AS count').single();
const { rows } = graph.query(`
  MATCH (w:Workspace)-[:HAS_THREAD]->(t:Thread)-[:RECORDED]->(d:Decision)-[r:SUPPORTED_BY]->(s:SavedLink)
  RETURN w.name AS workspace, t.subject AS thread, d.summary AS decision, s.title AS source
  ORDER BY w.name, r.priority
`);

console.log(`${count} saved artifacts, ${rows.length} paths to decision evidence\n`);
let lastWorkspace;
for (const row of rows) {
  if (row.workspace !== lastWorkspace) {
    console.log(`\n${row.workspace} / ${row.thread}\n  Decision: ${row.decision}`);
    lastWorkspace = row.workspace;
  }
  console.log(`  Supported by: ${row.source}`);
}
