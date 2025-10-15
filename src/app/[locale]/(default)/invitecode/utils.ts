export function formatSegments(code: string) {
  return code.split("");
}

export function formatTemplate(
  template: string,
  vars: Record<string, string>
) {
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, key: string) => vars[key] ?? "");
}
