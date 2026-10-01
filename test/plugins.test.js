const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { validateRepo } = require('../scripts/validate-plugins.js');

const ROOT = path.join(__dirname, '..');
const PLUGIN = 'plugins/regdatalab';

// Copy just what the validator reads into a scratch repo so each negative test
// can break one thing and prove the validator catches it.
function scratchRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rdl-plugin-'));
  for (const rel of ['.claude-plugin', '.agents', 'plugins', 'scripts/connector-tools.json']) {
    fs.cpSync(path.join(ROOT, rel), path.join(dir, rel), { recursive: true });
  }
  return dir;
}

function editJson(file, fn) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  fn(data);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function expectProblem(mutate, pattern) {
  const dir = scratchRepo();
  try {
    mutate(dir);
    const errors = validateRepo(dir);
    assert.ok(errors.some((e) => pattern.test(e)), `expected ${pattern}, got:\n${errors.join('\n')}`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('shipped plugin packages are valid for Claude and ChatGPT', () => {
  assert.deepEqual(validateRepo(ROOT), []);
});

test('both platforms point at the same hosted MCP endpoint with no credentials', () => {
  const claude = JSON.parse(fs.readFileSync(path.join(ROOT, PLUGIN, '.mcp.json'), 'utf8'));
  const openai = JSON.parse(fs.readFileSync(path.join(ROOT, PLUGIN, 'mcp.json'), 'utf8'));
  assert.deepEqual(claude.mcpServers.regdatalab, { type: 'http', url: 'https://www.regdatalab.com/mcp' });
  assert.deepEqual(openai.mcpServers.regdatalab, { type: 'streamable-http', url: 'https://www.regdatalab.com/mcp' });
});

test('rejects a credential baked into the MCP config', () => {
  expectProblem((dir) => editJson(path.join(dir, PLUGIN, '.mcp.json'), (d) => {
    d.mcpServers.regdatalab.headers = { Authorization: 'Bearer fda_Abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG' };
  }), /no headers|credential/);
  expectProblem((dir) => editJson(path.join(dir, PLUGIN, '.mcp.json'), (d) => {
    d.mcpServers.regdatalab.url = 'https://www.regdatalab.com/mcp?apiKey=fda_x';
  }), /url must be/);
});

test('rejects owner-operations references and auth keys in the public package', () => {
  expectProblem((dir) => fs.appendFileSync(path.join(dir, PLUGIN, 'skills/company-compliance-profile/SKILL.md'), '\nCall regdatalab_owner_snapshot.\n'), /owner-operations/);
  expectProblem((dir) => fs.appendFileSync(path.join(dir, PLUGIN, 'README.md'), '\nScope ops:read.\n'), /owner-operations/);
  expectProblem((dir) => fs.appendFileSync(path.join(dir, PLUGIN, 'README.md'), '\nOwner URL https://www.regdatalab.com/mcp/owner\n'), /owner-operations/);
  expectProblem((dir) => editJson(path.join(dir, '.claude-plugin/marketplace.json'), (d) => { d.description = 'also /mcp/owner'; }), /marketplace\.json: references the owner-operations/);
  expectProblem((dir) => editJson(path.join(dir, '.agents/plugins/marketplace.json'), (d) => { d.note = 'Bearer fda_Abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG'; }), /marketplace\.json: looks like it contains a credential/);
  expectProblem((dir) => editJson(path.join(dir, PLUGIN, '.mcp.json'), (d) => { d.mcpServers.regdatalab.oauth = { scopes: ['ops:read'] }; }), /key "oauth" not allowed/);
  expectProblem((dir) => editJson(path.join(dir, PLUGIN, 'mcp.json'), (d) => { d.mcpServers.regdatalab.scopes = ['fda:read']; }), /key "scopes" not allowed/);
});

test('a placeholder prefix cannot hide a real key', () => {
  expectProblem((dir) => fs.appendFileSync(path.join(dir, PLUGIN, 'README.md'), '\nBearer YOUR_fda_Abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG\n'), /credential/);
  expectProblem((dir) => fs.appendFileSync(path.join(dir, PLUGIN, 'README.md'), '\nkey: X_fda_Abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG\n'), /credential/);
});

test('allows documented key placeholders in plugin text', () => {
  const dir = scratchRepo();
  try {
    fs.appendFileSync(path.join(dir, PLUGIN, 'README.md'), '\nClaude Code: --header "Authorization: Bearer YOUR_API_KEY"\n');
    assert.deepEqual(validateRepo(dir), []);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('rejects a non-https or wrong endpoint', () => {
  expectProblem((dir) => editJson(path.join(dir, PLUGIN, 'mcp.json'), (d) => {
    d.mcpServers.regdatalab.url = 'http://www.regdatalab.com/mcp';
  }), /url must be/);
});

test('rejects skills that reference write tools or unknown tools', () => {
  expectProblem((dir) => fs.appendFileSync(path.join(dir, PLUGIN, 'skills/company-compliance-profile/SKILL.md'), '\nThen call fda_save_aliases.\n'), /write tool fda_save_aliases/);
  expectProblem((dir) => fs.appendFileSync(path.join(dir, PLUGIN, 'skills/company-compliance-profile/SKILL.md'), '\nThen call fda_made_up_tool.\n'), /unknown tool fda_made_up_tool/);
});

test('rejects a skill whose name does not match its folder', () => {
  expectProblem((dir) => {
    const f = path.join(dir, PLUGIN, 'skills/supplier-risk-screen/SKILL.md');
    fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace('name: supplier-risk-screen', 'name: other'));
  }, /must equal folder name/);
});

test('rejects directory blockers: bin/, OS files, short README, missing license, symlinks', () => {
  expectProblem((dir) => fs.mkdirSync(path.join(dir, PLUGIN, 'bin')), /bin\/ at plugin root/);
  expectProblem((dir) => fs.writeFileSync(path.join(dir, PLUGIN, '.DS_Store'), 'x'), /OS metadata/);
  expectProblem((dir) => fs.writeFileSync(path.join(dir, PLUGIN, 'README.md'), '# Short\n\nToo short.'), /≥40 words/);
  expectProblem((dir) => {
    fs.rmSync(path.join(dir, PLUGIN, 'LICENSE'));
    editJson(path.join(dir, PLUGIN, '.claude-plugin/plugin.json'), (d) => { delete d.license; });
  }, /LICENSE missing|missing license/);
  expectProblem((dir) => fs.symlinkSync('/etc/hosts', path.join(dir, PLUGIN, 'link.md')), /symlinks/);
});

test('rejects manifest drift between platforms and marketplaces', () => {
  expectProblem((dir) => editJson(path.join(dir, PLUGIN, 'plugin.json'), (d) => { d.version = '9.9.9'; }), /version must match/);
  expectProblem((dir) => editJson(path.join(dir, '.claude-plugin/marketplace.json'), (d) => { d.plugins[0].name = 'other'; }), /entry other != plugin name/);
  expectProblem((dir) => editJson(path.join(dir, PLUGIN, 'plugin.json'), (d) => {
    d.extensions['com.openai'].interface.capabilities = ['Read', 'Write'];
  }), /capabilities/);
  expectProblem((dir) => editJson(path.join(dir, PLUGIN, 'plugin.json'), (d) => {
    d.extensions['com.openai'].interface.shortDescription = 'x'.repeat(31);
  }), /shortDescription: 31 > 30/);
});

test('rejects non-square or missing icons', () => {
  expectProblem((dir) => fs.copyFileSync(path.join(ROOT, 'assets/github-social-preview.png'), path.join(dir, PLUGIN, 'assets/icon.png')), /square PNG/);
  expectProblem((dir) => fs.rmSync(path.join(dir, PLUGIN, 'assets/logo.png')), /logo\.png missing/);
});

test('the npm wrapper package does not ship the plugin folder', () => {
  const out = execFileSync('npm', ['pack', '--dry-run', '--json'], { cwd: ROOT, encoding: 'utf8' });
  const files = JSON.parse(out)[0].files.map((f) => f.path);
  assert.ok(files.includes('bin/fda-data-mcp.js'));
  assert.ok(!files.some((f) => f.startsWith('plugins/') || f.startsWith('.claude-plugin/') || f.startsWith('.agents/')));
});
