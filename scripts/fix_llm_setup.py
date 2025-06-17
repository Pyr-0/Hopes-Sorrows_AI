#!/usr/bin/env python3
"""
LLM Setup Fix Script
Helps configure OpenAI API key and test LLM functionality.
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt
import re

console = Console()

def check_env_file():
    """Check if .env file exists and create if needed"""
    env_path = ".env"
    template_path = "env.template"
    
    if not os.path.exists(env_path):
        if os.path.exists(template_path):
            console.print("[yellow]📄 Creating .env file from template...[/yellow]")
            with open(template_path, 'r') as template:
                content = template.read()
            with open(env_path, 'w') as env_file:
                env_file.write(content)
            console.print("[green]✅ .env file created successfully[/green]")
        else:
            console.print("[red]❌ No env.template found. Creating basic .env file...[/red]")
            with open(env_path, 'w') as env_file:
                env_file.write("# Hopes & Sorrows Environment Configuration\n")
                env_file.write("ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here\n")
                env_file.write("OPENAI_API_KEY=your_openai_api_key_here\n")
            console.print("[green]✅ Basic .env file created[/green]")
    
    return env_path

def read_env_file(env_path):
    """Read current environment variables from .env file"""
    env_vars = {}
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key.strip()] = value.strip()
    return env_vars

def update_env_file(env_path, env_vars):
    """Update .env file with new variables"""
    lines = []
    
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            lines = f.readlines()
    
    # Update existing lines or add new ones
    updated_keys = set()
    for i, line in enumerate(lines):
        line_stripped = line.strip()
        if line_stripped and not line_stripped.startswith('#') and '=' in line_stripped:
            key = line_stripped.split('=', 1)[0].strip()
            if key in env_vars:
                lines[i] = f"{key}={env_vars[key]}\n"
                updated_keys.add(key)
    
    # Add new keys that weren't found
    for key, value in env_vars.items():
        if key not in updated_keys:
            lines.append(f"{key}={value}\n")
    
    # Write back to file
    with open(env_path, 'w') as f:
        f.writelines(lines)

def validate_openai_key(api_key):
    """Validate OpenAI API key format"""
    if not api_key:
        return False, "API key is empty"
    
    if api_key == "your_openai_api_key_here":
        return False, "Please replace placeholder with actual API key"
    
    # Check basic format
    if not api_key.startswith("sk-"):
        return False, "OpenAI API keys should start with 'sk-'"
    
    if len(api_key) < 40:
        return False, "API key appears too short"
    
    return True, "Format looks correct"

def test_openai_api(api_key):
    """Test OpenAI API key by making a simple request"""
    try:
        import openai
        client = openai.OpenAI(api_key=api_key)
        
        # Make a minimal test request
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": "Hello"}],
            max_tokens=5
        )
        return True, "API key is working!"
    except Exception as e:
        error_msg = str(e)
        if "401" in error_msg or "invalid_api_key" in error_msg:
            return False, "Invalid API key"
        elif "insufficient_quota" in error_msg:
            return False, "API quota exceeded - check billing"
        elif "rate_limit" in error_msg:
            return False, "Rate limit exceeded - try again later"
        else:
            return False, f"API test failed: {error_msg}"

def main():
    """Main setup function"""
    console.print(Panel.fit(
        "[bold cyan]🔧 LLM SETUP ASSISTANT[/bold cyan]\n"
        "Helping you configure OpenAI API key for enhanced sentiment analysis...",
        border_style="cyan",
        padding=(1, 2)
    ))
    
    # Check/create .env file
    env_path = check_env_file()
    env_vars = read_env_file(env_path)
    
    # Check current OpenAI key
    current_openai_key = env_vars.get("OPENAI_API_KEY", "")
    
    console.print(f"\n[bold cyan]📋 Current Configuration:[/bold cyan]")
    console.print(f"AssemblyAI Key: {'✅ Configured' if env_vars.get('ASSEMBLYAI_API_KEY', '').replace('your_assemblyai_api_key_here', '') else '❌ Not configured'}")
    console.print(f"OpenAI Key: {'✅ Configured' if current_openai_key.replace('your_openai_api_key_here', '') else '❌ Not configured'}")
    
    # Validate current OpenAI key
    if current_openai_key and current_openai_key != "your_openai_api_key_here":
        is_valid, message = validate_openai_key(current_openai_key)
        console.print(f"Current OpenAI Key: {message}")
        
        if is_valid:
            console.print("\n[yellow]🧪 Testing current API key...[/yellow]")
            works, test_message = test_openai_api(current_openai_key)
            if works:
                console.print(f"[green]✅ {test_message}[/green]")
                console.print("\n[bold green]🎉 Your LLM is already configured and working![/bold green]")
                return
            else:
                console.print(f"[red]❌ {test_message}[/red]")
    
    # Need to configure/fix OpenAI key
    console.print("\n[bold yellow]🔑 OpenAI API Key Configuration Needed[/bold yellow]")
    console.print("\n[cyan]To get your OpenAI API key:[/cyan]")
    console.print("[cyan]1. Go to https://platform.openai.com/api-keys[/cyan]")
    console.print("[cyan]2. Click 'Create new secret key'[/cyan]")
    console.print("[cyan]3. Copy the key (starts with 'sk-')[/cyan]")
    console.print("[cyan]4. Paste it below[/cyan]")
    
    # Prompt for new API key
    while True:
        new_key = Prompt.ask("\n[bold]Enter your OpenAI API key (or 'skip' to continue without LLM)")
        
        if new_key.lower() == 'skip':
            console.print("[yellow]⚠️ Skipping LLM configuration. System will work with transformer-only analysis.[/yellow]")
            break
        
        # Validate new key
        is_valid, message = validate_openai_key(new_key)
        if not is_valid:
            console.print(f"[red]❌ {message}[/red]")
            continue
        
        # Test new key
        console.print("[yellow]🧪 Testing API key...[/yellow]")
        works, test_message = test_openai_api(new_key)
        
        if works:
            console.print(f"[green]✅ {test_message}[/green]")
            
            # Update .env file
            env_vars["OPENAI_API_KEY"] = new_key
            update_env_file(env_path, env_vars)
            
            console.print(f"[green]💾 Updated {env_path} with new API key[/green]")
            console.print("\n[bold green]🎉 LLM is now configured and working![/bold green]")
            break
        else:
            console.print(f"[red]❌ {test_message}[/red]")
            retry = Prompt.ask("Try another key? (y/n)", default="y")
            if retry.lower() != 'y':
                break
    
    # Final recommendations
    console.print("\n[bold cyan]💡 Next Steps:[/bold cyan]")
    console.print("[yellow]• Run 'python3 scripts/test_ai_pipeline.py' to verify all components[/yellow]")
    console.print("[yellow]• Upload an audio file to test the full pipeline[/yellow]")
    console.print("[yellow]• The web interface will now use enhanced LLM analysis when available[/yellow]")

if __name__ == "__main__":
    main() 