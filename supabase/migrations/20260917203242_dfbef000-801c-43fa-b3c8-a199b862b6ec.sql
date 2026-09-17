UPDATE public.challenges
SET repos = '[
  {"name":"Sashiko","url":"https://github.com/tock/sashiko"},
  {"name":"MCP Python SDK","url":"https://github.com/modelcontextprotocol/python-sdk"},
  {"name":"Gradio","url":"https://github.com/gradio-app/gradio"},
  {"name":"PlatformIO Core","url":"https://github.com/platformio/platformio-core"},
  {"name":"marimo","url":"https://github.com/marimo-team/marimo"},
  {"name":"Open Food Facts app","url":"https://github.com/openfoodfacts/smooth-app"},
  {"name":"tldraw","url":"https://github.com/tldraw/tldraw"},
  {"name":"Grafana","url":"https://github.com/grafana/grafana"},
  {"name":"Penpot","url":"https://github.com/penpot/penpot"},
  {"name":"PostHog","url":"https://github.com/PostHog/posthog"}
]'::jsonb,
updated_at = now()
WHERE slug = '1';