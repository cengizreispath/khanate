#!/usr/bin/env python3
"""
Khanate Hierarchical Memory System

World → Environment → Project → Agent memory inheritance
"""

import os
import json
import yaml
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

def get_data_dir():
    """Get data directory from env or default"""
    data_dir = os.environ.get("KHANATE_DATA_DIR", "/root/khanate")
    return Path(data_dir)

WORLDS_DIR = get_data_dir() / "worlds"

class MemorySystem:
    def __init__(self, worlds_dir: Path = None):
        self.worlds_dir = worlds_dir or get_data_dir() / "worlds"
    
    # =========== WORLD ===========
    
    def list_worlds(self) -> List[str]:
        """List all worlds"""
        if not self.worlds_dir.exists():
            return []
        return [d.name for d in self.worlds_dir.iterdir() if d.is_dir()]
    
    def get_world(self, world_id: str) -> Optional[Dict]:
        """Get world details"""
        world_path = self.worlds_dir / world_id
        if not world_path.exists():
            return None
        return self._read_entity(world_path, "WORLD.md")
    
    def create_world(self, world_id: str, name: str, content: str = "") -> Dict:
        """Create a new world"""
        world_path = self.worlds_dir / world_id
        world_path.mkdir(parents=True, exist_ok=True)
        (world_path / "memory").mkdir(exist_ok=True)
        (world_path / "environments").mkdir(exist_ok=True)
        
        world_md = f"""---
type: world
id: {world_id}
name: {name}
created: {datetime.now().isoformat()}
---

# World: {name}

{content}
"""
        (world_path / "WORLD.md").write_text(world_md)
        return {"id": world_id, "name": name, "path": str(world_path)}
    
    def update_world(self, world_id: str, name: str = None, description: str = None, metadata: Dict = None) -> Dict:
        """Update world details"""
        world_path = self.worlds_dir / world_id
        world_file = world_path / "WORLD.md"
        
        if not world_file.exists():
            return {"success": False, "error": "World not found"}
        
        existing = self._read_entity(world_path, "WORLD.md")
        existing_meta = existing.get("metadata", {})
        
        if name:
            existing_meta["name"] = name
        if description:
            existing_meta["description"] = description
        if metadata:
            existing_meta.update(metadata)
        existing_meta["updated"] = datetime.now().isoformat()
        
        yaml_header = yaml.dump(existing_meta, default_flow_style=False, allow_unicode=True)
        content = existing.get("content", "")
        
        world_md = f"""---
{yaml_header}---

# World: {existing_meta.get('name', world_id)}

{existing_meta.get('description', '')}

{content}
"""
        world_file.write_text(world_md)
        return {"id": world_id, "updated": True}
    
    def delete_world(self, world_id: str) -> Dict:
        """Delete a world"""
        import shutil
        world_path = self.worlds_dir / world_id
        
        if not world_path.exists():
            return {"success": False, "error": "World not found"}
        
        shutil.rmtree(world_path)
        return {"id": world_id, "deleted": True}
    
    def update_world_content(self, world_id: str, content: str) -> Dict:
        """Update world markdown content"""
        world_path = self.worlds_dir / world_id
        world_file = world_path / "WORLD.md"
        
        if not world_file.exists():
            return {"success": False, "error": "World not found"}
        
        existing = self._read_entity(world_path, "WORLD.md")
        existing_meta = existing.get("metadata", {})
        existing_meta["updated"] = datetime.now().isoformat()
        
        yaml_header = yaml.dump(existing_meta, default_flow_style=False, allow_unicode=True)
        world_md = f"""---
{yaml_header}---

{content}
"""
        world_file.write_text(world_md)
        return {"id": world_id, "updated": True}
    
    # =========== ENVIRONMENT ===========
    
    def list_environments(self, world_id: str) -> List[str]:
        """List environments in a world"""
        env_path = self.worlds_dir / world_id / "environments"
        if not env_path.exists():
            return []
        return [d.name for d in env_path.iterdir() if d.is_dir()]
    
    def get_environment(self, world_id: str, env_id: str) -> Optional[Dict]:
        """Get environment details"""
        env_path = self.worlds_dir / world_id / "environments" / env_id
        if not env_path.exists():
            return None
        return self._read_entity(env_path, "ENV.md")
    
    def create_environment(self, world_id: str, env_id: str, name: str, content: str = "") -> Dict:
        """Create a new environment"""
        env_path = self.worlds_dir / world_id / "environments" / env_id
        env_path.mkdir(parents=True, exist_ok=True)
        (env_path / "memory").mkdir(exist_ok=True)
        (env_path / "projects").mkdir(exist_ok=True)
        
        env_md = f"""---
type: environment
id: {env_id}
name: {name}
world: {world_id}
created: {datetime.now().isoformat()}
---

# Environment: {name}

{content}
"""
        (env_path / "ENV.md").write_text(env_md)
        return {"id": env_id, "name": name, "world": world_id, "path": str(env_path)}
    
    def update_environment(self, world_id: str, env_id: str, name: str = None, description: str = None, metadata: Dict = None) -> Dict:
        """Update environment details"""
        env_path = self.worlds_dir / world_id / "environments" / env_id
        env_file = env_path / "ENV.md"
        
        if not env_file.exists():
            return {"success": False, "error": "Environment not found"}
        
        existing = self._read_entity(env_path, "ENV.md")
        existing_meta = existing.get("metadata", {})
        
        if name:
            existing_meta["name"] = name
        if description:
            existing_meta["description"] = description
        if metadata:
            existing_meta.update(metadata)
        existing_meta["updated"] = datetime.now().isoformat()
        
        yaml_header = yaml.dump(existing_meta, default_flow_style=False, allow_unicode=True)
        content = existing.get("content", "")
        
        env_md = f"""---
{yaml_header}---

# Environment: {existing_meta.get('name', env_id)}

{existing_meta.get('description', '')}

{content}
"""
        env_file.write_text(env_md)
        return {"id": env_id, "updated": True}
    
    def delete_environment(self, world_id: str, env_id: str) -> Dict:
        """Delete an environment"""
        import shutil
        env_path = self.worlds_dir / world_id / "environments" / env_id
        
        if not env_path.exists():
            return {"success": False, "error": "Environment not found"}
        
        shutil.rmtree(env_path)
        return {"id": env_id, "deleted": True}
    
    def update_environment_content(self, world_id: str, env_id: str, content: str) -> Dict:
        """Update environment markdown content"""
        env_path = self.worlds_dir / world_id / "environments" / env_id
        env_file = env_path / "ENV.md"
        
        if not env_file.exists():
            return {"success": False, "error": "Environment not found"}
        
        existing = self._read_entity(env_path, "ENV.md")
        existing_meta = existing.get("metadata", {})
        existing_meta["updated"] = datetime.now().isoformat()
        
        yaml_header = yaml.dump(existing_meta, default_flow_style=False, allow_unicode=True)
        env_md = f"""---
{yaml_header}---

{content}
"""
        env_file.write_text(env_md)
        return {"id": env_id, "updated": True}
    
    # =========== PROJECT ===========
    
    def list_projects(self, world_id: str, env_id: str) -> List[str]:
        """List projects in an environment"""
        proj_path = self.worlds_dir / world_id / "environments" / env_id / "projects"
        if not proj_path.exists():
            return []
        return [d.name for d in proj_path.iterdir() if d.is_dir()]
    
    def get_project(self, world_id: str, env_id: str, project_id: str) -> Optional[Dict]:
        """Get project details"""
        proj_path = self.worlds_dir / world_id / "environments" / env_id / "projects" / project_id
        if not proj_path.exists():
            return None
        return self._read_entity(proj_path, "PROJECT.md")
    
    def create_project(self, world_id: str, env_id: str, project_id: str, name: str, content: str = "") -> Dict:
        """Create a new project"""
        proj_path = self.worlds_dir / world_id / "environments" / env_id / "projects" / project_id
        proj_path.mkdir(parents=True, exist_ok=True)
        (proj_path / "memory").mkdir(exist_ok=True)
        (proj_path / "agents").mkdir(exist_ok=True)
        (proj_path / "workflows").mkdir(exist_ok=True)
        
        proj_md = f"""---
type: project
id: {project_id}
name: {name}
environment: {env_id}
world: {world_id}
created: {datetime.now().isoformat()}
status: active
---

# Project: {name}

{content}
"""
        (proj_path / "PROJECT.md").write_text(proj_md)
        return {"id": project_id, "name": name, "environment": env_id, "world": world_id, "path": str(proj_path)}
    
    def update_project(self, world_id: str, env_id: str, project_id: str, 
                       name: str = None, description: str = None, metadata: Dict = None) -> Dict:
        """Update project details"""
        proj_path = self.worlds_dir / world_id / "environments" / env_id / "projects" / project_id
        proj_file = proj_path / "PROJECT.md"
        
        if not proj_file.exists():
            return {"success": False, "error": "Project not found"}
        
        # Read existing
        existing = self._read_entity(proj_path, "PROJECT.md")
        existing_meta = existing.get("metadata", {})
        
        # Update metadata
        if name:
            existing_meta["name"] = name
        if description:
            existing_meta["description"] = description
        if metadata:
            existing_meta.update(metadata)
        existing_meta["updated"] = datetime.now().isoformat()
        
        # Write updated file
        yaml_header = yaml.dump(existing_meta, default_flow_style=False, allow_unicode=True)
        content = existing.get("content", "")
        
        proj_md = f"""---
{yaml_header}---

# Project: {existing_meta.get('name', project_id)}

{existing_meta.get('description', '')}

{content}
"""
        proj_file.write_text(proj_md)
        return {"id": project_id, "updated": True}
    
    def delete_project(self, world_id: str, env_id: str, project_id: str) -> Dict:
        """Delete a project"""
        import shutil
        proj_path = self.worlds_dir / world_id / "environments" / env_id / "projects" / project_id
        
        if not proj_path.exists():
            return {"success": False, "error": "Project not found"}
        
        shutil.rmtree(proj_path)
        return {"id": project_id, "deleted": True}
    
    def update_project_content(self, world_id: str, env_id: str, project_id: str, content: str) -> Dict:
        """Update project markdown content"""
        proj_path = self.worlds_dir / world_id / "environments" / env_id / "projects" / project_id
        proj_file = proj_path / "PROJECT.md"
        
        if not proj_file.exists():
            return {"success": False, "error": "Project not found"}
        
        # Read existing metadata
        existing = self._read_entity(proj_path, "PROJECT.md")
        existing_meta = existing.get("metadata", {})
        existing_meta["updated"] = datetime.now().isoformat()
        
        # Write with new content
        yaml_header = yaml.dump(existing_meta, default_flow_style=False, allow_unicode=True)
        proj_md = f"""---
{yaml_header}---

{content}
"""
        proj_file.write_text(proj_md)
        return {"id": project_id, "updated": True}
    
    def list_memory_files(self, world_id: str, env_id: str, project_id: str) -> List[Dict]:
        """List memory files for a project"""
        memory_path = self.worlds_dir / world_id / "environments" / env_id / "projects" / project_id / "memory"
        if not memory_path.exists():
            return []
        
        files = []
        for f in sorted(memory_path.iterdir(), reverse=True):
            if f.is_file() and f.suffix == '.md':
                files.append({
                    "name": f.name,
                    "date": f.stem,
                    "size": f.stat().st_size
                })
        return files
    
    def get_memory_file(self, world_id: str, env_id: str, project_id: str, filename: str) -> str:
        """Get memory file content"""
        memory_file = self.worlds_dir / world_id / "environments" / env_id / "projects" / project_id / "memory" / filename
        if not memory_file.exists():
            return ""
        return memory_file.read_text()
    
    def set_memory_file(self, world_id: str, env_id: str, project_id: str, filename: str, content: str) -> Dict:
        """Set memory file content"""
        memory_path = self.worlds_dir / world_id / "environments" / env_id / "projects" / project_id / "memory"
        memory_path.mkdir(exist_ok=True)
        memory_file = memory_path / filename
        memory_file.write_text(content)
        return {"filename": filename, "updated": True}
    
    def _get_entity_memory_path(self, entity_type: str, world_id: str, env_id: str = None, project_id: str = None) -> Path:
        """Get memory path for any entity type"""
        if entity_type == "world":
            return self.worlds_dir / world_id / "memory"
        elif entity_type == "environment":
            return self.worlds_dir / world_id / "environments" / env_id / "memory"
        elif entity_type == "project":
            return self.worlds_dir / world_id / "environments" / env_id / "projects" / project_id / "memory"
        return None
    
    def list_memory_files_generic(self, entity_type: str, world_id: str, env_id: str = None, project_id: str = None) -> List[Dict]:
        """List memory files for any entity type"""
        memory_path = self._get_entity_memory_path(entity_type, world_id, env_id, project_id)
        if not memory_path or not memory_path.exists():
            return []
        
        files = []
        for f in sorted(memory_path.iterdir(), reverse=True):
            if f.is_file() and f.suffix == '.md':
                files.append({
                    "name": f.name,
                    "date": f.stem,
                    "size": f.stat().st_size
                })
        return files
    
    def get_memory_file_generic(self, entity_type: str, filename: str, world_id: str, env_id: str = None, project_id: str = None) -> str:
        """Get memory file content for any entity type"""
        memory_path = self._get_entity_memory_path(entity_type, world_id, env_id, project_id)
        if not memory_path:
            return ""
        memory_file = memory_path / filename
        if not memory_file.exists():
            return ""
        return memory_file.read_text()
    
    def set_memory_file_generic(self, entity_type: str, filename: str, content: str, world_id: str, env_id: str = None, project_id: str = None) -> Dict:
        """Set memory file content for any entity type"""
        memory_path = self._get_entity_memory_path(entity_type, world_id, env_id, project_id)
        if not memory_path:
            return {"success": False, "error": "Invalid entity type"}
        memory_path.mkdir(exist_ok=True)
        memory_file = memory_path / filename
        memory_file.write_text(content)
        return {"filename": filename, "updated": True}
    
    # =========== AGENT ===========
    
    def list_agents(self, world_id: str, env_id: str, project_id: str) -> List[str]:
        """List agents in a project"""
        agent_path = self.worlds_dir / world_id / "environments" / env_id / "projects" / project_id / "agents"
        if not agent_path.exists():
            return []
        return [d.name for d in agent_path.iterdir() if d.is_dir()]
    
    def get_agent(self, world_id: str, env_id: str, project_id: str, agent_id: str) -> Optional[Dict]:
        """Get agent details"""
        agent_path = self.worlds_dir / world_id / "environments" / env_id / "projects" / project_id / "agents" / agent_id
        if not agent_path.exists():
            return None
        return self._read_entity(agent_path, "AGENT.md")
    
    def delete_agent(self, world_id: str, env_id: str, project_id: str, agent_id: str) -> Dict:
        """Delete an agent and its directory"""
        import shutil
        agent_path = self.worlds_dir / world_id / "environments" / env_id / "projects" / project_id / "agents" / agent_id
        
        if not agent_path.exists():
            return {"success": False, "error": "Agent not found"}
        
        shutil.rmtree(agent_path)
        return {"id": agent_id, "deleted": True}
    
    def create_agent(self, world_id: str, env_id: str, project_id: str, agent_id: str, 
                     name: str, role: str, model: str = "claude-sonnet-4-5", 
                     skills: List[str] = None, soul: str = "") -> Dict:
        """Create a new agent"""
        agent_path = self.worlds_dir / world_id / "environments" / env_id / "projects" / project_id / "agents" / agent_id
        agent_path.mkdir(parents=True, exist_ok=True)
        (agent_path / "memory").mkdir(exist_ok=True)
        
        skills = skills or []
        skills_yaml = "\n".join([f"  - {s}" for s in skills]) if skills else "  []"
        
        agent_md = f"""---
type: agent
id: {agent_id}
name: {name}
role: {role}
project: {project_id}
environment: {env_id}
world: {world_id}
model: {model}
skills:
{skills_yaml}
created: {datetime.now().isoformat()}
status: stopped
---

# Agent: {name}

## Soul
{soul if soul else f"Sen {project_id} projesinin {role} rolünde bir agent'sın."}

## Görevler
- (Tanımlanacak)

## Kısıtlamalar
- (Tanımlanacak)
"""
        (agent_path / "AGENT.md").write_text(agent_md)
        return {
            "id": agent_id, 
            "name": name, 
            "role": role,
            "project": project_id, 
            "environment": env_id, 
            "world": world_id,
            "path": str(agent_path)
        }
    
    # =========== CONTEXT BUILDER ===========
    
    def build_agent_context(self, world_id: str, env_id: str, project_id: str, agent_id: str, 
                            memory_days: int = 3) -> str:
        """Build full context for an agent by inheriting from all levels"""
        context_parts = []
        
        # 1. World context
        world_path = self.worlds_dir / world_id
        if (world_path / "WORLD.md").exists():
            context_parts.append(f"# WORLD CONTEXT\n\n{(world_path / 'WORLD.md').read_text()}")
            context_parts.append(self._read_recent_memories(world_path / "memory", memory_days))
        
        # 2. Environment context
        env_path = world_path / "environments" / env_id
        if (env_path / "ENV.md").exists():
            context_parts.append(f"# ENVIRONMENT CONTEXT\n\n{(env_path / 'ENV.md').read_text()}")
            context_parts.append(self._read_recent_memories(env_path / "memory", memory_days))
        
        # 3. Project context
        proj_path = env_path / "projects" / project_id
        if (proj_path / "PROJECT.md").exists():
            context_parts.append(f"# PROJECT CONTEXT\n\n{(proj_path / 'PROJECT.md').read_text()}")
            context_parts.append(self._read_recent_memories(proj_path / "memory", memory_days))
        
        # 4. Agent context
        agent_path = proj_path / "agents" / agent_id
        if (agent_path / "AGENT.md").exists():
            context_parts.append(f"# AGENT CONTEXT\n\n{(agent_path / 'AGENT.md').read_text()}")
            context_parts.append(self._read_recent_memories(agent_path / "memory", memory_days))
        
        # Filter empty parts and join
        context_parts = [p for p in context_parts if p.strip()]
        return "\n\n---\n\n".join(context_parts)
    
    # =========== MEMORY OPERATIONS ===========
    
    def add_memory(self, path: Path, content: str, date: datetime = None) -> str:
        """Add a memory entry to a level's memory folder"""
        date = date or datetime.now()
        memory_dir = path / "memory"
        memory_dir.mkdir(exist_ok=True)
        
        memory_file = memory_dir / f"{date.strftime('%Y-%m-%d')}.md"
        
        timestamp = date.strftime("%H:%M")
        entry = f"\n## [{timestamp}]\n{content}\n"
        
        if memory_file.exists():
            with open(memory_file, "a") as f:
                f.write(entry)
        else:
            with open(memory_file, "w") as f:
                f.write(f"# {date.strftime('%Y-%m-%d')} - Memory Log\n{entry}")
        
        return str(memory_file)
    
    # =========== HELPERS ===========
    
    def _read_entity(self, path: Path, filename: str) -> Dict:
        """Read and parse an entity file (WORLD.md, ENV.md, etc.)"""
        file_path = path / filename
        if not file_path.exists():
            return {"path": str(path), "exists": False}
        
        content = file_path.read_text()
        
        # Parse YAML frontmatter
        metadata = {}
        if content.startswith("---"):
            parts = content.split("---", 2)
            if len(parts) >= 3:
                try:
                    metadata = yaml.safe_load(parts[1])
                    # Convert datetime objects to strings for JSON serialization
                    metadata = self._serialize_metadata(metadata)
                except:
                    pass
                content = parts[2].strip()
        
        return {
            "path": str(path),
            "exists": True,
            "metadata": metadata,
            "content": content
        }
    
    def _serialize_metadata(self, data: Any) -> Any:
        """Convert datetime objects to ISO strings for JSON serialization"""
        if isinstance(data, dict):
            return {k: self._serialize_metadata(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self._serialize_metadata(v) for v in data]
        elif isinstance(data, (datetime,)):
            return data.isoformat()
        elif hasattr(data, 'isoformat'):  # date objects
            return data.isoformat()
        return data
    
    def _read_recent_memories(self, memory_dir: Path, days: int = 3) -> str:
        """Read recent memory files"""
        if not memory_dir.exists():
            return ""
        
        memories = []
        for i in range(days):
            date = datetime.now() - timedelta(days=i)
            memory_file = memory_dir / f"{date.strftime('%Y-%m-%d')}.md"
            if memory_file.exists():
                memories.append(memory_file.read_text())
        
        if not memories:
            return ""
        
        return "# RECENT MEMORIES\n\n" + "\n\n".join(memories)


# =========== CLI ===========

if __name__ == "__main__":
    import sys
    
    ms = MemorySystem()
    
    if len(sys.argv) < 2:
        print("Usage: memory_system.py <command> [args]")
        print("Commands: list-worlds, create-world, build-context, ...")
        sys.exit(1)
    
    cmd = sys.argv[1]
    
    if cmd == "list-worlds":
        print(json.dumps(ms.list_worlds(), indent=2))
    
    elif cmd == "create-world" and len(sys.argv) >= 4:
        world_id, name = sys.argv[2], sys.argv[3]
        result = ms.create_world(world_id, name)
        print(json.dumps(result, indent=2))
    
    elif cmd == "build-context" and len(sys.argv) >= 6:
        world_id, env_id, project_id, agent_id = sys.argv[2:6]
        context = ms.build_agent_context(world_id, env_id, project_id, agent_id)
        print(context)
    
    else:
        print(f"Unknown command or missing args: {cmd}")
        sys.exit(1)
