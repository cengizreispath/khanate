# Khanate Project Structure

## Directory Layout

```
/root/khanate/worlds/{world}/environments/{env}/projects/{project}/
├── agents/              # Agent configurations (AGENT.md files)
├── agents-registry.json # Active agent instances
├── memory/              # Project-level memory files
├── PROJECT.md           # Project metadata and description
├── repo/                # Project source code repository
└── workflows/           # Workflow definitions
```

## For Agents

When working on a project, the source code is always at:
```
{project_path}/repo/
```

Example:
- Project: dragoman
- Repo path: `/root/khanate/worlds/path/environments/project-division/projects/dragoman/repo/`

Always `cd` into the `repo/` folder before running git commands or editing code.
