#!/usr/bin/env node
'use strict';

// Validates the ChatGPT + Claude plugin package against the platform rules we
// can check offline (manifests, MCP config, skills, directory file checks).
// Usage: node scripts/validate-plugins.js [repoRoot]

const fs = require('node:fs');
const path = require('node:path');

const HOSTED_MCP_URL = 'https://www.regdatalab.com/mcp';
const WRITE_TOOLS = ['fda_save_aliases', 'fda_link_subsidiaries'];
const SECRET_PATTERNS = [
  /\bfda_(?=[A-Za-z0-9_-]*[A-Z0-9])[A-Za-z0-9_-]{40,}/, // RegDataLab API key (43 random base64url chars; tool names are lowercase)
  /rdl_(at|rt|ac)_[A-Za-z0-9_-]{10,}/, // OAuth tokens/codes
  /sk_(live|test)_[A-Za-z0-9]{10,}/,
  /apiKey=/i,
  /Bearer\s+[A-Za-z0-9._-]{12,}/,
];
const MAX_TEXT_BYTES = 256 * 1024;
const MAX_FILES = 512;

function readJson(file, errors) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    errors.push(`${file}: invalid or missing JSON (${error.message})`);
    return null;
  }
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) out.push({ full, symlink: true });
    else if (entry.isDirectory()) out.push(...walk(full));
    else out.push({ full, symlink: false });
  }
  return out;
}

function pngSize(file) {
  const buf = fs.readFileSync(file);
  if (buf.length < 24 || buf.toString('ascii', 1, 4) !== 'PNG') return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function frontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return null;
  const fields = {};
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (kv) fields[kv[1]] = kv[2];
  }
  return fields;
}

function wordCountOutsideCode(markdown) {
  return markdown.replace(/```[\s\S]*?```/g, ' ').split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
}

function validatePlugin(pluginDir, connectorTools) {
  const errors = [];
  const rel = (f) => path.relative(pluginDir, f);

  // ---- Claude manifest ----------------------------------------------------
  const claude = readJson(path.join(pluginDir, '.claude-plugin', 'plugin.json'), errors);
  if (claude) {
    if (!/^[a-z0-9]([a-z0-9-]{0,62}[a-z0-9])?$/.test(claude.name || '')) errors.push('claude plugin.json: name must be lowercase kebab-case ≤64 chars');
    if (['claude', 'anthropic', 'official', 'plugin', 'mcp', 'test'].includes(claude.name)) errors.push('claude plugin.json: reserved name');
    if (!/^\d+\.\d+\.\d+$/.test(claude.version || '')) errors.push('claude plugin.json: version must be semver');
    for (const field of ['description', 'author', 'license']) if (!claude[field]) errors.push(`claude plugin.json: missing ${field}`);
  }

  // ---- Claude MCP config --------------------------------------------------
  const claudeMcp = readJson(path.join(pluginDir, '.mcp.json'), errors);
  if (claudeMcp) {
    const servers = Object.entries(claudeMcp.mcpServers || {});
    if (servers.length !== 1) errors.push('.mcp.json: exactly one MCP server expected');
    for (const [name, server] of servers) {
      if (server.type !== 'http') errors.push(`.mcp.json ${name}: type must be "http"`);
      if (server.url !== HOSTED_MCP_URL) errors.push(`.mcp.json ${name}: url must be ${HOSTED_MCP_URL}`);
      if (server.headers || server.command || server.env) errors.push(`.mcp.json ${name}: no headers/command/env (credentials come from OAuth)`);
    }
  }

  // ---- OpenAI manifest + MCP config ---------------------------------------
  const openai = readJson(path.join(pluginDir, 'plugin.json'), errors);
  if (openai) {
    if (openai.$schema !== 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json') errors.push('plugin.json: $schema must be the agent-plugins 1.0.0 schema');
    if (claude && openai.name !== claude.name) errors.push('plugin.json: name must match .claude-plugin/plugin.json');
    if (claude && openai.version !== claude.version) errors.push('plugin.json: version must match .claude-plugin/plugin.json');
    const ext = openai.extensions && openai.extensions['com.openai'];
    const ui = ext && ext.interface;
    if (!ui) {
      errors.push('plugin.json: missing extensions.com.openai.interface');
    } else {
      const limits = { displayName: 30, shortDescription: 30, longDescription: 4000, developerName: 80 };
      for (const [field, max] of Object.entries(limits)) {
        if (typeof ui[field] !== 'string' || ui[field].length === 0) errors.push(`plugin.json interface.${field}: required`);
        else if (ui[field].length > max) errors.push(`plugin.json interface.${field}: ${ui[field].length} > ${max} chars`);
      }
      for (const field of ['websiteURL', 'privacyPolicyURL', 'termsOfServiceURL']) {
        if (!/^https:\/\//.test(ui[field] || '') || ui[field].length > 1024) errors.push(`plugin.json interface.${field}: HTTPS URL ≤1024 chars required`);
      }
      if (JSON.stringify(ui.capabilities) !== JSON.stringify(['Read'])) errors.push('plugin.json interface.capabilities: must be ["Read"] (read-only tools)');
      for (const field of ['composerIcon', 'logo']) {
        const p = ui[field];
        if (typeof p !== 'string' || !p.startsWith('./')) { errors.push(`plugin.json interface.${field}: ./relative path required`); continue; }
        const file = path.join(pluginDir, p);
        if (!fs.existsSync(file)) { errors.push(`plugin.json interface.${field}: ${p} missing`); continue; }
        const size = pngSize(file);
        if (!size || size.width !== size.height || size.width < 48 || size.width > 4096) errors.push(`${p}: must be a square PNG 48–4096 px`);
      }
    }
    if (ext && ext.apps && !fs.existsSync(path.join(pluginDir, ext.apps))) errors.push(`plugin.json: apps file ${ext.apps} missing`);
  }
  const openaiMcp = readJson(path.join(pluginDir, 'mcp.json'), errors);
  if (openaiMcp) {
    const servers = Object.entries(openaiMcp.mcpServers || {});
    if (servers.length !== 1) errors.push('mcp.json: exactly one MCP server per plugin (OpenAI rule)');
    for (const [name, server] of servers) {
      if (server.type !== 'streamable-http') errors.push(`mcp.json ${name}: type must be "streamable-http"`);
      if (server.url !== HOSTED_MCP_URL) errors.push(`mcp.json ${name}: url must be ${HOSTED_MCP_URL}`);
      if (server.headers || server.command || server.env) errors.push(`mcp.json ${name}: no headers/command/env`);
    }
  }

  // ---- Skills ---------------------------------------------------------------
  const skillsDir = path.join(pluginDir, 'skills');
  const skillDirs = fs.existsSync(skillsDir) ? fs.readdirSync(skillsDir).filter((d) => fs.statSync(path.join(skillsDir, d)).isDirectory()) : [];
  if (skillDirs.length === 0) errors.push('skills/: at least one skill expected');
  for (const dir of skillDirs) {
    const file = path.join(skillsDir, dir, 'SKILL.md');
    if (!fs.existsSync(file)) { errors.push(`skills/${dir}: missing SKILL.md`); continue; }
    const text = fs.readFileSync(file, 'utf8');
    const fm = frontmatter(text);
    if (!fm) { errors.push(`skills/${dir}/SKILL.md: missing YAML front matter`); continue; }
    if (fm.name !== dir) errors.push(`skills/${dir}/SKILL.md: name "${fm.name}" must equal folder name`);
    if (!fm.description || fm.description.length < 40) errors.push(`skills/${dir}/SKILL.md: description must be a single-line string ≥40 chars`);
    const referenced = new Set(text.match(/\bfda_[a-z0-9_]+\b/g) || []);
    for (const tool of referenced) {
      if (WRITE_TOOLS.includes(tool)) errors.push(`skills/${dir}: references write tool ${tool}`);
      else if (connectorTools && !connectorTools.includes(tool)) errors.push(`skills/${dir}: references unknown tool ${tool}`);
    }
  }

  // ---- Directory file checks -----------------------------------------------
  if (fs.existsSync(path.join(pluginDir, 'bin'))) errors.push('bin/ at plugin root blocks claude.ai/Cowork install');
  const readme = path.join(pluginDir, 'README.md');
  if (!fs.existsSync(readme)) errors.push('README.md missing');
  else if (wordCountOutsideCode(fs.readFileSync(readme, 'utf8')) < 40) errors.push('README.md: ≥40 words outside code blocks required');
  if (!fs.existsSync(path.join(pluginDir, 'LICENSE')) && !(claude && claude.license)) errors.push('LICENSE missing');
  const files = walk(pluginDir);
  if (files.length > MAX_FILES) errors.push(`plugin has ${files.length} files (> ${MAX_FILES})`);
  for (const { full, symlink } of files) {
    const name = path.basename(full);
    if (symlink) errors.push(`${rel(full)}: symlinks are not allowed`);
    if (['.DS_Store', 'Thumbs.db', 'desktop.ini'].includes(name) || full.includes('__MACOSX')) errors.push(`${rel(full)}: OS metadata file`);
    if (/\.(npmrc|mcpb|dxt|zip|pdf|ico)$/.test(name)) errors.push(`${rel(full)}: file type not allowed in plugin`);
    if (/\.(png|jpe?g|gif|webp)$/i.test(name)) continue;
    const stat = fs.statSync(full);
    if (stat.size > MAX_TEXT_BYTES) errors.push(`${rel(full)}: ${stat.size} bytes > 256 KiB`);
    const text = fs.readFileSync(full, 'utf8');
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(text)) errors.push(`${rel(full)}: looks like it contains a credential (${pattern})`);
    }
  }
  return errors;
}

function validateRepo(root) {
  const errors = [];
  const connectorTools = readJson(path.join(root, 'scripts', 'connector-tools.json'), errors);
  const toolList = connectorTools ? connectorTools.tools : null;
  const claudeMarket = readJson(path.join(root, '.claude-plugin', 'marketplace.json'), errors);
  const openaiMarket = readJson(path.join(root, '.agents', 'plugins', 'marketplace.json'), errors);
  const pluginDirs = new Set();
  for (const entry of (claudeMarket && claudeMarket.plugins) || []) {
    const dir = path.join(root, entry.source);
    pluginDirs.add(dir);
    const manifest = readJson(path.join(dir, '.claude-plugin', 'plugin.json'), errors);
    if (manifest && manifest.name !== entry.name) errors.push(`claude marketplace: entry ${entry.name} != plugin name ${manifest.name}`);
    if (manifest && entry.version && manifest.version !== entry.version) errors.push(`claude marketplace: ${entry.name} version ${entry.version} != ${manifest.version}`);
  }
  for (const entry of (openaiMarket && openaiMarket.plugins) || []) {
    if (!entry.source || entry.source.source !== 'local') { errors.push(`openai marketplace: ${entry.name} must use a local source`); continue; }
    const dir = path.join(root, entry.source.path);
    pluginDirs.add(dir);
    const manifest = readJson(path.join(dir, 'plugin.json'), errors);
    if (manifest && manifest.name !== entry.name) errors.push(`openai marketplace: entry ${entry.name} != plugin name ${manifest.name}`);
    if (!['AVAILABLE', 'INSTALLED_BY_DEFAULT', 'NOT_AVAILABLE'].includes(entry.policy && entry.policy.installation)) errors.push(`openai marketplace: ${entry.name} policy.installation invalid`);
    if (!['ON_INSTALL', 'ON_FIRST_USE'].includes(entry.policy && entry.policy.authentication)) errors.push(`openai marketplace: ${entry.name} policy.authentication invalid`);
  }
  if (pluginDirs.size === 0) errors.push('no plugins listed in marketplaces');
  for (const dir of pluginDirs) {
    for (const e of validatePlugin(dir, toolList)) errors.push(`${path.relative(root, dir)}: ${e}`);
  }
  return errors;
}

module.exports = { validatePlugin, validateRepo, HOSTED_MCP_URL };

if (require.main === module) {
  const root = path.resolve(process.argv[2] || path.join(__dirname, '..'));
  const errors = validateRepo(root);
  if (errors.length > 0) {
    console.error(`✖ ${errors.length} problem(s):\n${errors.map((e) => `  - ${e}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✔ Plugin packages valid');
}
