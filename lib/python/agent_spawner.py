#!/usr/bin/env python3
"""
Khanate Agent Spawner

Manages agent lifecycle: spawn, monitor, stop
Uses Clawdbot sessions_spawn for running agents
"""

import os
import json
import yaml
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, asdict
from enum import Enum

from memory_system import MemorySystem, get_data_dir

KHANATE_DIR = get_data_dir()
REGISTRY_FILE = KHANATE_DIR / "registry" / "agents.json"
WORLDS_DIR = KHANATE_DIR / "worlds"


class AgentStatus(Enum):
    STOPPED = "stopped"
    STARTING = "starting"
    RUNNING = "running"
    ERROR = "error"


@dataclass
class AgentInstance:
    """Represents a running or configured agent"""
    id: str
    name: str
    role: str
    world_id: str
    env_id: str
    project_id: str
    agent_id: str
    model: str
    status: str
    session_key: Optional[str] = None
    started_at: Optional[str] = None
    last_activity: Optional[str] = None
    error: Optional[str] = None
    
    def to_dict(self) -> Dict:
        return asdict(self)


class AgentRegistry:
    """Tracks all agent instances"""
    
    def __init__(self, registry_file: Path = REGISTRY_FILE):
        self.registry_file = registry_file
        self.registry_file.parent.mkdir(parents=True, exist_ok=True)
        self._load()
    
    def _load(self):
        if self.registry_file.exists():
            try:
                with open(self.registry_file) as f:
                    data = json.load(f)
                    agents_data = data.get("agents", {})
                    # Handle both dict and list formats (backwards compat)
                    if isinstance(agents_data, dict):
                        self.agents = {k: AgentInstance(**v) for k, v in agents_data.items()}
                    else:
                        self.agents = {}  # Reset if wrong format
            except Exception:
                self.agents = {}
        else:
            self.agents = {}
    
    def _save(self):
        data = {
            "updated_at": datetime.now().isoformat(),
            "agents": {k: v.to_dict() for k, v in self.agents.items()}
        }
        with open(self.registry_file, "w") as f:
            json.dump(data, f, indent=2)
    
    def register(self, agent: AgentInstance) -> str:
        """Register an agent instance"""
        key = f"{agent.world_id}/{agent.env_id}/{agent.project_id}/{agent.agent_id}"
        self.agents[key] = agent
        self._save()
        return key
    
    def get(self, key: str) -> Optional[AgentInstance]:
        return self.agents.get(key)
    
    def get_by_path(self, world_id: str, env_id: str, project_id: str, agent_id: str) -> Optional[AgentInstance]:
        key = f"{world_id}/{env_id}/{project_id}/{agent_id}"
        return self.get(key)
    
    def list_all(self) -> List[AgentInstance]:
        return list(self.agents.values())
    
    def list_running(self) -> List[AgentInstance]:
        return [a for a in self.agents.values() if a.status == AgentStatus.RUNNING.value]
    
    def list_by_project(self, world_id: str, env_id: str, project_id: str) -> List[AgentInstance]:
        prefix = f"{world_id}/{env_id}/{project_id}/"
        return [a for a in self.agents.values() if f"{a.world_id}/{a.env_id}/{a.project_id}/" == prefix]
    
    def update_status(self, key: str, status: AgentStatus, error: str = None):
        if key in self.agents:
            self.agents[key].status = status.value
            self.agents[key].error = error
            if status == AgentStatus.RUNNING:
                self.agents[key].started_at = datetime.now().isoformat()
            self.agents[key].last_activity = datetime.now().isoformat()
            self._save()
    
    def remove(self, key: str):
        if key in self.agents:
            del self.agents[key]
            self._save()


class AgentSpawner:
    """Spawns and manages agent instances"""
    
    def __init__(self):
        self.memory = MemorySystem()
        self.registry = AgentRegistry()
    
    def load_agent_config(self, world_id: str, env_id: str, project_id: str, agent_id: str) -> Optional[Dict]:
        """Load agent configuration from AGENT.md"""
        agent_path = WORLDS_DIR / world_id / "environments" / env_id / "projects" / project_id / "agents" / agent_id
        agent_file = agent_path / "AGENT.md"
        
        if not agent_file.exists():
            return None
        
        content = agent_file.read_text()
        
        # Parse YAML frontmatter
        metadata = {}
        body = content
        if content.startswith("---"):
            parts = content.split("---", 2)
            if len(parts) >= 3:
                try:
                    metadata = yaml.safe_load(parts[1])
                except:
                    pass
                body = parts[2].strip()
        
        return {
            "path": str(agent_path),
            "metadata": metadata,
            "body": body
        }
    
    def build_agent_prompt(self, world_id: str, env_id: str, project_id: str, agent_id: str) -> str:
        """Build the full system prompt for an agent"""
        # Get inherited context
        context = self.memory.build_agent_context(world_id, env_id, project_id, agent_id)
        
        # Get agent config
        config = self.load_agent_config(world_id, env_id, project_id, agent_id)
        
        prompt = f"""# AGENT SYSTEM PROMPT

Sen "{config['metadata'].get('name', agent_id)}" adlı bir AI agent'sın.
Rol: {config['metadata'].get('role', 'assistant')}
Proje: {project_id}

## Bağlam (Context)

Aşağıdaki hiyerarşik bağlam sana ait:

{context}

## Görevin

Yukarıdaki bağlamı kullanarak görevlerini yerine getir.
Her zaman rol ve projeye uygun davran.
Üst seviyelerden gelen standartlara uy.

## Kısıtlamalar

- Sadece kendi projen kapsamında çalış
- Başka projelerin verilerine erişme
- Önemli kararları Orchestrator'a bildir
"""
        return prompt
    
    def create_agent_from_template(self, world_id: str, env_id: str, project_id: str, 
                                     agent_id: str, template_name: str) -> Dict:
        """Create an agent from template"""
        import shutil
        
        template_path = KHANATE_DIR / "templates" / "agents" / f"{template_name}.yaml"
        if not template_path.exists():
            return {"success": False, "error": f"Template '{template_name}' not found"}
        
        # Read template
        with open(template_path) as f:
            template = yaml.safe_load(f)
        
        # Create agent directory
        agent_path = WORLDS_DIR / world_id / "environments" / env_id / "projects" / project_id / "agents" / agent_id
        agent_path.mkdir(parents=True, exist_ok=True)
        (agent_path / "memory").mkdir(exist_ok=True)
        
        # Create AGENT.md
        agent_md = f"""---
type: agent
id: {agent_id}
name: {template.get('name', agent_id)}
role: {template.get('type', 'agent')}
model: {template.get('model', 'claude-sonnet-4')}
skills: {template.get('skills', [])}
created: {datetime.now().isoformat()}
---

# Agent: {template.get('name', agent_id)}

## Soul
{template.get('soul', 'AI assistant')}

## Skills
{', '.join(template.get('skills', []))}
"""
        (agent_path / "AGENT.md").write_text(agent_md)
        
        return {"success": True, "path": str(agent_path), "agent_id": agent_id}

    def spawn(self, world_id: str, env_id: str, project_id: str, agent_id: str, 
              task: str = None, template: str = None) -> Dict:
        """Spawn an agent instance"""
        
        # Load config (or create from template)
        config = self.load_agent_config(world_id, env_id, project_id, agent_id)
        if not config:
            if template:
                # Create agent from template
                result = self.create_agent_from_template(world_id, env_id, project_id, agent_id, template)
                if not result["success"]:
                    return result
                config = self.load_agent_config(world_id, env_id, project_id, agent_id)
            
            if not config:
                return {"success": False, "error": "Agent config not found. Provide a template."}
        
        metadata = config["metadata"]
        
        # Create agent instance
        instance = AgentInstance(
            id=f"{project_id}-{agent_id}",
            name=metadata.get("name", agent_id),
            role=metadata.get("role", "agent"),
            world_id=world_id,
            env_id=env_id,
            project_id=project_id,
            agent_id=agent_id,
            model=metadata.get("model", "claude-sonnet-4-5"),
            status=AgentStatus.STARTING.value
        )
        
        # Register
        key = self.registry.register(instance)
        
        # Build prompt
        system_prompt = self.build_agent_prompt(world_id, env_id, project_id, agent_id)
        
        # Create spawn task
        if task:
            full_task = f"{system_prompt}\n\n---\n\n# CURRENT TASK\n\n{task}"
        else:
            full_task = f"{system_prompt}\n\n---\n\n# READY\n\nAgent hazır. Görev bekleniyor."
        
        # For now, return the spawn config - actual spawning will be done via Khanate
        spawn_config = {
            "success": True,
            "key": key,
            "instance": instance.to_dict(),
            "spawn_params": {
                "task": full_task,
                "model": metadata.get("model", "sonnet"),
                "label": f"agent-{project_id}-{agent_id}"
            }
        }
        
        # Update status
        self.registry.update_status(key, AgentStatus.RUNNING)
        
        return spawn_config
    
    def stop(self, world_id: str, env_id: str, project_id: str, agent_id: str) -> Dict:
        """Stop an agent instance"""
        key = f"{world_id}/{env_id}/{project_id}/{agent_id}"
        instance = self.registry.get(key)
        
        if not instance:
            return {"success": False, "error": "Agent not found in registry"}
        
        # Update status
        self.registry.update_status(key, AgentStatus.STOPPED)
        
        return {"success": True, "key": key, "status": "stopped"}
    
    def status(self, world_id: str = None, env_id: str = None, 
               project_id: str = None, agent_id: str = None) -> Dict:
        """Get agent status"""
        
        if agent_id:
            # Specific agent
            key = f"{world_id}/{env_id}/{project_id}/{agent_id}"
            instance = self.registry.get(key)
            if instance:
                return {"success": True, "agent": instance.to_dict()}
            return {"success": False, "error": "Agent not found"}
        
        elif project_id:
            # All agents in project
            agents = self.registry.list_by_project(world_id, env_id, project_id)
            return {"success": True, "agents": [a.to_dict() for a in agents]}
        
        else:
            # All agents
            agents = self.registry.list_all()
            return {"success": True, "agents": [a.to_dict() for a in agents]}
    
    def list_running(self) -> List[Dict]:
        """List all running agents"""
        return [a.to_dict() for a in self.registry.list_running()]


# =========== CLI ===========

if __name__ == "__main__":
    import sys
    
    spawner = AgentSpawner()
    
    if len(sys.argv) < 2:
        print("Usage: agent_spawner.py <command> [args]")
        print("Commands: spawn, stop, status, list")
        sys.exit(1)
    
    cmd = sys.argv[1]
    
    if cmd == "spawn" and len(sys.argv) >= 6:
        world_id, env_id, project_id, agent_id = sys.argv[2:6]
        task = sys.argv[6] if len(sys.argv) > 6 else None
        result = spawner.spawn(world_id, env_id, project_id, agent_id, task)
        print(json.dumps(result, indent=2))
    
    elif cmd == "stop" and len(sys.argv) >= 6:
        world_id, env_id, project_id, agent_id = sys.argv[2:6]
        result = spawner.stop(world_id, env_id, project_id, agent_id)
        print(json.dumps(result, indent=2))
    
    elif cmd == "status":
        if len(sys.argv) >= 6:
            world_id, env_id, project_id, agent_id = sys.argv[2:6]
            result = spawner.status(world_id, env_id, project_id, agent_id)
        elif len(sys.argv) >= 5:
            world_id, env_id, project_id = sys.argv[2:5]
            result = spawner.status(world_id, env_id, project_id)
        else:
            result = spawner.status()
        print(json.dumps(result, indent=2))
    
    elif cmd == "list":
        agents = spawner.list_running()
        print(json.dumps({"running_agents": agents}, indent=2))
    
    else:
        print(f"Unknown command or missing args: {cmd}")
        sys.exit(1)
