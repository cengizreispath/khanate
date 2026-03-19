#!/usr/bin/env python3
"""
Khanate CLI - Command interface for Khan ↔ Khanate communication

Usage:
    khanate_cli.py <command> [args...]

Commands:
    # World/Environment/Project Management
    world list
    world create <id> <name>
    world get <id>
    
    env list <world_id>
    env create <world_id> <env_id> <name>
    env get <world_id> <env_id>
    
    project list <world_id> <env_id>
    project create <world_id> <env_id> <project_id> <name>
    project get <world_id> <env_id> <project_id>
    
    # Agent Management
    agent list [world_id] [env_id] [project_id]
    agent create <world_id> <env_id> <project_id> <agent_id> <name> <role>
    agent get <world_id> <env_id> <project_id> <agent_id>
    agent spawn <world_id> <env_id> <project_id> <agent_id> [task]
    agent stop <world_id> <env_id> <project_id> <agent_id>
    agent status
    
    # Memory
    memory add <path> <content>
    memory context <world_id> <env_id> <project_id> <agent_id>
    
    # System
    ping
    status
"""

import sys
import json
from pathlib import Path

# Add lib to path
sys.path.insert(0, str(Path(__file__).parent))

from memory_system import MemorySystem, get_data_dir
from agent_spawner import AgentSpawner, AgentRegistry

KHANATE_DIR = get_data_dir()


def success(data=None, message=None):
    result = {"success": True}
    if message:
        result["message"] = message
    if data:
        result["data"] = data
    return result


def error(message):
    return {"success": False, "error": message}


def _send_to_agent(session_key: str, message: str) -> dict:
    """Send a message to an agent via clawdbot agent command"""
    import subprocess
    import tempfile
    
    try:
        # Write message to temp file to avoid shell escaping
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write(message)
            msg_file = f.name
        
        cmd = [
            "clawdbot", "agent",
            "--session-id", session_key,
            "--message", f"@{msg_file}",
            "--json"
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        
        import os
        os.unlink(msg_file)
        
        if result.returncode != 0:
            return error(f"Failed to send: {result.stderr or result.stdout}")
        
        try:
            response = json.loads(result.stdout)
            return success(data=response, message="Message sent")
        except json.JSONDecodeError:
            return success(data={"raw": result.stdout}, message="Message sent")
            
    except subprocess.TimeoutExpired:
        return error("Command timed out")
    except Exception as e:
        return error(str(e))


def main():
    if len(sys.argv) < 2:
        print(json.dumps(error("No command provided. Use: khanate_cli.py <command> [args]")))
        sys.exit(1)
    
    cmd = sys.argv[1]
    args = sys.argv[2:]
    
    memory = MemorySystem()
    spawner = AgentSpawner()
    
    try:
        result = handle_command(cmd, args, memory, spawner)
        print(json.dumps(result, indent=2, ensure_ascii=False))
    except Exception as e:
        print(json.dumps(error(str(e))))
        sys.exit(1)


def handle_command(cmd, args, memory, spawner):
    
    # ============ SYSTEM ============
    
    if cmd == "ping":
        return success(message="pong", data={"status": "alive", "version": "0.1.0"})
    
    if cmd == "status":
        worlds = memory.list_worlds()
        running = spawner.list_running()
        return success(data={
            "worlds": len(worlds),
            "running_agents": len(running),
            "agents": running
        })
    
    # ============ WORLD ============
    
    if cmd == "world":
        if not args:
            return error("world subcommand required: list, create, get")
        
        subcmd = args[0]
        
        if subcmd == "list":
            worlds = memory.list_worlds()
            return success(data={"worlds": worlds})
        
        if subcmd == "create" and len(args) >= 3:
            world_id, name = args[1], args[2]
            content = args[3] if len(args) > 3 else ""
            result = memory.create_world(world_id, name, content)
            return success(data=result, message=f"World '{name}' created")
        
        if subcmd == "get" and len(args) >= 2:
            world_id = args[1]
            result = memory.get_world(world_id)
            if result:
                return success(data=result)
            return error(f"World '{world_id}' not found")
        
        if subcmd == "update" and len(args) >= 2:
            world_id = args[1]
            name = description = metadata = None
            for arg in args[2:]:
                if arg.startswith("--name="):
                    name = arg.split("=", 1)[1].strip('"')
                elif arg.startswith("--description="):
                    description = arg.split("=", 1)[1].strip('"')
                elif arg.startswith("--metadata="):
                    import json
                    metadata = json.loads(arg.split("=", 1)[1].strip('"').replace('\\"', '"'))
            result = memory.update_world(world_id, name, description, metadata)
            return success(data=result, message="World updated")
        
        if subcmd == "delete" and len(args) >= 2:
            world_id = args[1]
            result = memory.delete_world(world_id)
            return success(data=result, message="World deleted")
        
        return error(f"Unknown world subcommand: {subcmd}")
    
    # ============ ENVIRONMENT ============
    
    if cmd == "env":
        if not args:
            return error("env subcommand required: list, create, get")
        
        subcmd = args[0]
        
        if subcmd == "list" and len(args) >= 2:
            world_id = args[1]
            envs = memory.list_environments(world_id)
            return success(data={"environments": envs, "world": world_id})
        
        if subcmd == "create" and len(args) >= 4:
            world_id, env_id, name = args[1], args[2], args[3]
            content = args[4] if len(args) > 4 else ""
            result = memory.create_environment(world_id, env_id, name, content)
            return success(data=result, message=f"Environment '{name}' created")
        
        if subcmd == "get" and len(args) >= 3:
            world_id, env_id = args[1], args[2]
            result = memory.get_environment(world_id, env_id)
            if result:
                return success(data=result)
            return error(f"Environment '{env_id}' not found")
        
        if subcmd == "update" and len(args) >= 3:
            world_id, env_id = args[1], args[2]
            name = description = metadata = None
            for arg in args[3:]:
                if arg.startswith("--name="):
                    name = arg.split("=", 1)[1].strip('"')
                elif arg.startswith("--description="):
                    description = arg.split("=", 1)[1].strip('"')
                elif arg.startswith("--metadata="):
                    import json
                    metadata = json.loads(arg.split("=", 1)[1].strip('"').replace('\\"', '"'))
            result = memory.update_environment(world_id, env_id, name, description, metadata)
            return success(data=result, message="Environment updated")
        
        if subcmd == "delete" and len(args) >= 3:
            world_id, env_id = args[1], args[2]
            result = memory.delete_environment(world_id, env_id)
            return success(data=result, message="Environment deleted")
        
        return error(f"Unknown env subcommand: {subcmd}")
    
    # ============ PROJECT ============
    
    if cmd == "project":
        if not args:
            return error("project subcommand required: list, create, get")
        
        subcmd = args[0]
        
        if subcmd == "list" and len(args) >= 3:
            world_id, env_id = args[1], args[2]
            projects = memory.list_projects(world_id, env_id)
            return success(data={"projects": projects, "environment": env_id, "world": world_id})
        
        if subcmd == "create" and len(args) >= 5:
            world_id, env_id, project_id, name = args[1], args[2], args[3], args[4]
            content = args[5] if len(args) > 5 else ""
            result = memory.create_project(world_id, env_id, project_id, name, content)
            return success(data=result, message=f"Project '{name}' created")
        
        if subcmd == "get" and len(args) >= 4:
            world_id, env_id, project_id = args[1], args[2], args[3]
            result = memory.get_project(world_id, env_id, project_id)
            if result:
                return success(data=result)
            return error(f"Project '{project_id}' not found")
        
        if subcmd == "update" and len(args) >= 4:
            world_id, env_id, project_id = args[1], args[2], args[3]
            # Parse --name, --description, --metadata flags
            name = description = metadata = None
            for arg in args[4:]:
                if arg.startswith("--name="):
                    name = arg.split("=", 1)[1].strip('"')
                elif arg.startswith("--description="):
                    description = arg.split("=", 1)[1].strip('"')
                elif arg.startswith("--metadata="):
                    import json
                    metadata = json.loads(arg.split("=", 1)[1].strip('"').replace('\\"', '"'))
            result = memory.update_project(world_id, env_id, project_id, name, description, metadata)
            return success(data=result, message="Project updated")
        
        if subcmd == "delete" and len(args) >= 4:
            world_id, env_id, project_id = args[1], args[2], args[3]
            result = memory.delete_project(world_id, env_id, project_id)
            return success(data=result, message="Project deleted")
        
        return error(f"Unknown project subcommand: {subcmd}")
    
    # ============ AGENT ============
    
    if cmd == "agent":
        if not args:
            return error("agent subcommand required: list, create, get, spawn, stop, status")
        
        subcmd = args[0]
        
        if subcmd == "list":
            if len(args) >= 4:
                world_id, env_id, project_id = args[1], args[2], args[3]
                agent_ids = memory.list_agents(world_id, env_id, project_id)
                # Get full details for each agent
                agents = []
                for agent_id in agent_ids:
                    agent_data = memory.get_agent(world_id, env_id, project_id, agent_id)
                    if agent_data:
                        # Check registry for status
                        key = f"{world_id}/{env_id}/{project_id}/{agent_id}"
                        registry_entry = spawner.registry.get(key)
                        agents.append({
                            "id": agent_id,
                            "name": agent_data.get("metadata", {}).get("name", agent_id),
                            "role": agent_data.get("metadata", {}).get("role", "agent"),
                            "status": registry_entry.status if registry_entry else "stopped",
                            "model": agent_data.get("metadata", {}).get("model", "claude-sonnet-4")
                        })
                return success(data={"agents": agents, "project": project_id})
            else:
                result = spawner.status()
                return success(data=result.get("agents", []))
        
        if subcmd == "create" and len(args) >= 7:
            world_id, env_id, project_id, agent_id, name, role = args[1:7]
            skills = args[7].split(",") if len(args) > 7 else []
            result = memory.create_agent(world_id, env_id, project_id, agent_id, name, role, skills=skills)
            return success(data=result, message=f"Agent '{name}' created")
        
        if subcmd == "get" and len(args) >= 5:
            world_id, env_id, project_id, agent_id = args[1:5]
            result = memory.get_agent(world_id, env_id, project_id, agent_id)
            if result:
                return success(data=result)
            return error(f"Agent '{agent_id}' not found")
        
        if subcmd == "spawn" and len(args) >= 5:
            world_id, env_id, project_id, agent_id = args[1:5]
            task = None
            template = None
            # Parse remaining args
            for i, arg in enumerate(args[5:], 5):
                if arg.startswith("--template="):
                    template = arg.split("=", 1)[1]
                elif arg.startswith("--task="):
                    task = arg.split("=", 1)[1]
                elif i == 5 and not arg.startswith("--"):
                    # Legacy: 6th arg is task
                    task = arg
            result = spawner.spawn(world_id, env_id, project_id, agent_id, task=task, template=template)
            return result  # Already formatted
        
        if subcmd == "stop" and len(args) >= 5:
            world_id, env_id, project_id, agent_id = args[1:5]
            result = spawner.stop(world_id, env_id, project_id, agent_id)
            return result
        
        if subcmd == "status":
            if len(args) >= 5:
                world_id, env_id, project_id, agent_id = args[1:5]
                result = spawner.status(world_id, env_id, project_id, agent_id)
            else:
                result = spawner.status()
            return result
        
        if subcmd == "send" and len(args) >= 3:
            # Send message to agent via sessions_send
            session_key = args[1]
            message = " ".join(args[2:])
            result = _send_to_agent(session_key, message)
            return result
        
        if subcmd == "set-status" and len(args) >= 6:
            # Update agent status (idle, busy, etc)
            world_id, env_id, project_id, agent_id, new_status = args[1:6]
            key = f"{world_id}/{env_id}/{project_id}/{agent_id}"
            from agent_spawner import AgentStatus
            try:
                status_enum = AgentStatus(new_status)
                spawner.registry.update_status(key, status_enum)
                return success(message=f"Status updated to {new_status}")
            except ValueError:
                return error(f"Invalid status: {new_status}. Valid: stopped, idle, busy, error")
        
        if subcmd == "project-registry" and len(args) >= 4:
            # Get simplified registry for orchestrator
            world_id, env_id, project_id = args[1:4]
            registry = spawner.registry.get_project_registry(world_id, env_id, project_id)
            return success(data={"agents": registry, "project": project_id})
        
        return error(f"Unknown agent subcommand: {subcmd}")
    
    # ============ CONTENT ============
    
    if cmd == "content":
        if not args:
            return error("content subcommand required: get, set")
        
        subcmd = args[0]
        
        if subcmd == "get" and len(args) >= 3:
            entity_type = args[1]  # world, environment, project
            if entity_type == "project" and len(args) >= 5:
                world_id, env_id, project_id = args[2], args[3], args[4]
                result = memory.get_project(world_id, env_id, project_id)
                if result:
                    return success(data={"content": result.get("content", ""), "metadata": result.get("metadata", {})})
                return error("Project not found")
            elif entity_type == "world" and len(args) >= 3:
                world_id = args[2]
                result = memory.get_world(world_id)
                if result:
                    return success(data={"content": result.get("content", ""), "metadata": result.get("metadata", {})})
                return error("World not found")
            elif entity_type == "environment" and len(args) >= 4:
                world_id, env_id = args[2], args[3]
                result = memory.get_environment(world_id, env_id)
                if result:
                    return success(data={"content": result.get("content", ""), "metadata": result.get("metadata", {})})
                return error("Environment not found")
        
        if subcmd == "set" and len(args) >= 3:
            entity_type = args[1]
            # Parse --base64 flag
            base64_content = None
            for arg in args:
                if arg.startswith("--base64="):
                    import base64
                    base64_content = base64.b64decode(arg.split("=", 1)[1]).decode('utf-8')
            
            if entity_type == "project" and len(args) >= 5 and base64_content:
                world_id, env_id, project_id = args[2], args[3], args[4]
                result = memory.update_project_content(world_id, env_id, project_id, base64_content)
                return success(data=result, message="Content updated")
            elif entity_type == "world" and len(args) >= 3 and base64_content:
                world_id = args[2]
                result = memory.update_world_content(world_id, base64_content)
                return success(data=result, message="Content updated")
            elif entity_type == "environment" and len(args) >= 4 and base64_content:
                world_id, env_id = args[2], args[3]
                result = memory.update_environment_content(world_id, env_id, base64_content)
                return success(data=result, message="Content updated")
        
        return error(f"Unknown content subcommand: {subcmd}")
    
    # ============ MEMORY ============
    
    if cmd == "memory":
        if not args:
            return error("memory subcommand required: list, get, add, set, context")
        
        subcmd = args[0]
        
        if subcmd == "list" and len(args) >= 3:
            entity_type = args[1]
            if entity_type == "project" and len(args) >= 5:
                world_id, env_id, project_id = args[2], args[3], args[4]
                files = memory.list_memory_files_generic("project", world_id, env_id, project_id)
                return success(data={"files": files})
            elif entity_type == "world" and len(args) >= 3:
                world_id = args[2]
                files = memory.list_memory_files_generic("world", world_id)
                return success(data={"files": files})
            elif entity_type == "environment" and len(args) >= 4:
                world_id, env_id = args[2], args[3]
                files = memory.list_memory_files_generic("environment", world_id, env_id)
                return success(data={"files": files})
            return error("Invalid arguments for memory list")
        
        if subcmd == "get" and len(args) >= 4:
            entity_type = args[1]
            if entity_type == "project" and len(args) >= 6:
                world_id, env_id, project_id, filename = args[2], args[3], args[4], args[5]
                content = memory.get_memory_file_generic("project", filename, world_id, env_id, project_id)
                return success(data={"content": content, "filename": filename})
            elif entity_type == "world" and len(args) >= 4:
                world_id, filename = args[2], args[3]
                content = memory.get_memory_file_generic("world", filename, world_id)
                return success(data={"content": content, "filename": filename})
            elif entity_type == "environment" and len(args) >= 5:
                world_id, env_id, filename = args[2], args[3], args[4]
                content = memory.get_memory_file_generic("environment", filename, world_id, env_id)
                return success(data={"content": content, "filename": filename})
            return error("Invalid arguments for memory get")
        
        if subcmd == "add" and len(args) >= 4:
            entity_type = args[1]
            if entity_type == "project" and len(args) >= 6:
                world_id, env_id, project_id = args[2], args[3], args[4]
                content = args[5]
                proj_path = memory.worlds_dir / world_id / "environments" / env_id / "projects" / project_id
                result = memory.add_memory(proj_path, content)
                return success(data={"file": result}, message="Memory added")
            elif entity_type == "world" and len(args) >= 4:
                world_id = args[2]
                content = args[3]
                world_path = memory.worlds_dir / world_id
                result = memory.add_memory(world_path, content)
                return success(data={"file": result}, message="Memory added")
            elif entity_type == "environment" and len(args) >= 5:
                world_id, env_id = args[2], args[3]
                content = args[4]
                env_path = memory.worlds_dir / world_id / "environments" / env_id
                result = memory.add_memory(env_path, content)
                return success(data={"file": result}, message="Memory added")
            return error("Invalid arguments for memory add")
        
        if subcmd == "set" and len(args) >= 4:
            entity_type = args[1]
            # Parse --base64 flag
            base64_content = None
            for arg in args:
                if arg.startswith("--base64="):
                    import base64
                    base64_content = base64.b64decode(arg.split("=", 1)[1]).decode('utf-8')
            
            if entity_type == "project" and len(args) >= 6 and base64_content:
                world_id, env_id, project_id, filename = args[2], args[3], args[4], args[5]
                result = memory.set_memory_file_generic("project", filename, base64_content, world_id, env_id, project_id)
                return success(data=result, message="Memory file updated")
            elif entity_type == "world" and len(args) >= 4 and base64_content:
                world_id, filename = args[2], args[3]
                result = memory.set_memory_file_generic("world", filename, base64_content, world_id)
                return success(data=result, message="Memory file updated")
            elif entity_type == "environment" and len(args) >= 5 and base64_content:
                world_id, env_id, filename = args[2], args[3], args[4]
                result = memory.set_memory_file_generic("environment", filename, base64_content, world_id, env_id)
                return success(data=result, message="Memory file updated")
            return error("Invalid arguments for memory set")
        
        if subcmd == "context" and len(args) >= 5:
            world_id, env_id, project_id, agent_id = args[1:5]
            context = memory.build_agent_context(world_id, env_id, project_id, agent_id)
            return success(data={"context": context, "length": len(context)})
        
        return error(f"Unknown memory subcommand: {subcmd}")
    
    # ============ UNKNOWN ============
    
    return error(f"Unknown command: {cmd}")


if __name__ == "__main__":
    main()
