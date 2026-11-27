#!/usr/bin/env bash
# Roda no servidor. Compara a imagem montada no GitHub com a que esta no ar e
# imprime so contagens e NOMES de chaves: o log e publico.
set -euo pipefail
nova="$1"
atual="$2"

extrair() {
  docker run --rm --network none --entrypoint node "$1" -e '
    const fs = require("fs"), path = require("path")
    const lista = (d) => fs.existsSync(d)
      ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? lista(path.join(d, e.name)) : [path.join(d, e.name)])
      : []
    const estaticos = lista("/app/.next/static")
    console.log(JSON.stringify({
      paginasHtml: lista("/app/.next/server").filter((f) => f.endsWith(".html")).length,
      arquivosEstaticos: estaticos.length,
      comMarcaDoSentry: estaticos.filter((f) => f.endsWith(".js") && fs.readFileSync(f, "utf8").includes("_sentryDebugIds")).length,
      sourceMaps: lista("/app/.next").filter((f) => f.endsWith(".map")).length,
      config: JSON.parse(fs.readFileSync("/app/.next/required-server-files.json", "utf8")).config,
    }))
  '
}

pasta="$(mktemp -d)"
trap 'rm -f "$pasta/nova.json" "$pasta/atual.json"; rmdir "$pasta"' EXIT
extrair "$nova" > "$pasta/nova.json"
extrair "$atual" > "$pasta/atual.json"
for imagem in "$atual" "$nova"; do
  docker image inspect "$imagem" --format '{{.Architecture}} {{.Size}} bytes, rotulos: {{len .Config.Labels}}'
done

python3 -I - "$pasta/atual.json" "$pasta/nova.json" <<'PY'
import json, sys

atual, nova = (json.load(open(arquivo)) for arquivo in sys.argv[1:3])

for chave in ("paginasHtml", "arquivosEstaticos", "comMarcaDoSentry", "sourceMaps"):
    print(f"{chave}: no ar={atual[chave]} github={nova[chave]}")

def achatar(valor, prefixo=""):
    if isinstance(valor, dict) and valor:
        saida = {}
        for nome, item in valor.items():
            saida.update(achatar(item, f"{prefixo}.{nome}" if prefixo else nome))
        return saida
    return {prefixo: json.dumps(valor, sort_keys=True)}

a, b = achatar(atual["config"]), achatar(nova["config"])
diferentes = sorted(chave for chave in a.keys() | b.keys() if a.get(chave) != b.get(chave))
print(f"configuracao: {len(diferentes)} chave(s) diferente(s) de {len(a.keys() | b.keys())}")
for chave in diferentes:
    print(f"  - {chave}")
PY
