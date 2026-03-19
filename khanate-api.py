#!/usr/bin/env python3
"""
Khanate HTTP API Server

Simple HTTP wrapper for khanate CLI commands.
Runs on host, called by dashboard container.
"""

import json
import subprocess
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

PORT = 19100
KHANATE_CLI = "/usr/local/bin/khanate"


class KhanateHandler(BaseHTTPRequestHandler):
    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
    
    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        
        if path == "/health":
            self._send_json({"status": "ok"})
            return
        
        if path == "/status":
            result = self._run_khanate(["status"])
            self._send_json(result)
            return
        
        if path == "/agents":
            result = self._run_khanate(["agent", "list"])
            self._send_json(result)
            return
        
        if path == "/worlds":
            result = self._run_khanate(["world", "list"])
            self._send_json(result)
            return
        
        self._send_json({"error": "Not found"}, 404)
    
    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        
        # Read body
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode() if content_length > 0 else "{}"
        
        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            self._send_json({"error": "Invalid JSON"}, 400)
            return
        
        if path == "/agent/spawn":
            world_id = data.get("worldId")
            env_id = data.get("envId")
            project_id = data.get("projectId")
            agent_id = data.get("agentId")
            task = data.get("task", "")
            template = data.get("template")
            
            if not all([world_id, env_id, project_id, agent_id]):
                self._send_json({"error": "Missing required fields"}, 400)
                return
            
            cmd = ["agent", "spawn", world_id, env_id, project_id, agent_id]
            if task:
                cmd.extend(["--task", task])
            if template:
                cmd.extend(["--template", template])
            
            result = self._run_khanate(cmd)
            self._send_json(result)
            return
        
        if path == "/agent/stop":
            world_id = data.get("worldId")
            env_id = data.get("envId")
            project_id = data.get("projectId")
            agent_id = data.get("agentId")
            
            if not all([world_id, env_id, project_id, agent_id]):
                self._send_json({"error": "Missing required fields"}, 400)
                return
            
            cmd = ["agent", "stop", world_id, env_id, project_id, agent_id]
            result = self._run_khanate(cmd)
            self._send_json(result)
            return
        
        if path == "/agent/send":
            session_key = data.get("sessionKey")
            message = data.get("message")
            
            if not session_key or not message:
                self._send_json({"error": "sessionKey and message required"}, 400)
                return
            
            cmd = ["agent", "send", session_key, message]
            result = self._run_khanate(cmd)
            self._send_json(result)
            return
        
        if path == "/agent/set-status":
            world_id = data.get("worldId")
            env_id = data.get("envId")
            project_id = data.get("projectId")
            agent_id = data.get("agentId")
            status = data.get("status")
            
            if not all([world_id, env_id, project_id, agent_id, status]):
                self._send_json({"error": "Missing required fields"}, 400)
                return
            
            cmd = ["agent", "set-status", world_id, env_id, project_id, agent_id, status]
            result = self._run_khanate(cmd)
            self._send_json(result)
            return
        
        if path == "/agent/project-registry":
            world_id = data.get("worldId")
            env_id = data.get("envId")
            project_id = data.get("projectId")
            
            if not all([world_id, env_id, project_id]):
                self._send_json({"error": "Missing required fields"}, 400)
                return
            
            cmd = ["agent", "project-registry", world_id, env_id, project_id]
            result = self._run_khanate(cmd)
            self._send_json(result)
            return
        
        self._send_json({"error": "Not found"}, 404)
    
    def _run_khanate(self, args):
        try:
            result = subprocess.run(
                [KHANATE_CLI] + args,
                capture_output=True,
                text=True,
                timeout=60
            )
            
            try:
                return json.loads(result.stdout)
            except json.JSONDecodeError:
                if result.returncode != 0:
                    return {"success": False, "error": result.stderr or result.stdout}
                return {"success": True, "output": result.stdout}
                
        except subprocess.TimeoutExpired:
            return {"success": False, "error": "Command timed out"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def log_message(self, format, *args):
        print(f"[khanate-api] {args[0]}")


def main():
    server = HTTPServer(("0.0.0.0", PORT), KhanateHandler)
    print(f"Khanate API server running on port {PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        server.shutdown()


if __name__ == "__main__":
    main()
